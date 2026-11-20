import rulesJson from '../../../rules/rules.json'
import type {
  AllocationMap,
  Explanation,
  ForecastPoint,
  RainType,
  Recommendation,
  ScenarioResult,
  SceneId,
  SimulationEvent,
  SimulationResult,
  TriggeredSynergy,
} from '../types'

/**
 * 规则引擎（前端同源实现）
 * ---------------------------------------------------------------
 * 与 backend/app/engine/ 逐行对齐：同一份 rules/rules.json、同一套算式与取整方式，
 * 因此「主界面预期值」与「后端推演结果」在同一输入下完全一致（见 scripts/check-engine-parity.mjs）。
 * 这里只做确定性算术，不含随机数、时间或顺序依赖；参数一律取自 rules.json，不写死。
 */

interface RuleScene {
  id: SceneId
  name: string
  transfer: number
  exposure: { volume: number; peak: number }
  rollup: number
  curve: number[]
}

interface RuleRainType {
  id: RainType
  name: string
  weights: { volume: number; peak: number }
  convey_loss: number
  defense_modifier: Record<string, number>
  score_weights: Record<SceneId, number>
}

interface RuleSynergy {
  id: string
  name: string
  conditions: Partial<Record<SceneId, number>>
  bonus: number
  effect: string
}

interface RuleFile {
  rulesVersion: string
  budget: { total: number; pointsMin: number; pointsMax: number }
  scenarioOrder: SceneId[]
  scenarios: Record<SceneId, RuleScene>
  flowLinks: { from: SceneId; to: SceneId; label: string }[]
  rainTypes: Record<RainType, RuleRainType>
  synergies: RuleSynergy[]
  scoring: {
    score_min: number
    score_max: number
    raw_score_floor: number
    raw_score_ceiling: number
    display_score_floor: number
    display_score_ceiling: number
    rules_version: string
    risk_weights: { waterlog: Partial<Record<SceneId, number>>; loss: Partial<Record<SceneId, number>> }
    drainage_capacity_ratio: number
    forecast_steps: string[]
    forecast_factors: number[]
    baseline_allocation: AllocationMap
    grades: { grade: string; min_score: number; label: string }[]
    stageLabels: string[]
  }
}

export const RULES = rulesJson as unknown as RuleFile

const ORDER = RULES.scenarioOrder
const SCORE = RULES.scoring

export const RULES_VERSION = RULES.rulesVersion
export const TOTAL_POINTS = RULES.budget.total
export const STAGE_LABELS = SCORE.stageLabels

export const EMPTY_ALLOCATION: AllocationMap = {
  school: 0,
  market: 0,
  park: 0,
  residential: 0,
  station: 0,
}

export const BASELINE_ALLOCATION: AllocationMap = { ...SCORE.baseline_allocation }

/** 与 Python 的 round_half_up 一致：四舍五入而非银行家舍入 */
export function roundHalfUp(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.floor(value * factor + 0.5) / factor
}

/** 与 Python 的 `f"{float}"` 输出一致：整数值保留一位小数（3 → "3.0"），保证事件与解释文案同后端逐字相同 */
const pyNum = (value: number, digits: number): string => {
  const rounded = roundHalfUp(value, digits)
  return Number.isInteger(rounded) ? `${rounded}.0` : `${rounded}`
}

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value))

export const totalAllocated = (allocation: AllocationMap): number =>
  ORDER.reduce((sum, id) => sum + allocation[id], 0)

export const stageLabelOf = (level: number): string =>
  STAGE_LABELS[Math.max(0, Math.min(STAGE_LABELS.length - 1, level))]

/** 校验：每场景 0–5 整数，总和恰好 5（规格书 §3.1）。通过返回 null。 */
export function validateAllocation(allocation: AllocationMap): string | null {
  const { pointsMin, pointsMax } = RULES.budget
  for (const id of ORDER) {
    const value = allocation[id]
    if (!Number.isInteger(value) || value < pointsMin || value > pointsMax) {
      return `${RULES.scenarios[id].name}投入必须为 ${pointsMin}–${pointsMax} 的整数`
    }
  }
  const total = totalAllocated(allocation)
  if (total < TOTAL_POINTS) return `还需分配 ${TOTAL_POINTS - total} 点：推演要求 ${TOTAL_POINTS} 点恰好分完`
  if (total > TOTAL_POINTS) return `超出 ${total - TOTAL_POINTS} 点：请从其他场景收回`
  return null
}

