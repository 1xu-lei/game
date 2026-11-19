<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Bus, CloudRain, GraduationCap, Store, Trees, Waves } from 'lucide-vue-next'
import { SCENARIO_MAP } from '@/config/sites'
import { NODE_LAYOUTS } from '@/config/nodeLayout'
import { useGameStore } from '@/stores/game'
import LevelPips from '@/components/shared/LevelPips.vue'
import type { SceneId } from '@/types'

/**
 * A 版中央舞台：等距城市底图 + 5 个 HTML 浮层节点 + 固定水路连线。
 * 命中测试交给 HTML（可访问性更好），Canvas/SVG 只负责氛围与连线。
 */
const store = useGameStore()
const nodes = NODE_LAYOUTS.a

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
const widthOf = (id: SceneId) => 0.5 + Math.min(100, byId.value[id].outflow) / 44

/** 固定水路：school→park，market→residential，两路→station（禁止增删） */
const flows = computed(() => {
  const s = anchor('school')
  const m = anchor('market')
  const p = anchor('park')
  const r = anchor('residential')
  const st = anchor('station')
  return [
    { k: 'sp', d: `M${s.x} ${s.y} Q ${(s.x + p.x) / 2} ${s.y - 6} ${p.x} ${p.y}`, w: widthOf('school') },
    { k: 'mr', d: `M${m.x} ${m.y} Q ${(m.x + r.x) / 2} ${m.y + 5} ${r.x} ${r.y}`, w: widthOf('market') },
    { k: 'ps', d: `M${p.x} ${p.y} Q ${p.x + 5} ${(p.y + st.y) / 2} ${st.x} ${st.y - 2}`, w: widthOf('park') },
    { k: 'rs', d: `M${r.x} ${r.y} Q ${r.x + 3} ${(r.y + st.y) / 2} ${st.x} ${st.y - 2}`, w: widthOf('residential') },
  ]
})

const rainLabel = computed(() => (store.rainType === 'continuous' ? '持续型降雨' : '短时强降雨'))
</script>

<template>
  <section class="stage" aria-label="城市全景视图">
    <img class="bg" src="/assets/scenes/city-overview.svg" alt="雨夜城市等距全景" draggable="false" />
    <div class="vignette" />
    <div class="rain" :class="{ 'is-off': !store.rainLayerOn, 'is-heavy': store.rainType === 'burst' }" />

    <svg class="flows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        v-for="f in flows"
        :key="f.k"
        :d="f.d"
        fill="none"
        stroke="var(--cyan)"
        :stroke-width="f.w"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
        pathLength="100"
        class="flow"
      />
    </svg>

    <button
      v-for="n in nodes"
      :key="n.id"
      type="button"
      class="node"
      :class="[
        `side-${n.label}`,
        {
          'is-selected': store.selectedScene === n.id,
          'is-hovered': store.hoveredScene === n.id,
          'is-zero': byId[n.id].invested === 0,
        },
      ]"
      :style="{ left: `${n.x}%`, top: `${n.y}%`, '--accent': `var(${SCENARIO_MAP[n.id].accentVar})` }"
      @click="store.selectScene(n.id)"
      @mouseenter="store.setHover(n.id)"
      @mouseleave="store.setHover(null)"
    >
      <span class="dot">
        <component :is="ICONS[n.id]" :size="16" :stroke-width="1.8" />
        <span v-if="byId[n.id].invested > 0" class="count num">{{ byId[n.id].invested }}</span>
      </span>
      <span class="plate">
        <span class="row">
          <span class="name">{{ SCENARIO_MAP[n.id].name }}</span>
          <span v-if="n.id === 'station'" class="badge badge--sink">最终压力</span>
          <span v-else-if="byId[n.id].invested === 0" class="badge">无投入</span>
        </span>
        <span class="row">
          <LevelPips :value="byId[n.id].invested" :accent="`var(${SCENARIO_MAP[n.id].accentVar})`" size="xs" />
          <span class="score num">{{ byId[n.id].effective }}</span>
        </span>
      </span>
    </button>

    <div class="hud hud--tl">
      <CloudRain :size="12" :stroke-width="1.9" />
      {{ rainLabel }}
      <span class="sep" />
      <span class="mono">{{ store.preview.rulesVersion }}</span>
    </div>

    <button
      type="button"
      class="hud hud--tr"
      :class="{ 'is-on': store.rainLayerOn }"
      @click="store.rainLayerOn = !store.rainLayerOn"
    >
      <Waves :size="12" :stroke-width="1.9" />
      雨层 {{ store.rainLayerOn ? '开' : '关' }}
    </button>

    <div class="hud hud--bl">
      <i class="dot-river" />
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
}

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 80% at 50% 42%, transparent 38%, rgba(4, 12, 20, 0.74) 100%),
    linear-gradient(180deg, rgba(4, 12, 20, 0.55) 0%, transparent 20%, transparent 76%, rgba(4, 12, 20, 0.6) 100%);
}

