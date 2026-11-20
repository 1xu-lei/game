<script setup lang="ts">
import { computed } from 'vue'
import { Building2, Bus, GraduationCap, Store, Trees } from 'lucide-vue-next'
import { SCENARIO_MAP } from '@/config/sites'
import { NODE_LAYOUTS } from '@/config/nodeLayout'
import { useGameStore } from '@/stores/game'
import LevelPips from '@/components/shared/LevelPips.vue'
import RainField from '@/components/shared/RainField.vue'
import type { SceneId } from '@/types'

/**
 * B 版城市舞台：城市铺满整个视口，节点直接长在城市上。
 * 与 A 版差异：更大节点、更弱边框、更强氛围；HUD 全部浮在上面。
 */
const store = useGameStore()
const nodes = NODE_LAYOUTS.b

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
const widthOf = (id: SceneId) => 0.6 + Math.min(100, byId.value[id].outflow) / 40

const flows = computed(() => {
  const s = anchor('school')
  const m = anchor('market')
  const p = anchor('park')
  const r = anchor('residential')
  const st = anchor('station')
  return [
    { k: 'sp', d: `M${s.x} ${s.y} Q ${(s.x + p.x) / 2} ${s.y - 7} ${p.x} ${p.y}`, w: widthOf('school') },
    { k: 'mr', d: `M${m.x} ${m.y} Q ${(m.x + r.x) / 2} ${m.y + 6} ${r.x} ${r.y}`, w: widthOf('market') },
    { k: 'ps', d: `M${p.x} ${p.y} Q ${p.x + 6} ${(p.y + st.y) / 2} ${st.x} ${st.y - 3}`, w: widthOf('park') },
    { k: 'rs', d: `M${r.x} ${r.y} Q ${r.x - 2} ${(r.y + st.y) / 2} ${st.x} ${st.y - 3}`, w: widthOf('residential') },
  ]
})
</script>

<template>
  <div class="stage">
    <img class="bg" src="/assets/scenes/city-overview.svg" alt="雨夜城市等距全景" draggable="false" />
    <div class="shade" />
    <RainField :mode="store.rainType" :intensity="store.rainIntensity" :active="store.rainLayerOn" />

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
        { 'is-selected': store.selectedScene === n.id, 'is-zero': byId[n.id].invested === 0 },
      ]"
      :style="{ left: `${n.x}%`, top: `${n.y}%`, '--accent': `var(${SCENARIO_MAP[n.id].accentVar})` }"
      :title="`${SCENARIO_MAP[n.id].name} · 点击查看场景详情`"
      @click="store.selectScene(n.id)"
      @mouseenter="store.setHover(n.id)"
      @mouseleave="store.setHover(null)"
    >
      <span class="disc">
        <component :is="ICONS[n.id]" :size="19" :stroke-width="1.7" />
        <span v-if="byId[n.id].invested > 0" class="count num">{{ byId[n.id].invested }}</span>
      </span>
      <span class="label">
        <span class="name">{{ SCENARIO_MAP[n.id].name }}</span>
        <span v-if="n.id === 'station'" class="sink">最终压力 · {{ store.preview.riskMetrics.stationPressure }}</span>
        <span v-else-if="byId[n.id].invested === 0" class="zero">无投入</span>
        <LevelPips :value="byId[n.id].invested" :accent="`var(${SCENARIO_MAP[n.id].accentVar})`" size="xs" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--bg);
}

.bg {
  position: absolute;
  inset: -4%;
  width: 108%;
  height: 108%;
  object-fit: cover;
  object-position: 50% 54%;
  transform: scale(1.02);
}

.shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 40%, transparent 30%, rgba(3, 10, 17, 0.86) 100%),
    linear-gradient(180deg, rgba(3, 10, 17, 0.82) 0%, rgba(3, 10, 17, 0.12) 26%, rgba(3, 10, 17, 0.2) 62%, rgba(3, 10, 17, 0.9) 100%);
}

.rain {
  position: absolute;
  inset: -30% -10%;
  pointer-events: none;
  opacity: 0.85;
  background-image: repeating-linear-gradient(
    14deg,
    transparent 0 24px,
    rgba(159, 216, 245, 0.07) 24px 25px,
    transparent 25px 50px
  );
  animation: drift 3s linear infinite;
  transition: opacity var(--dur-3) var(--ease);
}

.rain.is-heavy {
  animation-duration: 1.6s;
  background-image: repeating-linear-gradient(
    12deg,
    transparent 0 15px,
    rgba(207, 233, 248, 0.1) 15px 16px,
    transparent 16px 32px
  );
}

.rain.is-off {
  opacity: 0;
}

@keyframes drift {
  to {
    transform: translate3d(-18px, 46px, 0);
  }
}

.flows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.5;
}

.flow {
  stroke-dasharray: 2 3;
  animation: dash 4s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}

.node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.65));
  transition: transform var(--dur-2) var(--ease);
}

.node.side-left {
  flex-direction: row-reverse;
}

.node:hover {
  transform: translate(-50%, calc(-50% - 4px));
}

.disc {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--accent);
  background: radial-gradient(circle at 50% 26%, color-mix(in srgb, var(--accent) 30%, var(--surface-3)), var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 50%, var(--border));
  box-shadow: 0 0 0 5px color-mix(in srgb, #04101b 70%, transparent);
}

.count {
  position: absolute;
  right: -5px;
  bottom: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #04111d;
  font-size: 10px;
  font-weight: 700;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 10px 6px;
  white-space: nowrap;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, #06131f 88%, transparent);
}

.name {
  font-size: var(--fs-sm);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.zero {
  font-size: 9px;
  color: var(--text-dim);
}

.sink {
  font-size: 9px;
  color: var(--risk);
}

.is-zero .name {
  color: var(--text-muted);
}

.is-selected .disc {
  box-shadow: 0 0 0 5px color-mix(in srgb, #04101b 66%, transparent),
    0 0 0 6px color-mix(in srgb, var(--accent) 75%, transparent),
    0 0 28px -2px color-mix(in srgb, var(--accent) 65%, transparent);
}

.is-selected .label {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  background: color-mix(in srgb, var(--surface-elevated) 92%, transparent);
}
</style>
