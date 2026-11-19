import type {
  RainTypeConfig,
  ScenarioConfig,
  SimulationRequest,
  SimulationResult,
} from '@/types'

/**
 * 后端 REST 客户端（规格书 §8）
 * ---------------------------------------------------------------
 * 只负责「把请求发出去、把 JSON 拿回来」，不做任何业务判断。
 * 后端未启动时请求会在 TIMEOUT_MS 内失败，由上层的 simulationService
 * 降级到本地预览引擎，并在 UI 上明确标注「本地预览引擎」。
 */

/** 本地 FastAPI 默认地址。后端静态托管前端产物时改为 '' 走同源相对路径。 */
export const API_BASE = 'http://127.0.0.1:8000'

const TIMEOUT_MS = 1800

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`)
    return (await res.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

export function getScenarioConfig(): Promise<ScenarioConfig[]> {
  return request<ScenarioConfig[]>('/api/config/scenarios')
}

export function getRainTypeConfig(): Promise<RainTypeConfig[]> {
  return request<RainTypeConfig[]>('/api/config/rain-types')
}

export function postSimulationRun(payload: SimulationRequest): Promise<SimulationResult> {
  return request<SimulationResult>('/api/simulations/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
