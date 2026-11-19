<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { FastForward, Radar } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import SimulationTimeline from '@/components/SimulationTimeline.vue'
import SimulationEventLog from '@/components/SimulationEventLog.vue'
import { useTimelinePlayback } from '@/composables/useTimelinePlayback'
import { useSimulationStore } from '@/stores/simulation'

const sim = useSimulationStore()
const { playbackStep } = storeToRefs(sim)

/**
 * 播放只推进 playbackStep（纯展示状态）。
 * 跳过 → sim.finish()，与完整播放得到的结算数值完全一致。
 */
useTimelinePlayback(playbackStep, sim.totalSteps, () => sim.finish())

const progress = computed(() => sim.playbackProgress)
</script>

<template>
  <div class="overlay" role="dialog" aria-modal="true" aria-label="推演进行中">
    <section class="overlay-panel">
      <header class="overlay-head">
        <span class="ico-chip is-amber"><Radar :size="14" /></span>
        <div class="head-text">
          <strong>推演进行中</strong>
          <em>{{ sim.currentStepLabel }} · 第 {{ playbackStep }}/{{ sim.totalSteps }} 步</em>
        </div>
        <NButton class="rc-btn skip-btn" quaternary size="small" @click="sim.finish()">
          <template #icon><FastForward :size="14" /></template>
          跳过 / 快速结算
        </NButton>
      </header>

      <div class="progress">
        <i :style="{ width: `${progress}%` }" />
      </div>

      <div class="overlay-body">
        <SimulationTimeline :steps="sim.steps" :current="playbackStep" />
        <SimulationEventLog :events="sim.visibleEvents" live />
      </div>

      <footer class="overlay-foot">
        <span class="hint">
          动画不参与计算：无论完整播放还是跳过，结算结果与 {{ sim.sourceLabel }} 输出完全一致。
        </span>
        <span class="source-chip" :class="{ 'is-backend': sim.source === 'backend' }">
          {{ sim.sourceLabel }}
        </span>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(2px);
}

.overlay-panel {
  display: flex;
  flex-direction: column;
  width: min(860px, 100%);
  max-height: 82vh;
  background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
}

.overlay-head {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line-hair);
}

.head-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.head-text strong {
  font-size: var(--fs-md);
  letter-spacing: 0.04em;
}

.head-text em {
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-dim);
}

.skip-btn {
  margin-left: auto;
}

.progress {
  position: relative;
  flex: none;
  height: 3px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.progress > i {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  background: linear-gradient(90deg, var(--cyan), var(--amber));
  transition: width var(--dur-2) var(--ease);
}

.overlay-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 12px 14px;
}

.overlay-foot {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid var(--line-hair);
}

.overlay-foot .hint {
  flex: 1;
}
</style>
