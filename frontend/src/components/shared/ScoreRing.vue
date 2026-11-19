<script setup lang="ts">
import { computed } from 'vue'

/**
 * 环形预期指标。数值一律来自预览结果对象（0–100），组件不做任何换算。
 * 环用 conic-gradient 实现，避免每处再引一套图表库实例。
 */
const props = withDefaults(
  defineProps<{ value: number; label: string; accent?: string; size?: number; sub?: string }>(),
  { accent: 'var(--cyan)', size: 66 },
)

const clamped = computed(() => Math.max(0, Math.min(100, props.value)))
const style = computed(() => ({
  '--ring-value': `${clamped.value * 3.6}deg`,
  '--ring-accent': props.accent,
  width: `${props.size}px`,
  height: `${props.size}px`,
}))
</script>

<template>
  <div class="ring-wrap">
    <div class="ring" :style="style">
      <div class="hole">
        <span class="value num">{{ clamped }}</span>
        <slot name="icon" />
      </div>
    </div>
    <span class="label">{{ label }}</span>
    <span v-if="sub" class="sub mono">{{ sub }}</span>
  </div>
</template>

<style scoped>
.ring-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ring {
  position: relative;
  border-radius: 50%;
  background:
    conic-gradient(var(--ring-accent) var(--ring-value), color-mix(in srgb, var(--border) 65%, transparent) 0);
  display: grid;
  place-items: center;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--ring-accent) 28%, transparent));
}

.ring::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--ring-accent) 20%, transparent);
}

.hole {
  width: calc(100% - 9px);
  height: calc(100% - 9px);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, var(--surface-2), var(--surface-1));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: var(--ring-accent);
}

.value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: var(--text);
}

.label {
  font-size: var(--fs-tiny);
  color: var(--text-muted);
  white-space: nowrap;
}

.sub {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}
</style>
