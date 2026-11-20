import { computed } from 'vue'
import { SCENARIO_MAP, STAGE_LABELS } from '@/config/sites'
import { FLOW_LINKS, RULES } from '@/engine/ruleEngine'
import { useGameStore } from '@/stores/game'
import type { RainType, SceneId } from '@/types'

/**
 * 场景详情视图模型（规格书 §5.5）
 * ---------------------------------------------------------------
 * 只做「把配置表与引擎结果整理成可渲染的行」，**不计算任何分数 / 风险 / 联动**：
 *   - 档位收益表、传递系数、暴露度、评分权重、联动阈值 → 读 rules.json（配置）
 *   - 本轮各项读数、联动是否触发 → 读 store.preview（引擎输出）
 * 因此改规则只改 rules/rules.json，此文件无需同步。
 */
export interface SceneLevelRow {
  level: number
  label: string
  /** 该档位的本地防护达成率（配置曲线 × 100，整数） */
  percent: number
  /** 相对上一档的边际提升（百分点），0 档为 null */
  delta: number | null
  current: boolean
}

export interface SceneLink {
  id: SceneId
  name: string
  role: 'upstream' | 'downstream'
  label: string
  /** 径流传递系数（配置） */
  transfer: number
  /** 上游本轮排出的残余径流（下游无此项） */
  outflow: number | null
}

export interface SceneSynergyRow {
  id: string
  name: string
  effect: string
  /** 条件可读文本，例如「公园 2/3 点」 */
  conditionText: string
  triggered: boolean
}

export interface SceneDetail {
  id: SceneId
  name: string
  nameEn: string
  direction: string
  project: string
  baseNote: string
  flowRole: string
  accent: string
  asset: string
  rainType: RainType
  rainLabel: string
  invested: number
  maxPoints: number
  remaining: number
  stageLabel: string
  levels: SceneLevelRow[]
  /** 下一档边际提升（百分点）；已到 5 点时 null */
  nextGain: number | null
  /** 本轮引擎读数（0 点场景同样存在，不隐藏） */
  coverage: number
  effective: number
  inflow: number
  outflow: number
  deltaText: string
  deltaValue: number
  links: SceneLink[]
  synergies: SceneSynergyRow[]
  /** 本雨型下该场景的评分权重（配置，只作说明） */
  scoreWeight: number
  exposureVolume: number
  exposurePeak: number
}

export function useSceneDetail(sceneId: () => SceneId | null) {
  const store = useGameStore()

  return computed<SceneDetail | null>(() => {
    const id = sceneId()
    if (!id) return null

    const scene = SCENARIO_MAP[id]
    const rain = store.rainType
    const ruleScene = RULES.scenarios[id]
    const rainRule = RULES.rainTypes[rain]
    const invested = store.allocation[id]
    const result = store.preview.scenarioResults.find((item) => item.sceneId === id)
    if (!result) return null

    const outflowOf = (sceneKey: SceneId): number =>
      store.preview.scenarioResults.find((item) => item.sceneId === sceneKey)?.outflow ?? 0

    const levels: SceneLevelRow[] = ruleScene.curve.map((value, level) => ({
      level,
      label: STAGE_LABELS[level] ?? '',
      percent: Math.round(value * 100),
      delta:
        level === 0 ? null : Math.round((value - (ruleScene.curve[level - 1] ?? 0)) * 100),
      current: level === invested,
    }))

    const links: SceneLink[] = FLOW_LINKS.filter(
      (link) => link.to === id || link.from === id,
    ).map((link) => {
      const upstream = link.from === id
      const other = upstream ? link.to : link.from
      return {
        id: other,
        name: SCENARIO_MAP[other].name,
        role: upstream ? 'downstream' : 'upstream',
        label: link.label,
        /** 传递系数属于「上游 → 下游」这条边，取自其上游场景 */
        transfer: RULES.scenarios[link.from]?.transfer ?? 0,
        outflow: upstream ? outflowOf(id) : null,
      }
    })

    const synergies: SceneSynergyRow[] = RULES.synergies
      .filter((rule) => Object.keys(rule.conditions).includes(id))
      .map((rule) => ({
        id: rule.id,
        name: rule.name,
        effect: rule.effect,
        conditionText: Object.entries(rule.conditions)
          .map(
            ([key, threshold]) =>
              `${SCENARIO_MAP[key as SceneId].name} ${store.allocation[key as SceneId]}/${threshold} 点`,
          )
          .join(' · '),
        triggered: store.preview.triggeredSynergies.some((item) => item.id === rule.id),
      }))

    return {
      id,
      name: scene.name,
      nameEn: scene.nameEn,
      direction: scene.direction,
      project: scene.project,
      baseNote: scene.baseNote,
      flowRole: scene.flowRole,
      accent: `var(${scene.accentVar})`,
      asset: scene.asset,
      rainType: rain,
      rainLabel: rainRule.name,
      invested,
      maxPoints: RULES.budget.pointsMax,
      remaining: store.remaining,
      stageLabel: result.stageLabel,
      levels,
      nextGain: invested < RULES.budget.pointsMax ? levels[invested + 1]?.delta ?? null : null,
      coverage: result.coverage,
      effective: result.effective,
      inflow: result.inflow,
      outflow: result.outflow,
      deltaText: result.deltaText,
      deltaValue: result.deltaValue,
      links,
      synergies,
      scoreWeight: rainRule.score_weights[id] ?? 0,
      exposureVolume: ruleScene.exposure.volume,
      exposurePeak: ruleScene.exposure.peak,
    }
  })
}
