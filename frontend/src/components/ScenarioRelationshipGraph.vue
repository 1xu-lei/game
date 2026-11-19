<script setup lang="ts">
import { Waves } from 'lucide-vue-next'
import { useSceneVisuals } from '@/composables/useSceneVisuals'
import type { AllocationMap, SceneId } from '@/types'

interface Props {
  allocation: AllocationMap
  selected?: SceneId | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [id: SceneId] }>()

const { accentOf } = useSceneVisuals()

/** 固定水流关系（规格书 §2）：学校→公园，集市→居民区，两路→车站 */
interface NodePos {
  id: SceneId
  label: string
  x: number
  y: number
}

const NODES: NodePos[] = [
  { id: 'school', label: '学校', x: 62, y: 34 },
  { id: 'park', label: '公园', x: 202, y: 34 },
  { id: 'market', label: '集市', x: 62, y: 102 },
  { id: 'residential', label: '居民区', x: 202, y: 102 },
  { id: 'station', label: '车站', x: 132, y: 168 },
]

const NODE_W = 80
const NODE_H = 28

const tickX = (x: number, i: number) => x - 34 + i * 8
const levelOf = (id: SceneId) => props.allocation[id]
const isActive = (id: SceneId) => (levelOf(id) > 0 ? 'is-filled' : 'is-empty')
</script>

<template>
  <section class="panel rel-graph">
    <header class="panel-head">
      <span class="ico-chip"><Waves :size="13" /></span>
      <span class="panel-label">城市水流关系</span>
      <span class="panel-meta">固定 4 条连线</span>
    </header>

    <div class="graph-body">
      <svg viewBox="0 0 264 196" role="img" aria-label="五个场景的固定水流关系图">
        <defs>
          <marker
            id="flow-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" class="arrow-head" />
          </marker>
        </defs>

        <!-- 固定连线：school→park / market→residential / park+residential→station -->
        <g class="flows">
          <line x1="102" y1="34" x2="160" y2="34" marker-end="url(#flow-arrow)" />
          <line x1="102" y1="102" x2="160" y2="102" marker-end="url(#flow-arrow)" />
          <path d="M202 48 C202 96 152 120 126 152" marker-end="url(#flow-arrow)" />
          <path d="M202 116 C202 132 164 140 148 152" marker-end="url(#flow-arrow)" />
        </g>

        <g
          v-for="node in NODES"
          :key="node.id"
          class="node"
          :class="[isActive(node.id), { 'is-selected': props.selected === node.id }]"
          :style="{ '--accent': accentOf(node.id) }"
          role="button"
          tabindex="0"
          @click="emit('select', node.id)"
          @keydown.enter.prevent="emit('select', node.id)"
        >
          <rect
            :x="node.x - NODE_W / 2"
            :y="node.y - NODE_H / 2"
            :width="NODE_W"
            :height="NODE_H"
            rx="7"
          />
          <circle :cx="node.x - 30" :cy="node.y - 4" r="3" class="node-dot" />
          <text :x="node.x - 22" :y="node.y" class="node-name">{{ node.label }}</text>
          <text :x="node.x + 32" :y="node.y - 1" class="node-level num" text-anchor="end">
            {{ levelOf(node.id) === 0 ? '0' : `${levelOf(node.id)}点` }}
          </text>
          <rect
            v-for="i in 5"
            :key="i"
            :x="tickX(node.x, i - 1)"
            :y="node.y + 8"
            width="6"
            height="3"
            rx="1.5"
            class="node-tick"
            :class="{ 'is-on': i <= levelOf(node.id) }"
          />
        </g>

        <text x="132" y="192" class="graph-note" text-anchor="middle">
          车站 = 两路汇流的最终压力承受点
        </text>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.rel-graph {
  min-height: 0;
}

.graph-body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 6px 10px 8px;
}

svg {
  width: 100%;
  height: auto;
  max-height: 100%;
}

.flows line,
.flows path {
  fill: none;
  stroke: color-mix(in srgb, var(--cyan) 52%, transparent);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
  animation: flow-drift 3.2s linear infinite;
}

.arrow-head {
  fill: color-mix(in srgb, var(--cyan) 70%, transparent);
}

@keyframes flow-drift {
  to {
    stroke-dashoffset: -18;
  }
}

.node {
  cursor: pointer;
}

.node rect:first-child {
  fill: color-mix(in srgb, var(--surface-elevated) 62%, transparent);
  stroke: var(--border);
  stroke-width: 1;
  transition:
    fill var(--dur-1) var(--ease),
    stroke var(--dur-1) var(--ease);
}

.node.is-filled rect:first-child {
  fill: color-mix(in srgb, var(--accent) 16%, var(--surface));
  stroke: color-mix(in srgb, var(--accent) 46%, transparent);
}

.node:hover rect:first-child {
  stroke: var(--accent);
}

.node.is-selected rect:first-child {
  stroke: var(--accent);
  stroke-width: 1.6;
}

.node-dot {
  fill: color-mix(in srgb, var(--accent) 60%, transparent);
}

.node.is-filled .node-dot {
  fill: var(--accent);
}

.node-name {
  font-family: var(--font-sans);
  font-size: 10px;
  fill: var(--text-muted);
  dominant-baseline: middle;
}

.node.is-filled .node-name {
  fill: var(--text);
}

.node-level {
  font-size: 8.5px;
  fill: var(--text-dim);
  dominant-baseline: middle;
}

.node.is-filled .node-level {
  fill: var(--accent);
}

.node-tick {
  fill: color-mix(in srgb, var(--text) 12%, transparent);
}

.node-tick.is-on {
  fill: var(--accent);
}

.graph-note {
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.04em;
  fill: color-mix(in srgb, var(--amber) 72%, transparent);
}
</style>
