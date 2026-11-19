<script setup lang="ts">
import { Check, CloudLightning, CloudRain } from 'lucide-vue-next'
import { assetUrl } from '@/composables/useSceneVisuals'
import { useScenarioStore } from '@/stores/scenario'
import type { RainType } from '@/types'

const scenario = useScenarioStore()

const iconFor = (id: RainType) => (id === 'burst' ? CloudLightning : CloudRain)
const select = (id: RainType) => scenario.setRainType(id)
</script>

<template>
  <section class="panel">
    <header class="panel-head">
      <span class="ico-chip"><CloudRain :size="13" /></span>
      <span class="panel-label">降雨情境选择</span>
      <span class="panel-meta">同一引擎 · 参数切换</span>
    </header>

    <div class="panel-body rain-body">
      <button
        v-for="rain in scenario.rainTypes"
        :key="rain.id"
        type="button"
        class="rain-card"
        :class="{ 'is-active': scenario.rainType === rain.id }"
        @click="select(rain.id)"
      >
        <span class="rain-thumb">
          <img :src="assetUrl(rain.asset)" :alt="rain.name" loading="lazy" />
        </span>

        <span class="rain-content">
          <span class="rain-title">
            <component :is="iconFor(rain.id)" :size="13" />
            <strong>{{ rain.name }}</strong>
            <em>{{ rain.nameEn }}</em>
          </span>
          <span class="rain-summary">{{ rain.summary }}</span>
          <span class="rain-tags">
            <span v-for="item in rain.challenge" :key="item" class="tag">{{ item }}</span>
          </span>
          <span class="rain-weights">
            <span class="weight-label num">总量 {{ Math.round(rain.weights.volume * 100) }}%</span>
            <span class="weight-track">
              <i :style="{ width: `${rain.weights.volume * 100}%` }" />
            </span>
            <span class="weight-label num">峰值 {{ Math.round(rain.weights.peak * 100) }}%</span>
          </span>
        </span>

        <span v-if="scenario.rainType === rain.id" class="rain-check">
          <Check :size="11" />
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.rain-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  overflow: visible;
}

.rain-card {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 9px;
  text-align: left;
  background: color-mix(in srgb, var(--surface-elevated) 46%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  transition:
    border-color var(--dur-1) var(--ease),
    background var(--dur-1) var(--ease),
    transform var(--dur-1) var(--ease);
}

.rain-card:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--surface-elevated) 74%, transparent);
  border-color: var(--border);
}

.rain-card.is-active {
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--cyan) 13%, transparent),
    color-mix(in srgb, var(--surface-elevated) 60%, transparent)
  );
  border-color: var(--cyan-line);
  box-shadow: var(--glow-cyan);
}

.rain-thumb {
  flex: none;
  width: 68px;
  height: 62px;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-sm);
}

.rain-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.92;
}

.rain-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.rain-title {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text);
}

.rain-title strong {
  font-size: var(--fs-sm);
  letter-spacing: 0.02em;
}

.rain-title em {
  font-family: var(--font-num);
  font-size: var(--fs-micro);
  font-style: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.rain-card.is-active .rain-title {
  color: var(--cyan);
}

.rain-summary {
  font-size: var(--fs-micro);
  line-height: 1.4;
  color: var(--text-muted);
}

.rain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rain-weights {
  display: flex;
  align-items: center;
  gap: 6px;
}

.weight-label {
  font-size: var(--fs-micro);
  color: var(--text-dim);
  white-space: nowrap;
}

.weight-track {
  position: relative;
  flex: 1;
  height: 3px;
  overflow: hidden;
  background: color-mix(in srgb, var(--risk) 34%, transparent);
  border-radius: var(--r-pill);
}

.weight-track i {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--cyan);
  border-radius: inherit;
}

.rain-check {
  position: absolute;
  top: -1px;
  right: -1px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  color: var(--bg);
  background: var(--cyan);
  border-radius: 0 var(--r-md) 0 var(--r-md);
}
</style>
