<script setup lang="ts">
import { computed } from 'vue'
import { Check, CloudRain, Network } from 'lucide-vue-next'
import { RAIN_TYPES } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import FlowGraph from '@/components/shared/FlowGraph.vue'
import type { RainType, SceneId } from '@/types'

/** A 版左栏：雨型双卡（缩略图 + 考验点 + 选中态）+ 固定水流关系小图 */
const store = useGameStore()

const outflows = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r.outflow
      return acc
    },
    {} as Record<SceneId, number>,
  ),
)

const pick = (id: RainType) => store.setRain(id)
</script>

<template>
  <div class="rail">
    <section class="panel">
      <header class="panel-head">
        <span class="ico-chip"><CloudRain :size="13" :stroke-width="1.9" /></span>
        <span class="panel-label">降雨情境选择</span>
        <span class="panel-meta mono">2 种 · 同一引擎</span>
      </header>
      <div class="body">
        <button
          v-for="rain in RAIN_TYPES"
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
              <i class="rain-en mono">{{ rain.nameEn }}</i>
            </span>
            <span class="rain-sum">{{ rain.summary }}</span>
            <span class="challenges">
              <i v-for="c in rain.challenge.slice(0, 3)" :key="c" class="tag">{{ c }}</i>
            </span>
          </span>
          <span v-if="store.rainType === rain.id" class="rain-check"><Check :size="11" :stroke-width="3" /></span>
        </button>
      </div>
    </section>

    <section class="panel panel--flow">
      <header class="panel-head">
        <span class="ico-chip"><Network :size="13" :stroke-width="1.9" /></span>
        <span class="panel-label">城市水流关系</span>
        <span class="panel-meta">固定 3 条</span>
      </header>
      <div class="flow-body">
        <FlowGraph :active-id="store.selectedScene" :outflows="outflows" @select="store.selectScene" />
      </div>
      <footer class="flow-foot">两路上游汇入<b>车站</b>，车站是最终排水压力承受点</footer>
    </section>
  </div>
</template>

<style scoped>
.rail {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 9px;
}

.rain-card {
  position: relative;
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 9px;
  padding: 7px;
  text-align: left;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: var(--surface-1);
  transition: border-color var(--dur-1) var(--ease), transform var(--dur-1) var(--ease);
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
  width: 60px;
  height: 60px;
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
}

.rain-en {
  font-style: normal;
  font-size: 8px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
}

.rain-sum {
  font-size: var(--fs-micro);
  line-height: 1.45;
  color: var(--text-muted);
}

.challenges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.challenges .tag {
  color: var(--teal);
  background: color-mix(in srgb, var(--teal) 12%, transparent);
  border-color: color-mix(in srgb, var(--teal) 26%, transparent);
}

.rain-check {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  color: #04111d;
  background: var(--cyan);
}

.panel--flow {
  min-height: 0;
}

.flow-body {
  flex: 1;
  min-height: 148px;
  margin: 0 9px;
  padding: 4px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: radial-gradient(120% 90% at 50% 0%, rgba(56, 189, 248, 0.07), transparent 70%), var(--surface-1);
}

.flow-foot {
  padding: 6px 10px 9px;
  font-size: var(--fs-micro);
  line-height: 1.5;
  color: var(--text-dim);
}

.flow-foot b {
  color: var(--risk);
}
</style>
