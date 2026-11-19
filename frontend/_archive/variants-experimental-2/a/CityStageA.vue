<script setup lang="ts">
import { computed } from 'vue'
import { CloudRain, Waves } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { NODE_LAYOUTS } from '@/config/nodeLayout'
import type { SceneId } from '@/types'
import SceneNodeA from './SceneNodeA.vue'

/**
 * A 版中央舞台：等距城市底图 + 5 个 HTML 浮层节点 + 固定水路连线。
 * 交互命中用 HTML 而不是 Canvas 命中测试——省时间、可访问性更好（任务卡 B 建议）。
 */
const store = useGameStore()

const nodes = NODE_LAYOUTS.a
const results = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r
      return acc
    },
    {} as Record<SceneId, (typeof store.preview.scenarioResults)[number]>,
  ),
)

const outflows = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r.outflow
      return acc
    },
    {} as Record<SceneId, number>,
  ),
)

const anchor = (id: SceneId) => nodes.find((n) => n.id === id)!

/** 固定三条水路：school→park，market→residential，两路→station */
const flowPaths = computed(() => {
  const s = anchor('school')
  const m = anchor('market')
  const p = anchor('park')
  const r = anchor('residential')
  const st = anchor('station')
  const w = (id: SceneId) => 0.55 + Math.min(100, outflows.value[id]) / 46
  return [
    { key: 's-p', d: `M${s.x} ${s.y} Q ${(s.x + p.x) / 2} ${s.y - 5} ${p.x} ${p.y}`, w: w('school') },
    { key: 'm-r', d: `M${m.x} ${m.y} Q ${(m.x + r.x) / 2} ${m.y + 4} ${r.x} ${r.y}`, w: w('market') },
    { key: 'p-st', d: `M${p.x} ${p.y} Q ${p.x + 4} ${(p.y + st.y) / 2} ${st.x} ${st.y - 2}`, w: w('park') },
    { key: 'r-st', d: `M${r.x} ${r.y} Q ${r.x + 2} ${(r.y + st.y) / 2} ${st.x} ${st.y - 2}`, w: w('residential') },
  ]
})

const rainLabel = computed(() => (store.rainType === 'continuous' ? '持续型降雨' : '短时强降雨'))
</script>

<template>
  <section class="stage" aria-label="城市全景视图">
    <img class="bg" src="assets/scenes/city-overview.svg" alt="雨夜城市等距全景" draggable="false" />
    <div class="vignette" />
    <div class="rain" :class="{ 'is-off': !store.rainLayerOn, 'is-heavy': store.rainType === 'burst' }" />

    <svg class="flows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        v-for="p in flowPaths"
        :key="p.key"
        :d="p.d"
        fill="none"
        stroke="var(--cyan)"
        :stroke-width="p.w"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
        class="flow"
        opacity="0.55"
      />
    </svg>

    <SceneNodeA
      v-for="n in nodes"
      :key="n.id"
      :id="n.id"
      :result="results[n.id]"
      :side="n.label"
      :selected="store.selectedScene === n.id"
      :hovered="store.hoveredScene === n.id"
      :style="{ left: `${n.x}%`, top: `${n.y}%` }"
      @select="store.selectScene"
      @hover="store.setHover"
    />

    <div class="hud hud--tl">
      <CloudRain :size="13" :stroke-width="1.8" />
      <span>{{ rainLabel }}</span>
      <span class="sep" />
      <span class="mono">规则 {{ store.preview.rulesVersion }}</span>
    </div>

    <div class="hud hud--tr">
      <button type="button" class="layer-toggle" :class="{ 'is-on': store.rainLayerOn }" @click="store.rainLayerOn = !store.rainLayerOn">
        <Waves :size="13" :stroke-width="1.8" />
        雨层
      </button>
    </div>

    <div class="hud hud--bl">
      <span class="river-dot" />
      河网自西北向东南汇入车站低洼段
    </div>
  </section>
</template>

<style scoped>
.stage {
  position: relative;
  overflow: hidden;
  border-radius: var(--r-lg);
  border: 1px solid var(--border-soft);
  background: var(--bg);
  isolation: isolate;
}

.bg {
  position: absolute;
  inset: -2%;
  width: 104%;
  height: 104%;
  object-fit: cover;
  object-position: 50% 52%;
  filter: saturate(1.02) contrast(1.04);
}

.vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 80% at 50% 42%, transparent 38%, rgba(4, 12, 20, 0.72) 100%),
    linear-gradient(180deg, rgba(4, 12, 20, 0.55) 0%, transparent 22%, transparent 74%, rgba(4, 12, 20, 0.6) 100%);
  pointer-events: none;
}

/* 雨层：两段错位的斜线，只做位移循环，不产生粒子开销 */
.rain {
  position: absolute;
  inset: -30% -10%;
  background-image: repeating-linear-gradient(
    14deg,
    transparent 0 22px,
    rgba(159, 216, 245, 0.07) 22px 23px,
    transparent 23px 46px
  );
  animation: drift 2.6s linear infinite;
  pointer-events: none;
  opacity: 1;
  transition: opacity var(--dur-3) var(--ease);
}

.rain.is-heavy {
  opacity: 0.9;
  animation-duration: 1.5s;
  background-image: repeating-linear-gradient(
    12deg,
    transparent 0 14px,
    rgba(207, 233, 248, 0.1) 14px 15px,
    transparent 15px 30px
  );
}

.rain.is-off {
  opacity: 0;
}

@keyframes drift {
  from {
    transform: translate3d(0, -40px, 0);
  }
  to {
    transform: translate3d(-14px, 0, 0);
  }
}

.flows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.flow {
  stroke-dasharray: 5 7;
  animation: dash 3.4s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -24;
  }
}

.hud {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  border-radius: var(--r-sm);
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  border: 1px solid var(--border-soft);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  letter-spacing: 0.04em;
  backdrop-filter: blur(2px);
}

.hud--tl {
  top: 10px;
  left: 10px;
}

.hud--tr {
  top: 10px;
  right: 10px;
}

.hud--bl {
  left: 10px;
  bottom: 10px;
}

.sep {
  width: 1px;
  height: 9px;
  background: var(--border);
}

.river-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 8px 1px color-mix(in srgb, var(--teal) 60%, transparent);
}

.layer-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-dim);
  font-size: var(--fs-micro);
  transition: color var(--dur-1) var(--ease);
}

.layer-toggle.is-on {
  color: var(--cyan);
}
</style>
