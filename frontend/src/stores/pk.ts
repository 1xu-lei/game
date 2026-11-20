import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { SCENARIOS } from '@/config/sites'
import type { SceneId, SimulationResult } from '@/types'

/**
 * 同设备双人 PK（规格书 §10.2 P2「同设备双人轮流 PK」，无联网）
 * ---------------------------------------------------------------
 * 借用《rain-corner-main》的对局口径，改成我们项目的评分体系：
 *   1. 玩家一分配 5 点 → 推演 → 锁定（锁定后只公开总分与等级，不公开加点）
 *   2. 玩家二重新分配 → 推演 → 判定
 *   3. **分数严格更高者胜；同分归先手（玩家一）** —— 与「相等不算赢」同一套判定哲学
 * 本 store 只保存两份已完成的结果快照并做比较，不重算任何分数、不新增后端接口。
 */
export type PkTurn = 1 | 2

export interface PkVerdict {
  winner: 'p1' | 'p2'
  tie: boolean
  p1Score: number
  p2Score: number
  delta: number
  title: string
  detail: string
  scenes: { sceneId: SceneId; name: string; p1: number; p2: number; delta: number }[]
}

export const usePkStore = defineStore('pk', () => {
  /** 是否处于 PK 模式（主流程的结算页据此切换按钮与判定） */
  const active = ref(false)
  /** 当前轮到谁 */
  const turn = ref<PkTurn>(1)
  const p1 = ref<SimulationResult | null>(null)
  const p2 = ref<SimulationResult | null>(null)

  const started = computed(() => active.value || p1.value !== null)
  const locked = computed(() => p1.value !== null)
  const turnLabel = computed(() => (turn.value === 1 ? '玩家一' : '玩家二'))

  const verdict = computed<PkVerdict | null>(() => {
    if (!p1.value || !p2.value) return null
    const first = p1.value
    const second = p2.value
    const delta = Number((second.overallScore - first.overallScore).toFixed(1))
    const tie = delta === 0
    const winner: 'p1' | 'p2' = tie ? 'p1' : delta > 0 ? 'p2' : 'p1'
    const scenes = SCENARIOS.map((scene) => {
      const a = first.scenarioResults.find((item) => item.sceneId === scene.id)?.effective ?? 0
      const b = second.scenarioResults.find((item) => item.sceneId === scene.id)?.effective ?? 0
      return { sceneId: scene.id, name: scene.name, p1: a, p2: b, delta: b - a }
    })
    return {
      winner,
      tie,
      p1Score: first.overallScore,
      p2Score: second.overallScore,
      delta,
      title: tie ? '同分 · 玩家一获胜' : `${winner === 'p1' ? '玩家一' : '玩家二'}获胜`,
      detail: tie
        ? `双方均为 ${first.overallScore} 分：同分归先手，玩家二必须严格更高才算获胜。`
        : `玩家一 ${first.overallScore} 分 → 玩家二 ${second.overallScore} 分（${delta > 0 ? '+' : ''}${delta}）`,
      scenes,
    }
  })

  function open(): void {
    active.value = true
  }

  /** 开一局新的 PK：清空双方记录，回到玩家一 */
  function restart(): void {
    active.value = true
    turn.value = 1
    p1.value = null
    p2.value = null
  }

  /** 退出 PK 模式（保留已跑完的记录，仅关闭流程） */
  function quit(): void {
    active.value = false
    turn.value = 1
  }

  /** 玩家一锁定：只留结果快照，交给玩家二 */
  function lockFirst(result: SimulationResult): void {
    p1.value = result
    p2.value = null
    turn.value = 2
    active.value = true
  }

  /** 玩家二交卷：写入第二份快照，判定由 verdict 计算 */
  function commitSecond(result: SimulationResult): void {
    if (!p1.value || result.simulationId === p1.value.simulationId) return
    p2.value = result
  }

  return {
    active,
    turn,
    p1,
    p2,
    started,
    locked,
    turnLabel,
    verdict,
    open,
    restart,
    quit,
    lockFirst,
    commitSecond,
  }
})