/** 策略识别（优先级：专精 → 双核 → 均衡 → 偏科 → 多元），与 backend/app/engine/strategy.py 一致 */
export function detectStrategy(allocation: AllocationMap): string {
  const values = ORDER.map((id) => allocation[id]).sort((a, b) => b - a)
  const top = values[0]
  const second = values[1]
  const active = ORDER.filter((id) => allocation[id] > 0).length
  const cores = ORDER.filter((id) => allocation[id] >= 2).length

  if (top >= 4) return '专精型'
  if (cores === 2 && top + second >= 4) return '双核型'
  if (active === ORDER.length) return '均衡型'
  if (top >= 3 && top - second >= 2) return '偏科型'
  return '多元型'
}

interface SiteWater {
  load: number
  defense: number
  residual: number
  inflow: number
  total: number
  ratio: number
  safety: number
}

/** 固定水流关系（规格书 §2：禁止随机连线），取自 rules.json 的 flowLinks */
export const FLOW_LINKS = RULES.flowLinks

const upstreamOf = (id: SceneId): SceneId[] =>
  ORDER.filter((candidate) => FLOW_LINKS.some((link) => link.from === candidate && link.to === id))

function computeWater(allocation: AllocationMap, rain: RuleRainType): Record<SceneId, SiteWater> {
  const water = {} as Record<SceneId, SiteWater>
  for (const id of ORDER) {
    const scene = RULES.scenarios[id]
    const load = rain.weights.volume * scene.exposure.volume + rain.weights.peak * scene.exposure.peak
    const modifier = rain.defense_modifier[id] ?? 0
    const defense = clamp(scene.curve[allocation[id]] + modifier, 0, 0.95)
    const residual = load * (1 - defense)

    let inflow = 0
    for (const upstreamId of upstreamOf(id)) {
      const upstream = water[upstreamId]
      inflow += upstream.residual * RULES.scenarios[upstreamId].transfer * rain.convey_loss
    }

    const total = residual + inflow
    const ratio = total / scene.rollup
    water[id] = { load, defense, residual, inflow, total, ratio, safety: 100 * clamp(1 - ratio, 0, 1) }
  }
  return water
}

/** 联动判定（阈值与收益取自 rules.json），顺序固定 */
export function evaluateSynergies(allocation: AllocationMap): RuleSynergy[] {
  return RULES.synergies.filter((rule) =>
    Object.entries(rule.conditions).every(
      ([sceneId, threshold]) => allocation[sceneId as SceneId] >= (threshold as number),
    ),
  )
}

function synergyDetail(rule: RuleSynergy, allocation: AllocationMap): string {
  const parts = Object.entries(rule.conditions).map(
    ([sceneId, threshold]) =>
      `${RULES.scenarios[sceneId as SceneId].name} ${allocation[sceneId as SceneId]} 点 ≥ 阈值 ${threshold}`,
  )
  return `${parts.join('，')}：${rule.effect}`
}

function synergyBonus(allocation: AllocationMap): number {
  return evaluateSynergies(allocation).reduce((sum, rule) => sum + rule.bonus, 0)
}

function rawScore(water: Record<SceneId, SiteWater>, rain: RuleRainType, bonus: number): number {
  return ORDER.reduce((sum, id) => sum + rain.score_weights[id] * water[id].safety, 0) + bonus
}

/** raw → 展示分的单调线性映射（不改排序），与 backend/app/engine/scoring.py 一致 */
export function displayScore(raw: number): number {
  const ratio = (raw - SCORE.raw_score_floor) / (SCORE.raw_score_ceiling - SCORE.raw_score_floor)
  const mapped = SCORE.display_score_floor + ratio * (SCORE.display_score_ceiling - SCORE.display_score_floor)
  return roundHalfUp(clamp(mapped, SCORE.score_min, SCORE.score_max), 1)
}

export function gradeOf(score: number): { grade: string; gradeLabel: string } {
  const hit = SCORE.grades.find((item) => score >= item.min_score)
  const last = SCORE.grades[SCORE.grades.length - 1]
  return { grade: hit?.grade ?? last.grade, gradeLabel: hit?.label ?? last.label }
}

