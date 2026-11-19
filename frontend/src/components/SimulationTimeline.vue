<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import type { SimulationStep } from '@/types'

interface Props {
  steps: SimulationStep[]
  current: number
}

const props = defineProps<Props>()

const items = computed(() =>
  props.steps.map((step) => ({
    ...step,
    state: step.step < props.current ? 'done' : step.step === props.current ? 'active' : 'pending',
  })),
)
</script>

<template>
  <ol class="timeline">
    <li v-for="item in items" :key="item.step" class="tl-step" :class="`is-${item.state}`">
      <span class="tl-dot">
        <Check v-if="item.state === 'done'" :size="11" />
        <span v-else class="num">{{ item.step }}</span>
      </span>
      <span class="tl-body">
        <strong>{{ item.label }}</strong>
        <em>{{ item.hint }}</em>
      </span>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
}

.tl-step {
  position: relative;
  display: flex;
  flex: 1;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding-right: 6px;
}

.tl-step::after {
  position: absolute;
  top: 10px;
  right: 2px;
  left: 24px;
  height: 1px;
  content: '';
  background: var(--line-hair);
}

.tl-step:last-child::after {
  display: none;
}

.tl-dot {
  display: grid;
  flex: none;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--text-dim);
  background: color-mix(in srgb, var(--text) 7%, transparent);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-pill);
  transition:
    color var(--dur-2) var(--ease),
    background var(--dur-2) var(--ease),
    border-color var(--dur-2) var(--ease);
}

.tl-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tl-body strong {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

.tl-body em {
  overflow: hidden;
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-dim);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-step.is-done .tl-dot {
  color: var(--bg);
  background: var(--cyan);
  border-color: var(--cyan);
}

.tl-step.is-done .tl-body strong {
  color: var(--text);
}

.tl-step.is-active .tl-dot {
  color: var(--bg);
  background: var(--amber);
  border-color: var(--amber);
  box-shadow: 0 0 14px -3px var(--amber);
}

.tl-step.is-active .tl-body strong {
  color: var(--amber);
}
</style>
