<script setup lang="ts">
import { computed } from 'vue'
import { Check, CloudRain, Network } from 'lucide-vue-next'
import { RAIN_TYPES } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import FlowGraph from '@/components/shared/FlowGraph.vue'
import type { RainType, SceneId } from '@/types'

/** A 版左栏：雨型双卡（缩略图 + 考验点 + 选中态）+ 固定水流关系小图 */
const store = useGameStore()

const cards = computed(() => RAIN_TYPES)

const outflows = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r.outflow
      return acc
    },
    {} as Record<SceneId, number>,
  ),
)

function pick(id: RainType) {
  store.setRain(id)
}
</script>

<template>
  <div class="rail rail--left">
    <section class="panel panel--rain">
      <header class="panel-head">
        <CloudRain :size="14" :stroke-width="1.9" />
        <h2>降雨情境选择</h2>
        <span class="hint mono">2 种</span>
      </header>

      <button
        v-for="rain in cards"
        :key="rain.id"
        type="button"
        class="rain-card"
        :class="{ 'is-active': store.rainType === rain.id }"
        @click="pick(rain.id)"
      >
        <img class="rain-img" :src="rain.asset" :alt="`${rain.name}情境示意`" draggable="false" />
        <span class="rain-body">
          <span class="rain-title">
            {{ rain.name }}
            <span class="rain-en mono">{{ rain.nameEn }}</span>
          </span>
          <span class="rain-sum">{{ rain.summary }}</span>
          <span class="challenges">
            <span v-for="c in rain.challenge.slice(0, 3)" :key="c" class="challenge">{{ c }}</span>
          </span>
        </span>
        <span v-if="store.rainType === rain.id" class="rain-check"><Check :size="11" :stroke-width="3" /></span>
      </button>
    </section>

    <section class="panel panel--flow">
      <header class="panel-head">
        <Network :size="14" :stroke-width="1.9" />
        <h2>城市水流关系</h2>
        <span class="hint">固定</span>
      </header>
      <div class="flow-body">
        <FlowGraph :active-id="store.selectedScene" :outflows="outflows" @select="store.selectScene" />
      </div>
      <footer class="flow-foot">
        两路上游汇入<span class="sink">车站</span>，车站是最终排水压力承受点
      </footer>
    </section>
  </div>
</template>

<style scoped>
.rail--left {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
  min-height: 0;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel--rain {
  padding: 10px;
  gap: 8px;
}

.panel--flow {
  padding: 10px 10px 8px;
  gap: 6px;
  min-height: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--cyan);
}

.panel-head h2 {
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text);
}

.hint {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.rain-card {
  position: relative;
  display: grid;
  grid-template-columns: 62px 1fr;
  gap: 9px;
  padding: 7px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: var(--surface-1);
  text-align: left;
  transition: border-color var(--dur-1) var(--ease), background var(--dur-1) var(--ease),
    transform var(--dur-1) var(--ease);
}

.rain-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.rain-card.is-active {
  border-color: color-mix(in srgb, var(--cyan) 72%, var(--border));
  background: linear-gradient(180deg, var(--cyan-soft), transparent 62%), var(--surface-1);
  box-shadow: var(--glow-cyan);
}

.rain-img {
  width: 62px;
  height: 62px;
  object-fit: cover;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
}

.rain-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.rain-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
}

.rain-en {
  font-size: 8px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
}

.rain-sum {
  font-size: var(--fs-micro);
  color: var(--text-muted);
  line-height: 1.45;
}

.challenges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 1px;
}

.challenge {
  font-size: 9px;
  line-height: 13px;
  padding: 0 4px;
  border-radius: 3px;
  color: var(--teal);
  background: color-mix(in srgb, var(--teal) 14%, transparent);
}

.rain-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--cyan);
  color: #04111d;
}

.flow-body {
  flex: 1;
  min-height: 140px;
  border-radius: var(--r-sm);
  background: radial-gradient(120% 90% at 50% 0%, rgba(56, 189, 248, 0.06), transparent 70%), var(--surface-1);
  border: 1px solid var(--border-soft);
  padding: 4px;
}

.flow-foot {
  font-size: var(--fs-micro);
  color: var(--text-dim);
  line-height: 1.5;
  padding: 0 2px 2px;
}

.sink {
  color: var(--risk);
  font-weight: 600;
}
</style>
