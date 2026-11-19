import type {
  AllocationMap,
  ForecastPoint,
  RainType,
  ScenarioResult,
  SceneId,
  SimulationEvent,
  SimulationResult,
  TriggeredSynergy,
} from '@/types'
import { FLOW_LINKS, RAIN_TYPES, RULES_VERSION, SCENARIOS, SCENARIO_MAP, STAGE_LABELS } from '@/config/sites'

/**
 * 预览引擎（PREVIEW ONLY）
 * ---------------------------------------------------------------
 * 用途：主界面「预期效果预览」在真实接口就绪前需要一个能随分配即时变化的
 * 确定性结果源。规则版本 rain-five-v1-preview，参数集中在文件顶部常量。
 *
 * 纪律：
 * 1. 确定性——同输入同输出，无随机数。
 * 2. 诚实简化——输出的是项目自定义 0–100 简化指标，不是工程水文学结果。
 * 3. 唯一计算入口——组件/视图不得自行计算分数，一律读本模块结果。
 * 4. 上线后由 POST /api/simulations/run 替换，组件零改动。
 */

/** 场景本地暴露度：总量型 / 峰值型两维 */
const EXPOSURE: Record<SceneId, { volume: number; peak: number }> = {
  school: { volume: 0.58, peak: 0.62 },
  market: { volume: 0.66, peak: 0.7 },
  park: { volume: 0.5, peak: 0.46 },
  residential: { volume: 0.7, peak: 0.66 },
  station: { volume: 0.78, peak: 0.94 },
}

/** 汇流折减：上游残余径流经管道输送后的到达比例 */
const CONVEY_LOSS = 0.32

