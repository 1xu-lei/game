import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { SIM_STEPS } from '@/config/sites'
import { runSimulation } from '@/services/simulationService'
import { pushLocalRecord } from '@/services/history'
import type { DataSource, SceneId, SimulationResult } from '@/types'
import { useGameStore } from './game'
import { usePkStore } from './pk'

export type SimulationPhase = 'plan' | 'running' | 'result'

/** 播放步骤 → 需要高亮的场景（纯展示映射，不参与任何计算） */
const STEP_SCENE: Record<number, SceneId | null> = {
  1: null,
  2: 'school',
  3: 'park',
  4: 'residential',
  5: 'station',
  6: null,
}

/**
 * 推演会话状态
 * ---------------------------------------------------------------
 * 分配与雨型只存在 game store（唯一状态入口，规格书 §6.5），本 store 不复制一份。
 * result：点击「开始推演」后得到的结果快照。播放动画只推进 playbackStep，
 *         不会重新计算，也不会改变任何数值（跳过与看完结果完全一致）。
 */
export const useSimulationStore = defineStore('simulation', () => {
  const game = useGameStore()
  const pk = usePkStore()

  const phase = ref<SimulationPhase>('plan')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const source = ref<DataSource>('preview')
  const result = ref<SimulationResult | null>(null)
  const playbackStep = ref(1)

  const steps = SIM_STEPS
  const totalSteps = SIM_STEPS.length
  const playbackProgress = computed(() => Math.round((playbackStep.value / totalSteps) * 100))
  const currentStepLabel = computed(
    () => SIM_STEPS.find((s) => s.step === playbackStep.value)?.label ?? '',
  )
  const activeScene = computed<SceneId | null>(() => STEP_SCENE[playbackStep.value] ?? null)
  const visibleEvents = computed(() =>
    result.value ? result.value.events.filter((event) => event.step <= playbackStep.value) : [],
  )
  const sourceLabel = computed(() => (source.value === 'backend' ? '后端引擎' : '本地预览引擎'))

  async function run(): Promise<void> {
    if (!game.canSimulate || loading.value) return
    loading.value = true
    error.value = null
    const rainType = game.rainType
    const allocation = { ...game.allocation }
    try {
      const outcome = await runSimulation(rainType, allocation)
      result.value = outcome.result
      source.value = outcome.source
      playbackStep.value = 1
      phase.value = 'running'
      pushLocalRecord(outcome.result, outcome.source)
      /** 双人 PK 第二回合：只有真正跑出来的结果才交卷（历史回放不会误记） */
      if (pk.active && pk.turn === 2) pk.commitSecond(outcome.result)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '推演请求失败，请重试'
    } finally {
      loading.value = false
    }
  }

  /** 推进一格播放进度；已到末步则进入结算页 */
  function advance(): void {
    if (playbackStep.value < totalSteps) {
      playbackStep.value += 1
      return
    }
    finish()
  }

  /** 跳过 / 快速结算：跳到结算页，数值与完整播放完全一致 */
  function finish(): void {
    playbackStep.value = totalSteps
    phase.value = 'result'
  }

  /** 返回调整：保留当前分配 */
  function backToPlan(): void {
    phase.value = 'plan'
    playbackStep.value = 1
  }

  /** 再玩一次：清空分配，重新开始 */
  function playAgain(): void {
    game.reset()
    result.value = null
    playbackStep.value = 1
    phase.value = 'plan'
  }

  /** 查看历史记录里的某一份结果（只读快照，不重新计算） */
  function showSnapshot(snapshot: SimulationResult, from: DataSource): void {
    result.value = snapshot
    source.value = from
    playbackStep.value = totalSteps
    phase.value = 'result'
  }

  return {
    phase,
    loading,
    error,
    source,
    sourceLabel,
    result,
    steps,
    totalSteps,
    playbackStep,
    playbackProgress,
    currentStepLabel,
    activeScene,
    visibleEvents,
    run,
    advance,
    finish,
    backToPlan,
    playAgain,
    showSnapshot,
  }
})
