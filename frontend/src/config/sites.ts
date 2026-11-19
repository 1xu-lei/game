import type { NavItem, RainTypeConfig, ScenarioConfig, SceneId, SimulationStep } from '@/types'

/** 建设资源总量（规格书 §3.1：固定 5 点，必须恰好分完） */
export const TOTAL_POINTS = 5

/**
 * 五个固定场景（规格书 §2，不可增删、不可改名）
 * yieldCurve：0–5 六档，每个场景独立配置，禁止五场景共用一条曲线。
 */
export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'school',
    name: '学校',
    nameEn: 'School',
    direction: '人员安全',
    project: '透水操场 + 避险通道',
    baseNote: '原硬化操场，降雨即积水',
    flowRole: '上游 · 汇入公园',
    accentVar: '--scene-school',
    asset: 'assets/scenes/school.svg',
    yieldCurve: [0, 0.17, 0.3, 0.45, 0.58, 0.68],
    transfer: 0.72,
  },
  {
    id: 'market',
    name: '集市',
    nameEn: 'Market',
    direction: '商业保障',
    project: '地下蓄水池 + 商铺防护',
    baseNote: '低洼摊位区，雨后内涝',
    flowRole: '上游 · 汇入居民区',
    accentVar: '--scene-market',
    asset: 'assets/scenes/market.svg',
    yieldCurve: [0, 0.22, 0.38, 0.52, 0.62, 0.7],
    transfer: 0.7,
  },
  {
    id: 'park',
    name: '公园',
    nameEn: 'Park',
    direction: '雨水调蓄',
    project: '下凹绿地 + 雨水花园',
    baseNote: '普通绿化，无调蓄容积',
    flowRole: '中游 · 承接学校 · 排向车站',
    accentVar: '--scene-park',
    asset: 'assets/scenes/park.svg',
    yieldCurve: [0, 0.25, 0.43, 0.6, 0.72, 0.8],
    transfer: 0.64,
  },
  {
    id: 'residential',
    name: '居民区',
    nameEn: 'Residential',
    direction: '社区防护',
    project: '植草沟 + 社区蓄水',
    baseNote: '老旧排水，暴雨易倒灌',
    flowRole: '中游 · 承接集市 · 排向车站',
    accentVar: '--scene-residential',
    asset: 'assets/scenes/residential.svg',
    yieldCurve: [0, 0.16, 0.29, 0.42, 0.54, 0.63],
    transfer: 0.61,
  },
  {
    id: 'station',
    name: '车站',
    nameEn: 'Station',
    direction: '排水能力',
    project: '泵站 + 站前排水口',
    baseNote: '低洼汇流点，峰值压力集中',
    flowRole: '下游 · 两路汇流的最终压力承受点',
    accentVar: '--scene-station',
    asset: 'assets/scenes/station.svg',
    yieldCurve: [0, 0.2, 0.36, 0.51, 0.66, 0.78],
    transfer: 0,
  },
]

export const SCENARIO_MAP: Record<SceneId, ScenarioConfig> = SCENARIOS.reduce(
  (acc, s) => {
    acc[s.id] = s
    return acc
  },
  {} as Record<SceneId, ScenarioConfig>,
)

export const SCENE_IDS: SceneId[] = ['school', 'market', 'park', 'residential', 'station']

/** 0–5 六档阶段标签（规格书 §3.5） */
export const STAGE_LABELS = [
  '无专项投入',
  '初步介入',
  '稳定发展',
  '深度发展',
  '阶段突破',
  '极限专精',
] as const

/**
 * 固定水流关系（规格书 §2：禁止随机连线、禁止增删）
 * school→park，market→residential，两路汇入 station
 */
export const FLOW_LINKS: { from: SceneId; to: SceneId; label: string }[] = [
  { from: 'school', to: 'park', label: '校园径流' },
  { from: 'market', to: 'residential', label: '集市来水' },
  { from: 'park', to: 'station', label: '公园下泄' },
  { from: 'residential', to: 'station', label: '社区下泄' },
]

export const RAIN_TYPES: RainTypeConfig[] = [
  {
    id: 'continuous',
    name: '持续型降雨',
    nameEn: 'Continuous Rain',
    summary: '长时间中高强度降雨，累计水量大',
    challenge: ['考验调蓄容量', '持续排水能力', '设施长时间承载'],
    weights: { volume: 0.72, peak: 0.28 },
    asset: 'assets/scenes/rain-continuous.svg',
  },
  {
    id: 'burst',
    name: '短时强降雨',
    nameEn: 'Cloudburst',
    summary: '短时间高强度降雨，峰值集中在数十分钟',
    challenge: ['考验峰值承载', '局部防护强度', '低洼区排水'],
    weights: { volume: 0.3, peak: 0.7 },
    asset: 'assets/scenes/rain-burst.svg',
  },
]

export const NAV_ITEMS: NavItem[] = [
  { key: 'plan', label: '城市规划', icon: 'LayoutDashboard' },
  { key: 'history', label: '历史记录', icon: 'History' },
  { key: 'rank', label: '排行榜', icon: 'BarChart3' },
  { key: 'settings', label: '设置', icon: 'Settings' },
]

/** 规则版本：与后端对齐后由接口下发 */
export const RULES_VERSION = 'rain-five-v1-preview'

/** 推演过程展示用的固定 6 步（规格书 §5.7）。只是标签，不含计算。 */
export const SIM_STEPS: SimulationStep[] = [
  { step: 1, label: '雨型输入', hint: '载入降雨情境参数权重' },
  { step: 2, label: '场景防护', hint: '五场景本地防护生效' },
  { step: 3, label: '上游调蓄', hint: '校园径流进入公园调蓄' },
  { step: 4, label: '下游汇流', hint: '集市来水压向居民区' },
  { step: 5, label: '车站压力', hint: '两路汇流抵达低洼车站' },
  { step: 6, label: '最终结算', hint: '评分、联动与解释生成' },
]