function weightedRatio(water: Record<SceneId, SiteWater>, weights: Partial<Record<SceneId, number>>): number {
  return Object.entries(weights).reduce(
    (sum, [sceneId, weight]) => sum + (weight as number) * water[sceneId as SceneId].ratio,
    0,
  )
}

function riskMetrics(water: Record<SceneId, SiteWater>) {
  const waterlog = 100 * clamp(weightedRatio(water, SCORE.risk_weights.waterlog), 0, 1)
  const loss = 100 * clamp(weightedRatio(water, SCORE.risk_weights.loss), 0, 1)
  const stationPressure = 100 * clamp(water.station.ratio, 0, 1)
  const drainageLoad = 100 * clamp(water.station.ratio / SCORE.drainage_capacity_ratio, 0, 1)
  return {
    waterlogRisk: roundHalfUp(waterlog, 0),
    lossRisk: roundHalfUp(loss, 0),
    stationPressure: roundHalfUp(stationPressure, 0),
    drainageLoad: roundHalfUp(drainageLoad, 0),
  }
}

function forecast(rain: RuleRainType, waterlogRisk: number, lossRisk: number): ForecastPoint[] {
  const waterlogScale = 0.86 + rain.weights.peak * 0.28
  const lossScale = 0.82 + rain.weights.volume * 0.3
  return SCORE.forecast_steps.map((step, index) => ({
    step,
    waterlog: Math.min(100, roundHalfUp(waterlogRisk * SCORE.forecast_factors[index] * waterlogScale, 0)),
    loss: Math.min(100, roundHalfUp(lossRisk * SCORE.forecast_factors[index] * lossScale, 0)),
  }))
}

interface Core {
  water: Record<SceneId, SiteWater>
  bonus: number
  raw: number
  score: number
  risks: ReturnType<typeof riskMetrics>
}

function core(allocation: AllocationMap, rain: RuleRainType): Core {
  const water = computeWater(allocation, rain)
  const bonus = synergyBonus(allocation)
  const raw = rawScore(water, rain, bonus)
  return { water, bonus, raw, score: displayScore(raw), risks: riskMetrics(water) }
}

function toneByRatio(ratio: number): SimulationEvent['tone'] {
  if (ratio >= 0.95) return 'bad'
  if (ratio >= 0.7) return 'warn'
  if (ratio <= 0.35) return 'good'
  return 'info'
}

function buildEvents(allocation: AllocationMap, rain: RuleRainType, current: Core): SimulationEvent[] {
  const events: SimulationEvent[] = []
  const add = (step: number, text: string, tone: SimulationEvent['tone'], sceneId?: SceneId) => {
    events.push({
      index: events.length + 1,
      step,
      stepLabel: STEP_LABELS[step - 1],
      sceneId: sceneId ?? null,
      text,
      tone,
    })
  }

  add(
    1,
    `载入「${rain.name}」，总量权重 ${roundHalfUp(rain.weights.volume * 100, 0)}%、峰值权重 ${roundHalfUp(
      rain.weights.peak * 100,
      0,
    )}%`,
    'info',
  )

  for (const id of ORDER) {
    const site = current.water[id]
    const name = RULES.scenarios[id].name
    const points = allocation[id]
    const coverage = roundHalfUp(site.defense * 100, 0)
    if (points === 0) {
      add(2, `${name}投入 0 点（无专项投入），本地防护 ${coverage}`, 'warn', id)
    } else {
      add(2, `${name}投入 ${points} 点，本地防护 ${coverage}（${stageLabelOf(points)}）`, coverage >= 50 ? 'good' : 'info', id)
    }
  }

  const school = current.water.school
  const park = current.water.park
  const market = current.water.market
  const residential = current.water.residential
  const station = current.water.station

  add(
    3,
    `校园残余径流 ${roundHalfUp(school.residual * 100, 0)} 经输送后 ${roundHalfUp(park.inflow * 100, 0)} 进入公园调蓄`,
    toneByRatio(park.ratio),
    'park',
  )
  add(
    4,
    `集市残余径流 ${roundHalfUp(market.residual * 100, 0)} 经输送后 ${roundHalfUp(residential.inflow * 100, 0)} 压向居民区`,
    toneByRatio(residential.ratio),
    'residential',
  )
  add(
    5,
    `两路汇流抵达车站，合计来水 ${roundHalfUp(station.inflow * 100, 0)}，站内压力比 ${pyNum(station.ratio, 2)}`,
    toneByRatio(station.ratio),
    'station',
  )

  const hits = evaluateSynergies(allocation)
  if (hits.length) {
    add(6, `触发 ${hits.length} 条联动：${hits.map((hit) => hit.name).join('、')}，协同加成 ${pyNum(current.bonus, 1)}`, 'good')
  } else {
    add(6, '本轮没有触发任何场景联动，资源分布在单个场景上', 'info')
  }
  const { grade, gradeLabel } = gradeOf(current.score)
  add(6, `最终评分 ${pyNum(current.score, 1)}（${grade} · ${gradeLabel}）`, 'info')
  return events
}