.rain {
  position: absolute;
  inset: -30% -10%;
  pointer-events: none;
  opacity: 0.9;
  background-image: repeating-linear-gradient(
    14deg,
    transparent 0 22px,
    rgba(159, 216, 245, 0.075) 22px 23px,
    transparent 23px 46px
  );
  animation: drift 2.8s linear infinite;
  transition: opacity var(--dur-3) var(--ease);
}

.rain.is-heavy {
  animation-duration: 1.5s;
  background-image: repeating-linear-gradient(
    12deg,
    transparent 0 14px,
    rgba(207, 233, 248, 0.11) 14px 15px,
    transparent 15px 30px
  );
}

.rain.is-off {
  opacity: 0;
}

@keyframes drift {
  to {
    transform: translate3d(-16px, 42px, 0);
  }
}

.flows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.55;
}

.flow {
  stroke-dasharray: 2.4 3.2;
  animation: dash 3.6s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -22;
  }
}

.node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6));
  transition: transform var(--dur-2) var(--ease), filter var(--dur-2) var(--ease);
}

.node.side-left {
  flex-direction: row-reverse;
}

.node:hover,
.node.is-hovered {
  transform: translate(-50%, calc(-50% - 3px));
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
  background: radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--accent) 26%, var(--surface-3)), var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 44%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--bg) 64%, transparent);
}

.count {
  position: absolute;
  right: -4px;
  bottom: -4px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #04111d;
  font-size: 9px;
  font-weight: 700;
}

.plate {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 9px 6px;
  white-space: nowrap;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface) 90%, transparent);
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name {
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.badge {
  padding: 0 4px;
  font-size: 9px;
  line-height: 14px;
  border-radius: 3px;
  color: var(--text-dim);
  background: color-mix(in srgb, var(--border) 42%, transparent);
}

.badge--sink {
  color: var(--risk);
  background: var(--risk-soft);
}

.score {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.is-zero .name {
  color: var(--text-muted);
}

.is-selected .dot {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--bg) 56%, transparent),
    0 0 0 5px color-mix(in srgb, var(--accent) 72%, transparent),
    0 0 24px -2px color-mix(in srgb, var(--accent) 62%, transparent);
}

.is-selected .plate {
  border-color: color-mix(in srgb, var(--accent) 56%, var(--border));
  background: color-mix(in srgb, var(--surface-elevated) 92%, transparent);
}

.hud {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  font-size: var(--fs-micro);
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--bg) 76%, transparent);
}

.hud--tl {
  top: 10px;
  left: 10px;
}

.hud--tr {
  top: 10px;
  right: 10px;
  color: var(--text-dim);
}

.hud--tr.is-on {
  color: var(--cyan);
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

.dot-river {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 8px 1px color-mix(in srgb, var(--teal) 60%, transparent);
}
</style>
