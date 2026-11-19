<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Bus, GraduationCap, Store, Trees } from 'lucide-vue-next'
import type { SceneId } from '@/types'
import { SCENARIO_MAP } from '@/config/sites'

/**
 * 城市水流关系小图（固定 5 节点 / 固定 3 条水路，禁止随机连线）
 * school → park ，market → residential ，两路 → station（最终压力承受点）
 * 线宽取该场景的 outflow（残余径流），把「谁在往下游送水」直接画出来。
 */
const props = withDefaults(
  defineProps<{
    activeId?: SceneId | null
    outflows?: Record<SceneId, number>
    labels?: boolean
  }>(),
  { activeId: null, outflows: undefined, labels: true },
)

const emit = defineEmits<{ (e: 'select', id: SceneId): void }>()

const ICONS = {
  school: GraduationCap,
  market: Store,
  park: Trees,
  residential: Building2,
  station: Bus,
} as const

const NODES: { id: SceneId; x: number; y: number }[] = [
  { id: 'school', x: 20, y: 20 },
  { id: 'park', x: 58, y: 20 },
  { id: 'market', x: 20, y: 54 },
  { id: 'residential', x: 58, y: 54 },
  { id: 'station', x: 39, y: 86 },
]

const widthFor = (id: SceneId) => {
  const v = props.outflows?.[id]
  if (v === undefined) return 1.4
  return 1.1 + Math.min(100, Math.max(0, v)) / 26
}

const links = computed(() => [
  { from: 'school', to: 'park', d: 'M20 20 L58 20', w: widthFor('school') },
  { from: 'market', to: 'residential', d: 'M20 54 L58 54', w: widthFor('market') },
  { from: 'park', to: 'station', d: 'M58 20 C 58 48, 46 66, 39 84', w: widthFor('park') },
  { from: 'residential', to: 'station', d: 'M58 54 C 56 68, 46 76, 39 84', w: widthFor('residential') },
])

const nameOf = (id: SceneId) => SCENARIO_MAP[id].name
const accentOf = (id: SceneId) => `var(${SCENARIO_MAP[id].accentVar})`
</script>

<template>
  <div class="graph">
    <svg class="wires" viewBox="0 0 78 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="flow-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--cyan)" opacity="0.85" />
        </marker>
      </defs>
      <path
        v-for="link in links"
        :key="`${link.from}-${link.to}`"
        :d="link.d"
        fill="none"
        :stroke="activeId === link.from || activeId === link.to ? 'var(--cyan)' : 'var(--cyan-line)'"
        :stroke-width="link.w"
        stroke-linecap="round"
        stroke-dasharray="1.6 2.2"
        vector-effect="non-scaling-stroke"
        class="wire"
      />
      <circle cx="39" cy="86" r="12" fill="none" stroke="var(--risk)" stroke-width="0.7" stroke-dasharray="2 3" opacity="0.8" />
    </svg>

    <button
      v-for="node in NODES"
      :key="node.id"
      type="button"
      class="node"
      :class="{ 'is-active': activeId === node.id, 'is-sink': node.id === 'station' }"
      :style="{ left: `${node.x}%`, top: `${node.y}%`, '--accent': accentOf(node.id) }"
      @click="emit('select', node.id)"
    >
      <component :is="ICONS[node.id]" :size="15" :stroke-width="1.8" />
      <span v-if="labels" class="name">{{ nameOf(node.id) }}</span>
    </button>
  </div>
</template>

<style scoped>
.graph {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 150px;
}

.wires {
  position: absolute;
  inset: 0 18% 0 6%;
  width: auto;
  height: 100%;
}

.wire {
  transition: stroke var(--dur-1) var(--ease), stroke-width var(--dur-2) var(--ease);
}

.node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px;
  color: var(--text-muted);
  border-radius: var(--r-sm);
  transition: color var(--dur-1) var(--ease), transform var(--dur-1) var(--ease);
}

.node :deep(svg) {
  color: var(--accent);
}

.node:hover,
.node.is-active {
  color: var(--text);
  transform: translate(-50%, -50%) scale(1.06);
}

.node.is-active {
  box-shadow: 0 0 0 1px var(--cyan-line), 0 0 18px -6px var(--cyan);
}

.node.is-sink {
  color: var(--risk);
}

.name {
  font-size: var(--fs-micro);
  letter-spacing: 0.04em;
  white-space: nowrap;
}
</style>