function unmetSummary(allocation: AllocationMap): string {
  return RULES.synergies
    .filter((rule) =>
      Object.entries(rule.conditions).some(
        ([sceneId, threshold]) => allocation[sceneId as SceneId] < (threshold as number),
      ),
    )
    .map((rule) => {
      const gaps = Object.entries(rule.conditions)
        .filter(([sceneId, threshold]) => allocation[sceneId as SceneId] < (threshold as number))
        .map(([sceneId, threshold]) => `${RULES.scenarios[sceneId as SceneId].name}还差 ${(threshold as number) - allocation[sceneId as SceneId]} 点`)
      return `${rule.name}：${gaps.join('，')}`
    })
    .join('；')
}

function buildExplanations(allocation: AllocationMap, rain: RuleRainType, current: Core): Explanation[] {
  const explanations: Explanation[] = []
  const weakest = [...ORDER].sort((a, b) =>
    current.water[a].safety === current.water[b].safety
      ? (a < b ? -1 : 1)
      : current.water[a].safety - current.water[b].safety,
  )[0]
  const weakestSite = current.water[weakest]
  explanations.push({
    title: `${RULES.scenarios[weakest].name}是当前最薄弱环节`,
    body: `${RULES.scenarios[weakest].name}投入 ${allocation[weakest]} 点（${stageLabelOf(
      allocation[weakest],
    )}），本地防护 ${roundHalfUp(weakestSite.defense * 100, 0)}，另有 ${roundHalfUp(weakestSite.inflow * 100, 0)} 的上游来水压在这里。`,
    evidence: `effective=${roundHalfUp(weakestSite.safety, 0)} · load=${pyNum(weakestSite.load, 2)} · inflow=${roundHalfUp(
      weakestSite.inflow * 100,
      0,
    )}`,
  })

  const station = current.water.station
  explanations.push({
    title: `车站排水压力 ${current.risks.stationPressure}`,
    body: `公园与居民区两路下泄合计 ${roundHalfUp(station.inflow * 100, 0)} 汇入车站，车站自身负荷 ${roundHalfUp(
      station.load * 100,
      0,
    )}、防护 ${roundHalfUp(station.defense * 100, 0)}，压力比 ${pyNum(station.ratio, 2)} 直接体现为低洼积水风险。`,
    evidence: `stationPressure=${current.risks.stationPressure} · drainageLoad=${current.risks.drainageLoad} · inflow=${roundHalfUp(
      station.inflow * 100,
      0,
    )}`,
  })

  const hits = evaluateSynergies(allocation)
  if (hits.length) {
    explanations.push({
      title: `触发 ${hits.length} 条联动`,
      body: `${hits.map((hit) => `${hit.name}（+${pyNum(hit.bonus, 1)}）`).join('、')}：满足阈值后额外获得协同收益。`,
      evidence: `bonus_total=${pyNum(current.bonus, 1)}`,
    })
  } else {
    explanations.push({
      title: '没有触发联动的具体原因',
      body: unmetSummary(allocation) || '本轮无联动规则',
      evidence: 'synergies=0',
    })
  }

  const best = [...ORDER].sort((a, b) =>
    current.water[a].safety === current.water[b].safety
      ? (a < b ? -1 : 1)
      : current.water[b].safety - current.water[a].safety,
  )[0]
  if (allocation[best] > 0) {
    explanations.push({
      title: `${RULES.scenarios[best].name}获得最多回报`,
      body: `在「${rain.name}」下，${RULES.scenarios[best].name}净安全度 ${roundHalfUp(
        current.water[best].safety,
        0,
      )}，是本次 ${TOTAL_POINTS} 点配置里收益最集中的一处。`,
      evidence: `effective=${roundHalfUp(current.water[best].safety, 0)}`,
    })
  }

  return explanations
}

