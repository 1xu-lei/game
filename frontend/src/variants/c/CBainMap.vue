<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Bus, GraduationCap, Store, Trees } from 'lucide-vue-next'
import { SCENARIO_MAP, FLOW_LINKS } from '@/config/sites'
import { NODE_LAYOUTS } from '@/config/nodeLayout'
import { useGameStore } from '@/stores/game'
import type { SceneId } from '@/types'

/**
 * C 版中央：平面流域示意图（俯视制图感，不是等距插画）。
 * 等高线 + 河道带 + 四条固定输水线；线宽 = 该场景 outflow，方向不得反向。
 */
const store = useGameStore()
const nodes = NODE_LAYOUTS.c

const ICONS = {
  school: GraduationCap,
  market: Store,
  park: Trees,
  residential: Building2,
  station: Bus,
} as const

const byId = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r
      return acc
    },
    {} as Record<SceneId, (typeof store.preview.scenarioResults)[number]>,
  ),
)

const anchor = (id: SceneId) => nodes.find((n) => n.id === id)!

/** 线宽：outflow 越大越粗（1.0 – 3.6） */
const w = (id: SceneId) => (1 + Math.min(100, byId.value[id].outflow) / 40).toFixed(2)

const pipes = computed(() =>
  FLOW_LINKS.map((link) => {
    const a = anchor(link.from)
    const b = anchor(link.to)
    const mx = (a.x + b.x) / 2
    return {
      key: `${link.from}-${link.to}`,
      d: `M${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`,
      width: w(link.from),
      value: byId.value[link.from].outflow,
      cx: mx,
      cy: (a.y + b.y) / 2,
    }
  }),
)
</script>

<template>
  <div class="map">
    <div class="canvas">
      <svg class="sheet" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="c-river" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="rgba(56,189,248,0.20)" />
            <stop offset="60%" stop-color="rgba(45,212,191,0.13)" />
            <stop offset="100%" stop-color="rgba(7,19,33,0.05)" />
          </linearGradient>
          <marker id="c-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L6 3 L0 6 z" fill="var(--cyan)" />
          </marker>
        </defs>

        <!-- 制图网格 -->
        <g stroke="rgba(36,67,93,0.4)" stroke-width="0.15">
          <template v-for="i in 11" :key="`g${i}`">
            <line :x1="(i - 1) * 10" y1="0" :x2="(i - 1) * 10" y2="100" />
            <line x1="0" :y1="(i - 1) * 10" x2="100" :y2="(i - 1) * 10" />
          </template>
        </g>

        <!-- 等高线：越靠中心越高，示意流域地形 -->
        <g fill="none" stroke="rgba(56,189,248,0.16)" stroke-width="0.22">
          <ellipse cx="34" cy="46" rx="42" ry="34" />
          <ellipse cx="34" cy="46" rx="34" ry="27" />
          <ellipse cx="34" cy="46" rx="25" ry="19" />
          <ellipse cx="34" cy="46" rx="15" ry="11" />
        </g>

        <!-- 河道带：自左上汇入右下低洼车站 -->
        <path d="M-2 88 C 24 84, 44 74, 62 62 S 88 50, 102 46" fill="none" stroke="url(#c-river)" stroke-width="7" stroke-linecap="round" />
        <path d="M-2 88 C 24 84, 44 74, 62 62 S 88 50, 102 46" fill="none" stroke="rgba(45,212,191,0.5)" stroke-width="0.45" stroke-linecap="round" />

        <!-- 固定输水线 -->
        <path
          v-for="pipe in pipes"
          :key="pipe.key"
          :d="pipe.d"
          fill="none"
          stroke="var(--cyan)"
          :stroke-width="pipe.width"
          stroke-linecap="round"
          marker-end="url(#c-arrow)"
          opacity="0.62"
          class="pipe"
        />

        <!-- 车站汇流环 -->
        <circle :cx="anchor('station').x" :cy="anchor('station').y" r="11" fill="none" stroke="var(--risk)" stroke-width="0.4" stroke-dasharray="1.6 2.4" />
        <circle :cx="anchor('station').x" :cy="anchor('station').y" r="15" fill="none" stroke="rgba(240,139,54,0.22)" stroke-width="0.3" />
      </svg>

      <!-- 管线流量标注（mono 小字，读得出来源径流量） -->
      <span
        v-for="pipe in pipes"
        :key="`v-${pipe.key}`"
        class="flow-tag mono"
        :style="{ left: `${pipe.cx}%`, top: `${pipe.cy}%` }"
      >
        {{ pipe.value }}
      </span>

      <!-- 测点圆盘 -->
      <button
        v-for="n in nodes"
        :key="n.id"
        type="button"
        class="puck"
        :class="{ 'is-selected': store.selectedScene === n.id, 'is-zero': byId[n.id].invested === 0 }"
        :style="{ left: `${n.x}%`, top: `${n.y}%`, '--accent': `var(${SCENARIO_MAP[n.id].accentVar})` }"
        @click="store.selectScene(n.id)"
        @mouseenter="store.setHover(n.id)"
        @mouseleave="store.setHover(null)"
      >
        <span class="ring">
          <component :is="ICONS[n.id]" :size="15" :stroke-width="1.8" />
        </span>
        <span class="tag">
          {{ SCENARIO_MAP[n.id].name }}
          <i class="num">{{ byId[n.id].invested }}</i>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.map {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  min-width: 0;
  padding: 6px;
}

.canvas {
  position: relative;
  width: min(100%, 62vh);
  aspect-ratio: 1 / 1;
  max-height: 100%;
}

.sheet {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--r-lg);
  border: 1px solid var(--border-soft);
  background:
    radial-gradient(70% 60% at 32% 38%, rgba(56, 189, 248, 0.07), transparent 70%),
    linear-gradient(180deg, #081724, #061220);
}

.pipe {
  stroke-dasharray: 2.4 2.6;
  animation: flow 5s linear infinite;
}

@keyframes flow {
  to {
    stroke-dashoffset: -20;
  }
}

.flow-tag {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0 3px;
  font-size: 9px;
  line-height: 13px;
  color: var(--text-dim);
  background: color-mix(in srgb, #061220 80%, transparent);
  border-radius: 2px;
  pointer-events: none;
}

.puck {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0;
  transform: translate(-50%, -50%);
  transition: transform var(--dur-2) var(--ease);
}

.puck:hover {
  transform: translate(-50%, calc(-50% - 2px));
}

.ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--accent);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--border));
}

.ring::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--accent) 34%, transparent);
}

.is-zero .ring {
  color: var(--text-dim);
  border-color: var(--border-soft);
  border-style: dashed;
}

.is-zero .ring::after {
  border-color: color-mix(in srgb, var(--border) 60%, transparent);
}

.tag {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 0 5px;
  font-size: var(--fs-micro);
  white-space: nowrap;
  color: var(--text-muted);
  background: color-mix(in srgb, #061220 84%, transparent);
  border-radius: 3px;
}

.tag i {
  font-style: normal;
  color: var(--accent);
  font-weight: 700;
}

.is-selected .ring {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 26%, transparent),
    0 0 22px -4px color-mix(in srgb, var(--accent) 70%, transparent);
}

.is-selected .tag {
  color: var(--text);
}
</style>
