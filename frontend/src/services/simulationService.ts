import { RULES_VERSION } from '@/config/sites'
import { runPreview } from '@/engine/previewEngine'
import type { AllocationMap, DataSource, RainType, SimulationRequest, SimulationResult } from '@/types'
import { postSimulationRun } from './api'

/**
 * 推演数据源选择层
 * ---------------------------------------------------------------
 * 优先 POST /api/simulations/run；后端不可用（未启动 / 超时 / 字段不全）时
 * 降级到 engine/previewEngine，并把 source 交回 UI 明确标注「本地预览引擎」。
 * 任何情况下都不会把预览结果伪装成后端结果。
 */

export interface RunOutcome {
  result: SimulationResult
  source: DataSource
}

/** 后端响应必须包含结果页所需字段，否则视为不可用（降级而不是补造数据） */
function backendResultIsUsable(raw: Partial<SimulationResult>): boolean {
  return (
    typeof raw.overallScore === 'number' &&
    Array.isArray(raw.scenarioResults) &&
    raw.scenarioResults.length === 5 &&
    Array.isArray(raw.events) &&
    Array.isArray(raw.explanations) &&
    Array.isArray(raw.recommendations) &&
    Array.isArray(raw.forecast) &&
    Array.isArray(raw.triggeredSynergies) &&
    typeof raw.riskMetrics?.waterlogRisk === 'number'
  )
}

export async function runSimulation(
  rainType: RainType,
  allocation: AllocationMap,
): Promise<RunOutcome> {
  const payload: SimulationRequest = {
    rainType,
    allocation: { ...allocation },
    rulesVersion: RULES_VERSION,
  }
  try {
    const raw = await postSimulationRun(payload)
    if (backendResultIsUsable(raw)) return { result: raw, source: 'backend' }
  } catch {
    // 后端未启动或超时：走下面的预览降级
  }
  return { result: runPreview(allocation, rainType), source: 'preview' }
}

/** 主界面实时预览：始终是本地预览引擎，source 固定为 preview */
export function previewOf(rainType: RainType, allocation: AllocationMap): RunOutcome {
  return { result: runPreview(allocation, rainType), source: 'preview' }
}