function buildRecommendations(allocation: AllocationMap, rain: RuleRainType, current: Core): Recommendation[] {
  const candidates: Recommendation[] = []
  for (const fromScene of ORDER) {
    if (allocation[fromScene] <= 0) continue
    for (const toScene of ORDER) {
      if (fromScene === toScene) continue
      const trial = { ...allocation, [fromScene]: allocation[fromScene] - 1, [toScene]: allocation[toScene] + 1 }
      const gain = roundHalfUp(core(trial, rain).score - current.score, 1)
      if (gain <= 0) continue
      candidates.push({
        sceneId: toScene,
        text: `从${RULES.scenarios[fromScene].name}挪 1 点给${RULES.scenarios[toScene].name}（${allocation[fromScene]}/${allocation[toScene]} → ${trial[fromScene]}/${trial[toScene]}）`,
        gain,
      })
    }
  }
  return candidates
    .sort((a, b) => (a.gain === b.gain ? ORDER.indexOf(a.sceneId) - ORDER.indexOf(b.sceneId) : b.gain - a.gain))
    .slice(0, 3)
}

function scenarioResults(
  allocation: AllocationMap,
  rain: RuleRainType,
  water: Record<SceneId, SiteWater>,
  baseline: Record<SceneId, SiteWater>,
): ScenarioResult[] {
  return ORDER.map((id) => {
    const site = water[id]
    const scene = RULES.scenarios[id]
    const deltaValue = roundHalfUp(site.safety - baseline[id].safety, 1)
    const deltaText =
      deltaValue > 0
        ? `比基准高 ${pyNum(deltaValue, 1)}`
        : deltaValue < 0
          ? `比基准低 ${pyNum(Math.abs(deltaValue), 1)}`
          : '与基准持平'
    return {
      sceneId: id,
      sceneName: scene.name,
      invested: allocation[id],
      stageLabel: stageLabelOf(allocation[id]),
      coverage: roundHalfUp(site.defense * 100, 0),
      effective: roundHalfUp(site.safety, 0),
      inflow: roundHalfUp(site.inflow * 100, 0),
      outflow: roundHalfUp(site.residual * scene.transfer * rain.convey_loss * 100, 0),
      deltaValue,
      deltaText,
    }
  })
}

const STEP_LABELS = ['雨型输入', '场景防护', '上游调蓄', '下游汇流', '车站压力', '最终结算']

/** 本地推演 id：由输入内容决定，同输入必得同 id（与后端 sha1 id 不共用，前缀区分来源） */
function previewId(allocation: AllocationMap, rainType: RainType): string {
  const payload = `${rainType}:${ORDER.map((id) => allocation[id]).join('')}`
  let hash = 0x811c9dc5
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `preview-${rainType}-${hash.toString(16).padStart(8, '0')}`
}

/**
 * 与 POST /api/simulations/run 响应同构的本地推演。
 * 非法分配同样返回结果（预览需要随分配实时变化），只用 isValid / validationMessage 标记。
 */
export function simulate(allocation: AllocationMap, rainType: RainType): SimulationResult {
  const rain = RULES.rainTypes[rainType]
  const current = core(allocation, rain)
  const baseline = core(BASELINE_ALLOCATION, rain)
  const { grade, gradeLabel } = gradeOf(current.score)
  const validationMessage = validateAllocation(allocation)
  const hits = evaluateSynergies(allocation)

  return {
    simulationId: previewId(allocation, rainType),
    rainType,
    allocation: { ...allocation },
    overallScore: current.score,
    grade,
    gradeLabel,
    strategyType: detectStrategy(allocation),
    scenarioResults: scenarioResults(allocation, rain, current.water, baseline.water),
    riskMetrics: current.risks,
    triggeredSynergies: hits.map<TriggeredSynergy>((rule) => ({
      id: rule.id,
      name: rule.name,
      detail: synergyDetail(rule, allocation),
      gain: roundHalfUp(displayScore(current.raw) - displayScore(current.raw - rule.bonus), 1),
    })),
    forecast: forecast(rain, current.risks.waterlogRisk, current.risks.lossRisk),
    events: buildEvents(allocation, rain, current),
    explanations: buildExplanations(allocation, rain, current),
    recommendations: buildRecommendations(allocation, rain, current),
    rulesVersion: RULES_VERSION,
    isValid: validationMessage === null,
    validationMessage,
  }
}
