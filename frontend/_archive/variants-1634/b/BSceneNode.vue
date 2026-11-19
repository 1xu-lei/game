<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Bus, GraduationCap, Store, Trees } from 'lucide-vue-next'
import type { ScenarioResult, SceneId } from '@/types'
import { SCENARIO_MAP } from '@/config/sites'
import LevelPips from '@/components/shared/LevelPips.vue'

/**
 * B 版场景节点：浮在全屏城市上的图标牌 + 名称 + 投入徽标 + 0–5 档位灯条。
 * 0 点投入不做隐藏 / 置灰删除，只补一枚「无投入」标签，保证五个场景永远可见。
 */
const props = defineProps<{
  id: SceneId
  result: ScenarioResult
  side: 'left' | 'right' | 'top' | 'bottom'
  selected: boolean
  hovered: boolean
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
const isEmpty = computed(() => props.result.invested === 0)
</script>

<template>
  <button
    type="button"
    class="node"
    :class="[`side-${side}`, { 'is-selected': selected, 'is-hovered': hovered, 'is-empty': isEmpty }]"
    :style="{ '--accent': accent }"
    @click="emit('select', id)"
    @mouseenter="emit('hover', id)"
    @mouseleave="emit('hover', null)"
  >
    <span class="dot">
      <component :is="ICONS[id]" :size="18" :stroke-width="1.8" />
      <span class="badge num" :class="{ 'is-zero': isEmpty }">{{ result.invested }}</span>
    </span>

    <span class="plate">
      <span class="line">
        <span class="name">{{ scene.name }}</span>
        <span v-if="isSink" class="tag tag--sink">最终压力</span>
        <span v-else-if="isEmpty" class="tag tag--zero">无投入</span>
      </span>
      <span class="line line--meta">
        <LevelPips :value="result.invested" :accent="accent" size="xs" />
        <span class="stage">{{ result.stageLabel }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0;
  transform: translate(-50%, -50%);
  transition: transform var(--dur-2) var(--ease), filter var(--dur-2) var(--ease);
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.6));
  z-index: 1;
}

.node.side-left {
  flex-direction: row-reverse;
}

.node.side-top {
  flex-direction: column-reverse;
  gap: 7px;
}

.node.side-bottom {
  flex-direction: column;
  gap: 7px;
}

.node:hover,
.node.is-hovered,
.node:focus-visible {
  transform: translate(-50%, calc(-50% - 4px));
  filter: drop-shadow(0 14px 26px rgba(0, 0, 0, 0.72));
  z-index: 2;
}

.dot {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--accent);
  background: radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--accent) 24%, var(--surface-3)), var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--bg) 58%, transparent);
  transition: box-shadow var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
}

.badge {
  position: absolute;
  right: -5px;
  bottom: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #04111d;
  font-size: 9px;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--bg) 72%, transparent);
}

.badge.is-zero {
  background: color-mix(in srgb, var(--surface-elevated) 90%, var(--bg));
  color: var(--text-muted);
  border-color: var(--border-soft);
}

.plate {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px 7px;
  border-radius: var(--r-sm);
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  border: 1px solid var(--border-soft);
  white-space: nowrap;
  transition: border-color var(--dur-2) var(--ease), background var(--dur-2) var(--ease);
}

.line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.line--meta {
  gap: 7px;
}

.name {
  font-size: var(--fs-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text);
}

.stage {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.tag {
  padding: 0 4px;
  border-radius: 3px;
  font-size: 9px;
  line-height: 14px;
}

.tag--sink {
  color: var(--risk);
  background: var(--risk-soft);
}

.tag--zero {
  color: var(--text-dim);
  background: color-mix(in srgb, var(--border) 42%, transparent);
}

.is-empty .dot {
  color: color-mix(in srgb, var(--accent) 62%, var(--text-muted));
}

.is-selected .dot {
  border-color: var(--cyan);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--bg) 52%, transparent),
    0 0 0 6px var(--cyan-line),
    0 0 24px -4px color-mix(in srgb, var(--cyan) 55%, transparent);
}

.is-selected .plate {
  border-color: var(--cyan);
  background: var(--surface-elevated);
}
</style>
