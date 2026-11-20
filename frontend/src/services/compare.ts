import { SCENARIO_MAP, SCENARIOS } from '@/config/sites'
import { findLocalSnapshot, localHistoryItems } from './history'
import type { AllocationMap, RainType, SceneId, SimulationResult } from '@/types'

/**
 * 与上一轮推演对比（规格书 §10.2 P1「结果对比」）
 * ---------------------------------------------------------------
 * 只读本机浏览器快照，不发请求、不重算任何分数：
 *   - 对比对象＝本机最近一条「与当前记录 simulationId 不同」的快照
 *   - 同一雨型优先（同一情境下比较两套配置才有意义），并如实标注上一轮的雨型
 * 差额全部由两个已有结果对象相减得到，属展示层派生值，不参与评分。
 */
export interface SceneDelta {
  sceneId: SceneId
  name: string
  current: number
  previous: number
  delta: number
}

export interface RunComparison {
  previousId: string
  savedAt: string
  rainType: RainType
  rainLabel: string
  prevScore: number
  prevGrade: string
  prevStrategy: string
  scoreDelta: number
  allocationText: string
  sceneDeltas: SceneDelta[]
  /** 本轮相对上一轮的分配变化，例如「学校 +1 / 公园 −1」 */
  allocationChanges: string[]
}

/** 分配摘要：学1 集0 园3 居0 车1（与历史记录面板同一口径） */
export function allocationText(allocation: AllocationMap): string {
  return SCENARIOS.map((scene) => `${scene.name.slice(0, 1)}${allocation[scene.id]}`).join(' ')
}

export function compareWithPrevious(current: SimulationResult): RunComparison | null {
  const others = localHistoryItems().filter((item) => item.simulationId !== current.simulationId)
  if (!others.length) return null

  const picked = others.find((item) => item.rainType === current.rainType) ?? others[0]
  const snapshot = findLocalSnapshot(picked.simulationId)
  if (!snapshot) return null

  const prev = snapshot.result
  const prevById = new Map(prev.scenarioResults.map((item) => [item.sceneId, item]))

  const sceneDeltas: SceneDelta[] = current.scenarioResults
    .map((item) => {
      const before = prevById.get(item.sceneId)
      return {
        sceneId: item.sceneId,
        name: SCENARIO_MAP[item.sceneId].name,
        current: item.effective,
        previous: before?.effective ?? 0,
        delta: item.effective - (before?.effective ?? 0),
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const allocationChanges = SCENARIOS.filter(
    (scene) => current.allocation[scene.id] !== prev.allocation[scene.id],
  ).map((scene) => {
    const diff = current.allocation[scene.id] - prev.allocation[scene.id]
    return `${scene.name} ${diff > 0 ? `+${diff}` : diff}`
  })

  return {
    previousId: prev.simulationId,
    savedAt: picked.createdAt ?? '',
    rainType: prev.rainType,
    rainLabel: prev.rainType === 'burst' ? '短时强降雨' : '持续型降雨',
    prevScore: prev.overallScore,
    prevGrade: prev.grade,
    prevStrategy: prev.strategyType,
    scoreDelta: Number((current.overallScore - prev.overallScore).toFixed(1)),
    allocationText: allocationText(prev.allocation),
    sceneDeltas,
    allocationChanges,
  }
}
