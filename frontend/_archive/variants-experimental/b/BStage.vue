<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { NODE_LAYOUTS } from '@/config/nodeLayout'
import type { NodeAnchor } from '@/config/nodeLayout'
import { FLOW_LINKS } from '@/config/sites'
import type { ScenarioResult, SceneId } from '@/types'
import BSceneNode from './BSceneNode.vue'

/**
 * B 版全屏舞台：城市底图铺满视口 + 极淡雨层 + 固定水路 + 五个场景节点。
 * 节点坐标一律取自 NODE_LAYOUTS.b，水路顺序一律取自 FLOW_LINKS（不可增删）。
 */
const store = useGameStore()

const nodes = NODE_LAYOUTS.b

const resultOf = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r
      return acc
    },
    {} as Record<SceneId, ScenarioResult>,
  ),
)

const anchorOf = (id: SceneId) => nodes.find((n) => n.id === id)!

/** 二次贝塞尔：控制点沿法线外推，四条线在节点附近不互相压盖 */
function arcOf(from: NodeAnchor, to: NodeAnchor): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const bow = len * 0.1
  const cx = (from.x + to.x) / 2 - (dy / len) * bow
  const cy = (from.y + to.y) / 2 + (dx / len) * bow
  return `M${from.x} ${from.y} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${to.x} ${to.y}`
}

/** 线宽 = 该场景排往下游的径流量（outflow），只做像素映射，不做任何评分计算 */
const flows = computed(() =>
  FLOW_LINKS.map((link) => ({
    key: `${link.from}-${link.to}`,
    d: arcOf(anchorOf(link.from), anchorOf(link.to)),
    w: 1 + Math.min(100, Math.max(0, resultOf.value[link.from].outflow)) / 32,
  })),
)
</script>

<template>
  <section class="stage" aria-label="雨夜城市全景">
    <img class="bg" src="assets/scenes/city-overview.svg" alt="雨夜城市等距全景" draggable="false" />
    <div class="shade" />
    <div class="mist" :class="{ 'is-off': !store.rainLayerOn }" />
    <div
      class="rain"
      :class="{ 'is-off': !store.rainLayerOn, 'is-heavy': store.rainType === 'burst' }"
    />

    <div class="canvas">
      <svg class="flows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          v-for="f in flows"
          :key="f.key"
          class="flow"
          :d="f.d"
          fill="none"
          stroke="var(--cyan)"
          :stroke-width="f.w"
          stroke-linecap="round"
          stroke-dasharray="4 7"
          vector-effect="non-scaling-stroke"
          opacity="0.5"
        />
      </svg>

      <BSceneNode
        v-for="n in nodes"
        :key="n.id"
        :id="n.id"
        :result="resultOf[n.id]"
        :side="n.label"
        :selected="store.selectedScene === n.id"
        :hovered="store.hoveredScene === n.id"
        :style="{ left: `${n.x}%`, top: `${n.y}%` }"
        @select="store.selectScene"
        @hover="store.setHover"
      />
    </div>
  </section>
</template>

<style scoped>
.stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--bg);
  isolation: isolate;
}

.bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 50%;
  filter: saturate(1.04) contrast(1.05) brightness(0.92);
}

/* 压暗底色：先保 HUD 可读，再谈氛围 */
.shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(118% 82% at 50% 46%, transparent 34%, rgba(4, 12, 20, 0.74) 100%),
    linear-gradient(180deg, rgba(4, 12, 20, 0.82) 0%, rgba(5, 14, 23, 0.34) 18%, transparent 42%),
    linear-gradient(0deg, rgba(4, 12, 20, 0.86) 0%, rgba(5, 14, 23, 0.24) 26%, transparent 48%);
  pointer-events: none;
}

/* 顶部薄雾：只在雨层开启时出现，给城市一层低沉水汽 */
.mist {
  position: absolute;
  inset: 0 0 auto 0;
  height: 34%;
  background: radial-gradient(80% 100% at 50% 0%, color-mix(in srgb, var(--cyan) 9%, transparent), transparent 72%);
  opacity: 1;
  transition: opacity var(--dur-3) var(--ease);
  pointer-events: none;
}

.mist.is-off {
  opacity: 0;
}

/* 雨丝：两段错位斜线做位移循环，不产生粒子开销 */
.rain {
  position: absolute;
  inset: -24% -8% 0 -8%;
  background-image: repeating-linear-gradient(
    14deg,
    transparent 0 24px,
    color-mix(in srgb, var(--cyan) 16%, transparent) 24px 25px,
    transparent 25px 48px
  );
  mask-image: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.55) 46%, transparent 88%);
  animation: drift 2.8s linear infinite;
  opacity: 1;
  transition: opacity var(--dur-3) var(--ease);
  pointer-events: none;
}

.rain.is-heavy {
  background-image: repeating-linear-gradient(
    11deg,
    transparent 0 14px,
    color-mix(in srgb, var(--cyan) 24%, transparent) 14px 15px,
    transparent 15px 29px
  );
  animation-duration: 1.3s;
}

.rain.is-off {
  opacity: 0;
}

@keyframes drift {
  from {
    transform: translate3d(0, -34px, 0);
  }
  to {
    transform: translate3d(-12px, 0, 0);
  }
}

/* 节点坐标系：与 HUD 留出安全边距，保证 1366×768 下节点不被面板压住 */
.canvas {
  position: absolute;
  inset: 74px 348px 166px 20px;
}

.flows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.flow {
  animation: dash 3.6s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -22;
  }
}
</style>
