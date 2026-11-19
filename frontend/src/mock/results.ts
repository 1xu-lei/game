import type { AllocationMap, RainType, SimulationResult } from '@/types'
import { runPreview } from '@/engine/previewEngine'

/**
 * 同构 mock（接口卡第 2 条）
 * ---------------------------------------------------------------
 * 四份预设结果全部由预览引擎真实算出，字段与 POST /api/simulations/run 1:1，
 * 接口就绪后只换数据源，组件与类型不动。
 */
const PRESETS: { key: string; label: string; rain: RainType; plan: AllocationMap }[] = [
  {
    key: 'continuous-specialist',
    label: '持续型 × 专精（车站 5）',
    rain: 'continuous',
    plan: { school: 0, market: 0, park: 0, residential: 0, station: 5 },
  },
  {
    key: 'continuous-balanced',
    label: '持续型 × 均衡（1/1/1/1/1）',
    rain: 'continuous',
    plan: { school: 1, market: 1, park: 1, residential: 1, station: 1 },
  },
  {
    key: 'burst-specialist',
    label: '短时强降雨 × 专精（公园 5）',
    rain: 'burst',
    plan: { school: 0, market: 0, park: 5, residential: 0, station: 0 },
  },
  {
    key: 'burst-dual',
    label: '短时强降雨 × 双核（公园 3 + 车站 2）',
    rain: 'burst',
    plan: { school: 0, market: 0, park: 3, residential: 0, station: 2 },
  },
]

export const MOCK_RESULTS: Record<string, SimulationResult> = PRESETS.reduce(
  (acc, p) => {
    acc[p.key] = runPreview(p.plan, p.rain)
    return acc
  },
  {} as Record<string, SimulationResult>,
)

export const MOCK_PRESET_LABELS: Record<string, string> = PRESETS.reduce(
  (acc, p) => {
    acc[p.key] = p.label
    return acc
  },
  {} as Record<string, string>,
)
