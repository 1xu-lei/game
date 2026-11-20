<script setup lang="ts">
import { computed, ref } from 'vue'
import { CloudOff, CloudRain, Droplets, Map as MapIcon } from 'lucide-vue-next'
import SceneNode from './SceneNode.vue'
import RainField from './shared/RainField.vue'
import { assetUrl } from '@/composables/useSceneVisuals'
import { FLOW_LINKS, SCENARIO_MAP, SCENARIOS } from '@/config/sites'
import { useScenarioStore } from '@/stores/scenario'
import type { AllocationMap, SceneId } from '@/types'

interface Props {
  allocation: AllocationMap
  selected?: SceneId | null
  /** 推演播放中需要高亮的场景 */
  activeScene?: SceneId | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [id: SceneId] }>()

const scenario = useScenarioStore()

const rainOn = ref(true)

/** 雨量强度 0–1：只驱动雨滴视觉，不参与规则计算 */
const rainIntensity = computed(() => (scenario.rainType === 'burst' ? 0.92 : 0.55))

/**
 * 节点坐标（百分比，基于 1200×760 的城市全景画布）
 * 集中在此维护，禁止在模板里散落魔法数字。
 */
const NODE_POS: Record<SceneId, { x: number; y: number }> = {
  school: { x: 28, y: 31 },
  market: { x: 19, y: 55 },
  park: { x: 72, y: 25 },
  residential: { x: 80, y: 57 },
  station: { x: 52, y: 79 },
}

/** 画布宽高比换算：百分比 y → viewBox y（viewBox 宽 100） */
const ART_H = (760 / 1200) * 100

function linkPath(from: SceneId, to: SceneId): string {
  const a = NODE_POS[from]
  const b = NODE_POS[to]
  const ay = (a.y * ART_H) / 100
  const by = (b.y * ART_H) / 100
  const mx = a.x + (b.x - a.x) * 0.48
  return `M ${a.x} ${ay} C ${mx} ${ay} ${mx} ${by} ${b.x} ${by}`
}

const links = computed(() => FLOW_LINKS.map((l) => ({ ...l, d: linkPath(l.from, l.to) })))

const stationPoint = computed(() => ({
  cx: NODE_POS.station.x,
  cy: (NODE_POS.station.y * ART_H) / 100,
}))

const scenes = computed(() => SCENARIOS.map((s) => ({ ...s, level: props.allocation[s.id] })))

const selectedName = computed(() =>
  props.selected ? SCENARIO_MAP[props.selected].name : null,
)
</script>

<template>
  <section class="panel map-panel">
    <header class="panel-head">
      <span class="ico-chip"><MapIcon :size="13" /></span>
      <span class="panel-label">城市全景 · 五场景</span>
      <span class="panel-meta">{{ scenario.currentRain.name }}</span>
      <button type="button" class="map-toggle" @click="rainOn = !rainOn">
        <component :is="rainOn ? CloudRain : CloudOff" :size="12" />
        <span>{{ rainOn ? '雨幕开' : '雨幕关' }}</span>
      </button>
    </header>

    <div class="map-body">
      <div class="map-plate">
        <div class="map-art">
          <img class="map-bg" :src="assetUrl('assets/scenes/city-overview.svg')" alt="城市等距全景" />

          <RainField
            :mode="scenario.rainType"
            :intensity="rainIntensity"
            :active="rainOn"
          />

          <svg class="map-flows" :viewBox="`0 0 100 ${ART_H}`" aria-hidden="true">
            <g class="flow-lines">
              <path v-for="link in links" :key="`${link.from}-${link.to}`" :d="link.d" />
            </g>
            <circle
              class="pressure-ring"
              :cx="stationPoint.cx"
              :cy="stationPoint.cy"
              r="1.6"
            />
            <circle class="pressure-core" :cx="stationPoint.cx" :cy="stationPoint.cy" r="0.7" />
          </svg>

          <SceneNode
            v-for="scene in scenes"
            :key="scene.id"
            :scene="scene"
            :level="scene.level"
            :selected="props.selected === scene.id"
            :active="props.activeScene === scene.id"
            :x="NODE_POS[scene.id].x"
            :y="NODE_POS[scene.id].y"
            @select="emit('select', $event)"
          />

          <div class="map-legend">
            <span class="legend-item">
              <Droplets :size="11" />
              水流自上游汇入低洼车站
            </span>
            <span v-if="selectedName" class="legend-item is-accent">
              已选：{{ selectedName }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-panel {
  flex: 1;
  min-height: 0;
}

.map-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text) 6%, transparent);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-pill);
  transition: color var(--dur-1) var(--ease);
}

.map-toggle:hover {
  color: var(--cyan);
}

.map-body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 8px;
}

.map-plate {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: radial-gradient(
      120% 90% at 50% 8%,
      color-mix(in srgb, var(--cyan) 10%, transparent),
      transparent 62%
    ),
    var(--bg);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-md);
}

.map-art {
  position: relative;
  width: 100%;
  aspect-ratio: 1200 / 760;
}

.map-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
}

/* —— 雨幕：纯装饰，可通过按钮关闭，不影响任何数值 —— */
.rain-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.5;
}

.rain-streak {
  position: absolute;
  inset: -20% 0;
  background-image: repeating-linear-gradient(
    102deg,
    transparent 0 13px,
    color-mix(in srgb, var(--cyan) 20%, transparent) 13px 14px,
    transparent 14px 30px
  );
  animation: rain-fall 1.1s linear infinite;
}

.rain-streak.is-slow {
  opacity: 0.6;
  background-image: repeating-linear-gradient(
    98deg,
    transparent 0 26px,
    color-mix(in srgb, var(--text) 12%, transparent) 26px 27px,
    transparent 27px 54px
  );
  animation-duration: 1.8s;
}

@keyframes rain-fall {
  to {
    transform: translate3d(-14px, 20%, 0);
  }
}

/* —— 水流连线 —— */
.map-flows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.flow-lines path {
  fill: none;
  stroke: color-mix(in srgb, var(--cyan) 62%, transparent);
  stroke-width: 1.8;
  stroke-dasharray: 3 2.4;
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--cyan) 55%, transparent));
  animation: flow-drift 2.6s linear infinite;
}

@keyframes flow-drift {
  to {
    stroke-dashoffset: -10.8;
  }
}

.pressure-ring {
  fill: none;
  stroke: color-mix(in srgb, var(--risk) 70%, transparent);
  stroke-width: 0.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: pressure-pulse 2.4s ease-out infinite;
}

.pressure-core {
  fill: var(--risk);
}

@keyframes pressure-pulse {
  0% {
    opacity: 0.9;
    transform: scale(0.6);
  }
  70% {
    opacity: 0;
    transform: scale(2.6);
  }
  100% {
    opacity: 0;
    transform: scale(2.6);
  }
}

.map-legend {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 8px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-pill);
  backdrop-filter: blur(2px);
}

.legend-item.is-accent {
  color: var(--cyan);
  border-color: var(--cyan-line);
}
</style>
