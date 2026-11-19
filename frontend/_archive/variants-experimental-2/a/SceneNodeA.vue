<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Bus, GraduationCap, Store, Trees } from 'lucide-vue-next'
import type { ScenarioResult, SceneId } from '@/types'
import { SCENARIO_MAP } from '@/config/sites'
import LevelPips from '@/components/shared/LevelPips.vue'

/**
 * A 版场景节点：图标 + 名称牌 + 0–5 档位灯条。
 * 档位刻意用灯条而不是环形进度——环形留给底部「预期效果」那一排，避免重复表达。
 */
const props = defineProps<{
  id: SceneId
  result: ScenarioResult
  selected: boolean
  hovered: boolean
  side: 'left' | 'right' | 'top' | 'bottom'
}>()

const emit = defineEmits<{ (e: 'select', id: SceneId): void; (e: 'hover', id: SceneId | null): void }>()

const ICONS = {
  school: GraduationCap,
  market: Store,
  park: Trees,
  residential: Building2,
  station: Bus,
} as const

const scene = computed(() => SCENARIO_MAP[props.id])
const accent = computed(() => `var(${scene.value.accentVar})`)
const isSink = computed(() => props.id === 'station')
</script>

<template>
  <button
    type="button"
    class="node"
    :class="[`side-${side}`, { 'is-selected': selected, 'is-hovered': hovered, 'is-sink': isSink }]"
    :style="{ '--accent': accent }"
    @click="emit('select', id)"
    @mouseenter="emit('hover', id)"
    @mouseleave="emit('hover', null)"
  >
    <span class="dot">
      <component :is="ICONS[id]" :size="16" :stroke-width="1.8" />
      <span v-if="result.invested > 0" class="count num">{{ result.invested }}</span>
    </span>
    <span class="plate">
      <span class="row">
        <span class="name">{{ scene.name }}</span>
        <span v-if="isSink" class="tag-sink">最终压力</span>
        <span v-else-if="result.invested === 0" class="tag-zero">无投入</span>
      </span>
      <span class="row row--meta">
        <LevelPips :value="result.invested" :accent="accent" size="xs" />
        <span class="score num">{{ result.effective }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  padding: 0;
  transition: transform var(--dur-2) var(--ease), filter var(--dur-2) var(--ease);
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.55));
}

.node.side-left {
  flex-direction: row-reverse;
  transform: translate(-50%, -50%);
}

.node:hover,
.node.is-hovered {
  transform: translate(-50%, calc(-50% - 3px));
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.7));
}

.dot {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--accent);
  background: radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--accent) 26%, var(--surface-3)), var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--bg) 62%, transparent);
}

.count {
  position: absolute;
  right: -4px;
  bottom: -4px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #04111d;
  font-size: 9px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--bg) 70%, transparent);
}

.plate {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 9px 6px;
  border-radius: var(--r-sm);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(1px);
  white-space: nowrap;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.row--meta {
  gap: 7px;
}

.name {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.04em;
}

.score {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.tag-sink,
.tag-zero {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 3px;
  line-height: 14px;
}

.tag-sink {
  color: var(--risk);
  background: var(--risk-soft);
}

.tag-zero {
  color: var(--text-dim);
  background: color-mix(in srgb, var(--border) 40%, transparent);
}

.is-selected .dot {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--bg) 55%, transparent),
    0 0 0 5px color-mix(in srgb, var(--accent) 70%, transparent),
    0 0 24px -2px color-mix(in srgb, var(--accent) 60%, transparent);
}

.is-selected .plate {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  background: color-mix(in srgb, var(--surface-elevated) 92%, transparent);
}
</style>
