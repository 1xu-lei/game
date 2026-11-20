import type { AllocationMap, RainType, SimulationResult } from '@/types'
import {
  BASELINE_ALLOCATION,
  EMPTY_ALLOCATION,
  FLOW_LINKS,
  RULES_VERSION,
  STAGE_LABELS,
  detectStrategy,
  displayScore,
  gradeOf,
  simulate,
  stageLabelOf,
  totalAllocated,
  validateAllocation,
} from './ruleEngine'

/**
 * 预览引擎（前端入口）
 * ---------------------------------------------------------------
 * 主界面「预期效果预览」需要随分配即时变化，且必须与后端推演同口径。
 * 计算已统一到 engine/ruleEngine.ts（与 backend/app/engine 逐行对齐、共用 rules/rules.json），
 * 本文件只保留既有导出签名，组件无需改动。
 *
 * 纪律：
 * 1. 确定性——同输入同输出，无随机数。
 * 2. 唯一计算入口——组件/视图不得自行计算分数，一律读本模块结果。
 * 3. 诚实简化——输出的是项目自定义 0–100 简化指标，不是工程水文学结果。
 */

export {
  BASELINE_ALLOCATION,
  EMPTY_ALLOCATION,
  FLOW_LINKS,
  RULES_VERSION,
  STAGE_LABELS,
  detectStrategy,
  displayScore,
  gradeOf,
  stageLabelOf,
  totalAllocated,
  validateAllocation,
}

/** 与 POST /api/simulations/run 同构的本地推演结果 */
export function runPreview(allocation: AllocationMap, rainType: RainType): SimulationResult {
  return simulate(allocation, rainType)
}