/** 评分权重：各场景对总分的贡献（合计 1） */
const SCORE_WEIGHTS: Record<SceneId, number> = {
  school: 0.18,
  market: 0.16,
  park: 0.2,
  residential: 0.2,
  station: 0.26,
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const round1 = (v: number) => Math.round(v * 10) / 10

export const EMPTY_ALLOCATION: AllocationMap = {
  school: 0,
  market: 0,
  park: 0,
  residential: 0,
  station: 0,
}

export const BASELINE_ALLOCATION: AllocationMap = {
  school: 1,
  market: 1,
  park: 1,
  residential: 1,
  station: 1,
}

export const totalAllocated = (a: AllocationMap): number =>
  SCENARIOS.reduce((sum, s) => sum + a[s.id], 0)

/** 校验：每场景 0–5 整数，总和恰好 = 5（规格书 §3.1） */
export function validateAllocation(a: AllocationMap): string | null {
  for (const s of SCENARIOS) {
    const v = a[s.id]
    if (!Number.isInteger(v) || v < 0 || v > 5) return `${s.name}投入必须为 0–5 的整数`
  }
  const total = totalAllocated(a)
  if (total < 5) return `还需分配 ${5 - total} 点：推演要求 5 点恰好分完`
  if (total > 5) return `超出 ${total - 5} 点：请从其他场景收回`
  return null
}

/** 策略类型识别：优先级 专精 → 双核 → 均衡 → 偏科 → 多元（确定性，无随机） */
export function detectStrategy(a: AllocationMap): string {
  const values = SCENARIOS.map((s) => a[s.id]).sort((x, y) => y - x)
  const [first, second] = values
  if (first >= 4) return '专精型'
  if (first >= 3 && second >= 2) return '双核型'
  if (values.every((v) => v >= 1)) return '均衡型'
  if (first >= 3 && second <= 1) return '偏科型'
  return '多元型'
}

/** 阶段标签（规格书 §3.5） */
export const stageLabelOf = (level: number): string => STAGE_LABELS[Math.min(5, Math.max(0, level))]

interface SiteWater {
  load: number
  retained: number
  inflow: number
  total: number
  defense: number
}

const UPSTREAM: Record<SceneId, SceneId[]> = {
  school: [],
  market: [],
  park: ['school'],
  residential: ['market'],
  station: ['park', 'residential'],
}

function computeWater(a: AllocationMap, rainType: RainType): Record<SceneId, SiteWater> {
  const weights = RAIN_TYPES.find((r) => r.id === rainType)?.weights ?? { volume: 0.5, peak: 0.5 }
  const result = {} as Record<SceneId, SiteWater>

  for (const scene of SCENARIOS) {
    const exposure = EXPOSURE[scene.id]
    const load = round1((weights.volume * exposure.volume + weights.peak * exposure.peak) * 100) / 100
    const defense = scene.yieldCurve[Math.min(5, Math.max(0, a[scene.id]))]
    const retained = load * (1 - defense)
    let inflow = 0
    for (const up of UPSTREAM[scene.id]) {
      const upstream = result[up]
      if (upstream) inflow += upstream.retained * SCENARIO_MAP[up].transfer * CONVEY_LOSS
    }
    const total = retained + inflow
    result[scene.id] = { load, retained, inflow, total, defense }
  }
  return result
}

/** 联动规则：首版 3 条，阈值写在此处配置区，不散落到组件 */
export function evaluateSynergies(a: AllocationMap): TriggeredSynergy[] {
  const out: TriggeredSynergy[] = []
  if (a.park >= 3) {
    out.push({
      id: 'upstream-store',
      name: '上游调蓄',
      detail: `公园投入 ${a.park} 点达到阈值 3，下泄径流被调蓄削减`,
      gain: 0,
    })
  }
  if (a.park >= 2 && a.station >= 2) {
    out.push({
      id: 'store-drain',
      name: '排蓄协同',
      detail: `公园 ${a.park} 点 + 车站 ${a.station} 点，调蓄与排水形成协同`,
      gain: 0,
    })
  }
  if (SCENARIOS.every((s) => a[s.id] >= 1)) {
    out.push({
      id: 'balanced',
      name: '全域均衡',
      detail: '五场景均有投入，无防护真空区',
      gain: 0,
    })
  }
  return out
}

const SYNERGY_GAIN: Record<string, number> = {
  'upstream-store': 3.2,
  'store-drain': 4.4,
  balanced: 2.6,
}

const FORECAST_STEPS = ['入流', '坡面汇流', '上游调蓄', '下游汇流', '车站峰值', '退水'] as const
const FORECAST_FACTORS = [0.22, 0.55, 0.78, 0.92, 1, 0.68]

function runCore(a: AllocationMap, rainType: RainType) {
  const water = computeWater(a, rainType)
  const synergyIds = evaluateSynergies(a).map((s) => s.id)

  const safety: Record<SceneId, number> = {} as Record<SceneId, number>
  for (const scene of SCENARIOS) {
    const w = water[scene.id]
    const penalty = clamp01(w.total / 2.0)
    safety[scene.id] = Math.round(100 * (1 - penalty))
  }

  const base = SCENARIOS.reduce((sum, s) => sum + safety[s.id] * SCORE_WEIGHTS[s.id], 0)
  const synergyTotal = synergyIds.reduce((sum, id) => sum + (SYNERGY_GAIN[id] ?? 0), 0)
  const stationPressure = Math.round(clamp01(water.station.total / 2.2) * 100)
  const waterlogRisk = Math.round(clamp01(water.station.total / 2.0) * 100)
  const lossRisk = Math.round(
    clamp01((water.market.total * 0.5 + water.residential.total * 0.5) / 2.0) * 100,
  )
  const drainageLoad = Math.round(clamp01((water.station.retained + water.station.inflow) / 2.1) * 100)

  const score = Math.max(
    0,
    Math.min(100, Math.round(base + synergyTotal - Math.max(0, waterlogRisk - 88) * 0.28)),
  )

  return { water, safety, score, stationPressure, waterlogRisk, lossRisk, drainageLoad, synergyIds }
}

function buildForecast(rainType: RainType, waterlogRisk: number, lossRisk: number): ForecastPoint[] {
  const weights = RAIN_TYPES.find((r) => r.id === rainType)?.weights ?? { volume: 0.5, peak: 0.5 }
  return FORECAST_STEPS.map((step, i) => {
    const factor = FORECAST_FACTORS[i]
    return {
      step,
      waterlog: Math.round(Math.min(100, waterlogRisk * factor * (0.86 + weights.peak * 0.28))),
      loss: Math.round(Math.min(100, lossRisk * factor * (0.82 + weights.volume * 0.3))),
    }
  })
}

function gradeOf(score: number): { grade: string; gradeLabel: string } {
  if (score >= 85) return { grade: 'S', gradeLabel: '韧性优秀' }
  if (score >= 72) return { grade: 'A', gradeLabel: '韧性良好' }
  if (score >= 58) return { grade: 'B', gradeLabel: '基本可控' }
  if (score >= 42) return { grade: 'C', gradeLabel: '存在缺口' }
  return { grade: 'D', gradeLabel: '风险突出' }
}

function buildEvents(
  a: AllocationMap,
  rainType: RainType,
  core: ReturnType<typeof runCore>,
  score: number,
): SimulationEvent[] {
  const rain = RAIN_TYPES.find((r) => r.id === rainType)!
  const events: SimulationEvent[] = []
  const push = (step: number, stepLabel: string, text: string, tone: SimulationEvent['tone'], sceneId?: SceneId) =>
    events.push({ index: events.length + 1, step, stepLabel, text, tone, sceneId })

  push(1, '雨型输入', `载入「${rain.name}」，峰值权重 ${Math.round(rain.weights.peak * 100)}%`, 'info')

  for (const scene of SCENARIOS.slice(0, 2)) {
    const w = core.water[scene.id]
    push(
      2,
      '场景防护',
      `${scene.name}投入 ${a[scene.id]} 点（${stageLabelOf(a[scene.id])}），本地防护达成 ${core.safety[scene.id]}`,
      a[scene.id] === 0 ? 'warn' : 'good',
      scene.id,
    )
    if (w.retained > 0.42) push(2, '场景防护', `${scene.name}仍有余水外溢，向${scene.id === 'school' ? '公园' : '居民区'}传递`, 'bad', scene.id)
  }

  const park = core.water.park
  push(
    3,
    '上游调蓄',
    `公园承接校园来水 ${Math.round(park.inflow * 100)}，调蓄后下泄 ${Math.round(park.retained * 100)}`,
    park.inflow > 0.3 && a.park < 3 ? 'warn' : 'info',
    'park',
  )

  const res = core.water.residential
  push(
    4,
    '下游汇流',
    `居民区承接集市来水 ${Math.round(res.inflow * 100)}，社区净安全度 ${core.safety.residential}`,
    res.inflow > 0.3 ? 'warn' : 'good',
    'residential',
  )

  const station = core.water.station
  push(
    5,
    '车站压力',
    `两路汇流 ${Math.round(station.inflow * 100)} 到达车站，排水压力指数 ${core.stationPressure}`,
    core.stationPressure > 70 ? 'bad' : core.stationPressure > 50 ? 'warn' : 'good',
    'station',
  )

  for (const id of core.synergyIds) {
    const synergy = evaluateSynergies(a).find((s) => s.id === id)!
    push(5, '联动判定', `触发「${synergy.name}」：${synergy.detail}`, 'good')
  }

  push(6, '最终结算', `综合韧性评分 ${score}，策略识别为${detectStrategy(a)}`, score >= 72 ? 'good' : 'info')
  return events
}

/** 主入口：与 POST /api/simulations/run 响应同构 */
export function runPreview(allocation: AllocationMap, rainType: RainType): SimulationResult {
  const validationMessage = validateAllocation(allocation)
  const core = runCore(allocation, rainType)
  const baseline = runCore(BASELINE_ALLOCATION, rainType)
  const { grade, gradeLabel } = gradeOf(core.score)

  const scenarioResults: ScenarioResult[] = SCENARIOS.map((scene) => {
    const w = core.water[scene.id]
    const delta = core.safety[scene.id] - baseline.safety[scene.id]
    return {
      sceneId: scene.id,
      sceneName: scene.name,
      invested: allocation[scene.id],
      stageLabel: stageLabelOf(allocation[scene.id]),
      coverage: Math.round(w.defense * 100),
      effective: core.safety[scene.id],
      inflow: Math.round(w.inflow * 100),
      outflow: Math.round(w.retained * 100),
      deltaValue: delta,
      deltaText: delta === 0 ? '与基准持平' : delta > 0 ? `比基准高 ${delta}` : `比基准低 ${-delta}`,
    }
  })

  const synergies = evaluateSynergies(allocation).map((s) => ({ ...s, gain: SYNERGY_GAIN[s.id] ?? 0 }))

  const weakest = [...scenarioResults].sort((x, y) => x.effective - y.effective)[0]
  const strongest = [...scenarioResults].sort((x, y) => y.effective - x.effective)[0]
  const explanations = [
    {
      title: `${weakest.sceneName}是当前最薄弱环节`,
      body: `${weakest.sceneName}净安全度仅 ${weakest.effective}，投入 ${weakest.invested} 点（${weakest.stageLabel}），${
        weakest.inflow > 0 ? `另有 ${weakest.inflow} 的上游来水压在该处。` : '本地防护不足已直接体现为积水。'
      }`,
      evidence: `effective=${weakest.effective} · invested=${weakest.invested} · inflow=${weakest.inflow}`,
    },
    {
      title: `车站排水压力 ${core.stationPressure}`,
      body: `公园与居民区两路下泄 ${Math.round(core.water.station.inflow * 100)} 汇入车站，车站自身投入 ${allocation.station} 点，${
        core.stationPressure > 65
          ? '低于两路来水的叠加速度，压力集中体现为低洼积水。'
          : '排水能力基本覆盖汇流，压力处于可控区间。'
      }`,
      evidence: `stationPressure=${core.stationPressure} · inflow=${Math.round(core.water.station.inflow * 100)}`,
    },
    {
      title: synergies.length ? `触发 ${synergies.length} 条联动` : '本轮未触发联动',
      body: synergies.length
        ? `${synergies.map((s) => s.name).join('、')}共贡献 ${round1(synergies.reduce((sum, s) => sum + s.gain, 0))} 分。`
        : '五场景投入尚未达到联动阈值（公园≥3、公园≥2 且车站≥2、五场景均≥1）。',
      evidence: synergies.length ? synergies.map((s) => `${s.id}+${s.gain}`).join(' ') : 'synergy=none',
    },
    {
      title: `${strongest.sceneName}获得最多回报`,
      body: `在「${RAIN_TYPES.find((r) => r.id === rainType)!.name}」下，${strongest.sceneName}净安全度 ${strongest.effective}，是当前配置的主要收益来源。`,
      evidence: `effective=${strongest.effective}`,
    },
  ]

  const recommendations = SCENARIOS.map((scene) => {
    const source = SCENARIOS.filter((s) => s.id !== scene.id).sort(
      (x, y) => allocation[y.id] - allocation[x.id],
    )[0]
    if (allocation[source.id] <= 0) return { sceneId: scene.id, text: '', gain: 0 }
    const alt = { ...allocation, [scene.id]: allocation[scene.id] + 1, [source.id]: allocation[source.id] - 1 }
    const gain = runCore(alt, rainType).score - core.score
    return {
      sceneId: scene.id,
      text: `从${source.name}挪 1 点给${scene.name}（${allocation[source.id]}→${allocation[source.id] - 1} / ${allocation[scene.id]}→${allocation[scene.id] + 1}）`,
      gain,
    }
  })
    .filter((r) => r.text !== '')
    .sort((x, y) => y.gain - x.gain)
    .slice(0, 2)

  return {
    simulationId: `preview-${rainType}-${SCENARIOS.map((s) => allocation[s.id]).join('')}`,
    rainType,
    allocation: { ...allocation },
    overallScore: core.score,
    grade,
    gradeLabel,
    strategyType: detectStrategy(allocation),
    scenarioResults,
    riskMetrics: {
      waterlogRisk: core.waterlogRisk,
      lossRisk: core.lossRisk,
      stationPressure: core.stationPressure,
      drainageLoad: core.drainageLoad,
    },
    triggeredSynergies: synergies,
    forecast: buildForecast(rainType, core.waterlogRisk, core.lossRisk),
    events: buildEvents(allocation, rainType, core, core.score),
    explanations,
    recommendations,
    rulesVersion: RULES_VERSION,
    isValid: validationMessage === null,
    validationMessage,
  }
}

export { FLOW_LINKS }
