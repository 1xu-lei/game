/**
 * 前端数据契约（对齐《规格书》§8 响应最小字段）
 * ---------------------------------------------------------------
 * 组件只消费这些类型，不认识任何计算规则。
 * 真实接口上线后：只换 services 数据源，组件与类型不动。
 */

export type SceneId = 'school' | 'market' | 'park' | 'residential' | 'station'

export type RainType = 'continuous' | 'burst'

export type AllocationMap = Record<SceneId, number>

/** 场景静态配置（GET /api/config/scenarios） */
export interface ScenarioConfig {
  id: SceneId
  name: string
  nameEn: string
  /** 主要投资方向标签 */
  direction: string
  /** 当前档位的工程手段 */
  project: string
  /** 0 级（无专项投入）时的说明 */
  baseNote: string
  /** 水流关系角色 */
  flowRole: string
  /** CSS 变量名，指向 tokens.css 中的场景色相 */
  accentVar: string
  /** 本地资产路径（public 下相对路径） */
  asset: string
  /** 0–5 六档，每档独立配置的收益曲线（不含 UI 计算） */
  yieldCurve: number[]
  /** 向下游的径流传递系数 */
  transfer: number
}

/** 降雨情境配置（GET /api/config/rain-types） */
export interface RainTypeConfig {
  id: RainType
  name: string
  nameEn: string
  summary: string
  challenge: string[]
  /** 情境权重：总量型 / 峰值型，两种雨型共用同一引擎，仅参数不同 */
  weights: { volume: number; peak: number }
  asset: string
}

export interface ScenarioResult {
  sceneId: SceneId
  sceneName: string
  invested: number
  /** 档位标签：无专项投入 / 初步介入 … 极限专精 */
  stageLabel: string
  /** 本地防护达成率 0–100（简化指标） */
  coverage: number
  /** 计入上下游汇流后的净安全度 0–100 */
  effective: number
  /** 上游来水 0–100 */
  inflow: number
  /** 排往下游的残余径流 0–100 */
  outflow: number
  /** 相对基准方案（1/1/1/1/1）的变化 */
  deltaValue: number
  deltaText: string
}

export interface RiskMetrics {
  /** 积水风险 0–100（项目自定义简化指标，非工程单位） */
  waterlogRisk: number
  /** 损失概率 0–100 */
  lossRisk: number
  /** 车站排水压力 0–100 */
  stationPressure: number
  /** 排水负荷率 0–100 */
  drainageLoad: number
}

export interface TriggeredSynergy {
  id: string
  name: string
  detail: string
  /** 本次贡献的分数 */
  gain: number
}

export type EventTone = 'info' | 'good' | 'warn' | 'bad'

export interface SimulationEvent {
  index: number
  step: number
  stepLabel: string
  sceneId?: SceneId
  text: string
  tone: EventTone
}

export interface Explanation {
  title: string
  body: string
  /** 数据依据，界面上以 mono 小字展示 */
  evidence: string
}

export interface Recommendation {
  sceneId: SceneId
  text: string
  /** 预期分数变化 */
  gain: number
}

export interface ForecastPoint {
  step: string
  /** 积水风险 */
  waterlog: number
  /** 损失概率 */
  loss: number
}

export interface SimulationResult {
  simulationId: string
  rainType: RainType
  allocation: AllocationMap
  overallScore: number
  grade: string
  gradeLabel: string
  strategyType: string
  scenarioResults: ScenarioResult[]
  riskMetrics: RiskMetrics
  triggeredSynergies: TriggeredSynergy[]
  /** 城市状态预测双线（积水风险 / 损失概率） */
  forecast: ForecastPoint[]
  events: SimulationEvent[]
  explanations: Explanation[]
  recommendations: Recommendation[]
  rulesVersion: string
  /** 5 点是否分配完 */
  isValid: boolean
  validationMessage: string | null
}

/** POST /api/simulations/run 请求体（规格书 §8 请求最小字段） */
export interface SimulationRequest {
  rainType: RainType
  allocation: AllocationMap
  rulesVersion?: string
}

/** 结果来源：backend = 真实接口，preview = 本地预览引擎（必须在 UI 上标注） */
export type DataSource = 'backend' | 'preview'

/** 推演过程固定 6 步（规格书 §5.7），仅展示元数据，不含任何计算 */
export interface SimulationStep {
  step: number
  label: string
  hint: string
}

/** 顶部导航项 */
export interface NavItem {
  key: string
  label: string
  icon: string
}

/** 设计版本（评审用） */
export type VariantId = 'a' | 'b' | 'c'
