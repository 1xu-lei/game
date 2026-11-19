<script setup lang="ts">
import { computed } from 'vue'
import { stageLabelOf } from '@/engine/previewEngine'
import { useSceneVisuals } from '@/composables/useSceneVisuals'
import type { ScenarioConfig, SceneId } from '@/types'

interface Props {
  scene: ScenarioConfig
  level: number
  selected?: boolean
  active?: boolean
  /** 地图坐标（百分比，基于 city-overview 画布） */
  x: number
  y: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [id: SceneId] }>()

const { iconOf, accentOf } = useSceneVisuals()

const icon = computed(() => iconOf(props.scene.id))
const accent = computed(() => accentOf(props.scene.id))
const stageLabel = computed(() => stageLabelOf(props.level))
</script>

<template>
  <button
    type="button"
    class="node"
    :class="{ 'is-selected': props.selected, 'is-active': props.active, 'is-zero': props.level === 0 }"
    :style="{ left: `${props.x}%`, top: `${props.y}%`, '--accent': accent }"
    :aria-label="`${props.scene.name}，${stageLabel}`"
    @click="emit('select', props.scene.id)"
  >
    <span class="node-pill">
      <span class="node-icon"><component :is="icon" :size="13" /></span>
      <span class="node-name">{{ props.scene.name }}</span>
      <span class="node-flag" :class="{ 'is-zero': props.level === 0 }">
        {{ props.level === 0 ? '无专项投入' : `${props.level} 点` }}
      </span>
    </span>
    <span class="node-bars">
      <i v-for="i in 5" :key="i" :class="{ 'is-on': i <= props.level }" />
    </span>
    <span class="node-stem" />
  </button>
</template>

<style scoped>
.node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0;
  transform: translate(-50%, -100%);
  transition:
    transform var(--dur-1) var(--ease),
    filter var(--dur-1) var(--ease);
}

.node:hover {
  z-index: 3;
  transform: translate(-50%, -100%) translateY(-2px);
}

.node-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px 4px 5px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  box-shadow: 0 10px 22px -14px rgba(0, 0, 0, 0.95);
  transition:
    border-color var(--dur-1) var(--ease),
    box-shadow var(--dur-1) var(--ease);
}

.node-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-radius: var(--r-pill);
}

.node-name {
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text);
  white-space: nowrap;
}

.node-flag {
  font-family: var(--font-num);
  font-size: var(--fs-micro);
  color: var(--accent);
  white-space: nowrap;
}

.node-flag.is-zero {
  color: var(--text-dim);
}

.node-bars {
  display: flex;
  gap: 2px;
  padding: 2px 4px;
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  border-radius: var(--r-pill);
}

.node-bars i {
  width: 9px;
  height: 2.5px;
  background: color-mix(in srgb, var(--text) 16%, transparent);
  border-radius: 2px;
}

.node-bars i.is-on {
  background: var(--accent);
  box-shadow: 0 0 6px -1px var(--accent);
}

.node-stem {
  width: 1px;
  height: 10px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 70%, transparent), transparent);
}

.node:hover .node-pill,
.node.is-selected .node-pill {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
}

.node.is-active .node-pill {
  border-color: var(--accent);
  box-shadow: 0 0 22px -6px color-mix(in srgb, var(--accent) 80%, transparent);
}

.node.is-zero .node-pill {
  background: color-mix(in srgb, var(--surface) 84%, transparent);
  border-style: dashed;
}
</style>
