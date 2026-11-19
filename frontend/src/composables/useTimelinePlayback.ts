import { onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

/**
 * 推演过程播放器
 * ---------------------------------------------------------------
 * 只推进「播放进度」这一个纯展示状态，不改动 store 里的结果快照，
 * 因此「跳过」与「完整播放」得到的结算数值必然一致。
 */
export function useTimelinePlayback(
  step: Ref<number>,
  total: number,
  onComplete: () => void,
  intervalMs = 1150,
) {
  let ticker: number | null = null
  let doneTimer: number | null = null

  function stop(): void {
    if (ticker !== null) {
      window.clearInterval(ticker)
      ticker = null
    }
    if (doneTimer !== null) {
      window.clearTimeout(doneTimer)
      doneTimer = null
    }
  }

  ticker = window.setInterval(() => {
    if (step.value < total) {
      step.value += 1
      return
    }
    stop()
    doneTimer = window.setTimeout(onComplete, 900)
  }, intervalMs)

  onBeforeUnmount(stop)

  return { stop }
}
