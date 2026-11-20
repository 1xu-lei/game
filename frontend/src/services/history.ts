import type { DataSource, HistoryItem, LeaderboardItem, SimulationResult } from '@/types'
import { RULES_VERSION } from '@/config/sites'
import { getHistory, getLeaderboard, getSimulationById, getHealth } from './api'

/**
 * 历史记录（本机）
 * ---------------------------------------------------------------
 * 两条来源，互不覆盖：
 *   1. 浏览器 localStorage：每次推演后保存完整结果快照，后端未启动也能回看；
 *   2. 后端 SQLite（GET /api/history）：后端可用时以它为准，字段以接口返回为准。
 * 快照只用于回放展示，不参与任何计算。
 */

const STORAGE_KEY = 'rc-history-v1'
const MAX_RECORDS = 20

export interface LocalRecord {
  savedAt: string
  source: DataSource
  result: SimulationResult
}

function read(): LocalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is LocalRecord =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as LocalRecord).result?.simulationId === 'string',
    )
  } catch {
    return []
  }
}

function write(records: LocalRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)))
  } catch {
    // 存储配额满或隐私模式：历史记录不是主流程，静默放弃本次写入
  }
}

export function pushLocalRecord(result: SimulationResult, source: DataSource): void {
  const records = read().filter((item) => item.result.simulationId !== result.simulationId)
  write([{ savedAt: new Date().toISOString(), source, result }, ...records])
}

export function clearLocalRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 同上：清不掉也不影响主流程
  }
}

export function findLocalSnapshot(simulationId: string): LocalRecord | null {
  return read().find((item) => item.result.simulationId === simulationId) ?? null
}

export function localHistoryItems(): HistoryItem[] {
  return read().map(({ savedAt, result }) => ({
    simulationId: result.simulationId,
    rainType: result.rainType,
    allocation: result.allocation,
    overallScore: result.overallScore,
    grade: result.grade,
    strategyType: result.strategyType,
    createdAt: savedAt,
  }))
}

const timeOf = (item: HistoryItem): number => (item.createdAt ? Date.parse(item.createdAt) : 0)

/** 后端历史 + 仅存在于本机的记录（按 preview- 前缀识别），按时间倒序合并去重 */
export async function loadHistory(limit = 20): Promise<{
  items: HistoryItem[]
  total: number
  origin: DataSource
}> {
  const local = localHistoryItems()
  try {
    const remote = await getHistory(limit)
    const ids = new Set(remote.items.map((item) => item.simulationId))
    const localOnly = local.filter((item) => !ids.has(item.simulationId))
    const items = [...remote.items, ...localOnly].sort((a, b) => timeOf(b) - timeOf(a))
    return { items: items.slice(0, limit), total: remote.total + localOnly.length, origin: 'backend' }
  } catch {
    return { items: local.slice(0, limit), total: local.length, origin: 'preview' }
  }
}

/** 榜单：后端本地示例数据；后端不可用时用本机快照排序，口径一致（分数倒序） */
export async function loadLeaderboard(limit = 10): Promise<{
  items: LeaderboardItem[]
  note: string
  origin: DataSource
}> {
  try {
    const remote = await getLeaderboard(limit)
    return { items: remote.items, note: remote.note, origin: 'backend' }
  } catch {
    const ranked = [...localHistoryItems()]
      .sort((a, b) => b.overallScore - a.overallScore || timeOf(a) - timeOf(b))
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }))
    return {
      items: ranked,
      note: '本机浏览器缓存的推演记录，非联网排行榜',
      origin: 'preview',
    }
  }
}

/** 取某条记录的完整结果：优先本机快照，其次后端详情接口；都没有返回 null */
export async function loadSnapshot(
  simulationId: string,
): Promise<{ result: SimulationResult; source: DataSource } | null> {
  const local = findLocalSnapshot(simulationId)
  if (local) return { result: local.result, source: local.source }
  try {
    return { result: await getSimulationById(simulationId), source: 'backend' }
  } catch {
    return null
  }
}

/** 后端健康状态（设置页显示）。
 *  只有「status=ok 且 rulesVersion 与本仓库规则版本一致」才算已连接：
 *  若 8000 端口被别的服务/别的规则版本占用，推演接口会 404 或口径不同，
 *  此时应如实显示未连接（实际会降级到本地预览引擎），而不是假装已连上。 */
export async function probeBackend(): Promise<{ online: boolean; rulesVersion: string }> {
  try {
    const health = await getHealth()
    const ok = health.status === 'ok' && health.rulesVersion === RULES_VERSION
    return { online: ok, rulesVersion: health.rulesVersion ?? '' }
  } catch {
    return { online: false, rulesVersion: '' }
  }
}
