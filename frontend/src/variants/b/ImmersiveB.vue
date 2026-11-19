<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { Activity, Layers, Play, Sparkles, Waves } from 'lucide-vue-next'
import { SCENARIO_MAP } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'
import ScoreRing from '@/components/shared/ScoreRing.vue'
import ImpactChart from '@/components/shared/ImpactChart.vue'
import BStage from './BStage.vue'
import BAllocator from './BAllocator.vue'
import type { SceneId } from '@/types'

/**
 * B 版外壳 · 沉浸全景
 * 城市铺满视口，HUD 以悬浮卡片压在四个角与底边；不设三栏边框。
 */
const store = useGameStore()
const showPreview = ref(false)
const activeNav = ref('plan')
const preview = computed(() => store.preview)

const rings = computed(() =>
  store.preview.scenarioResults.map((r) => ({
    id: r.sceneId as SceneId,
    name: SCENARIO_MAP[r.sceneId].name,
    value: r.effective,
    accent: `var(${SCENARIO_MAP[r.sceneId].accentVar})`,
  })),
)
</script>

<template>
  <div class="immersive">
    <BStage />

    <header class="hud hud--top">
      <BrandMark size="sm" />
      <span class="spacer" />
      <TopNav :active="activeNav" density="icons" @select="activeNav = $event" />
      <span class="spacer" />
      <button type="button" class="chip" :class="{ 'is-on': store.rainLayerOn }" @click="store.rainLayerOn = !store.rainLayerOn">
        <Waves :size="12" :stroke-width="1.9" />
        雨层
      </button>
      <span class="chip chip--mono mono">{{ store.preview.rulesVersion }}</span>
    </header>

    <aside class="hud hud--right"><BAllocator /></aside>

    <footer class="hud hud--dock">
      <div class="rings">
        <ScoreRing v-for="r in rings" :key="r.id" :value="r.value" :label="r.name" :accent="r.accent" :size="46" />
      </div>
      <div class="chart">
        <span class="chart-title"><Layers :size="11" :stroke-width="2" />城市状态预测</span>
        <ImpactChart :points="store.preview.forecast" :height="86" :legend="false" compact />
      </div>
      <div class="cta-wrap">
        <button type="button" class="cta" :disabled="!store.canSimulate" @click="showPreview = true">
          <Play :size="17" :stroke-width="2.3" />开始推演
        </button>
        <p class="cta-sub">
          <template v-if="store.canSimulate">
            <Activity :size="11" :stroke-width="2" />预期韧性 <b class="num">{{ preview.overallScore }}</b> · {{ preview.grade }} 级
          </template>
          <template v-else>{{ store.validationMessage }}</template>
        </p>
      </div>
    </footer>

    <NModal v-model:show="showPreview" preset="card" title="预演摘要" class="rc-modal" :style="{ width: '420px' }">
      <div class="summary">
        <div class="score-row">
          <span class="score num">{{ preview.overallScore }}</span>
          <span class="meta">
            <b>{{ preview.grade }} 级 · {{ preview.gradeLabel }}</b>
            <em>{{ preview.strategyType }}</em>
          </span>
        </div>
        <ul class="chips">
          <li v-for="s in preview.triggeredSynergies" :key="s.id" class="chip-tag">
            <Sparkles :size="11" :stroke-width="2" />{{ s.name }} +{{ s.gain }}
          </li>
          <li v-if="!preview.triggeredSynergies.length" class="chip-tag chip-tag--muted">未触发联动</li>
        </ul>
        <ul class="events">
          <li v-for="e in preview.events.slice(0, 4)" :key="e.index" :class="`tone-${e.tone}`">
            <span class="mono">{{ e.step }}</span>{{ e.text }}
          </li>
        </ul>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.immersive {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.hud {
  position: absolute;
  z-index: 10;
}

.hud--top {
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, #06131f 82%, transparent);
}

.spacer {
  flex: 1;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  border-radius: var(--r-pill);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}

.chip.is-on {
  color: var(--cyan);
  border-color: color-mix(in srgb, var(--cyan) 48%, var(--border));
}

.chip--mono {
  color: var(--text-muted);
}

.hud--right {
  top: 84px;
  right: 12px;
}

.hud--dock {
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 232px;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, #06131f 88%, transparent);
  box-shadow: var(--shadow-lift);
}

.rings {
  display: flex;
  gap: 10px;
}

.chart {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chart-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  letter-spacing: 0.06em;
}

.cta-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border-radius: var(--r-md);
  color: #1a1204;
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.14em;
  background: linear-gradient(180deg, #f8c565, var(--amber) 58%, #d99a2c);
  box-shadow: var(--glow-amber);
}

.cta:disabled {
  color: var(--text-dim);
  background: color-mix(in srgb, var(--surface-elevated) 88%, var(--bg));
  box-shadow: inset 0 0 0 1px var(--border-soft);
  cursor: not-allowed;
}

.cta-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  text-align: center;
}

.cta-sub b {
  color: var(--amber);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-hair);
}

.score {
  font-size: var(--fs-hero);
  font-weight: 700;
  line-height: 1;
  color: var(--amber);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--fs-xs);
}

.meta em {
  font-style: normal;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  font-size: var(--fs-micro);
  color: var(--teal);
  border-radius: var(--r-pill);
  border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent);
  background: color-mix(in srgb, var(--teal) 12%, transparent);
}

.chip-tag--muted {
  color: var(--text-dim);
  background: transparent;
  border-color: var(--border-soft);
}

.events {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.events li {
  display: flex;
  gap: 6px;
  line-height: 1.5;
}

.events .mono {
  flex: none;
  width: 12px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.tone-good {
  color: var(--safe);
}

.tone-warn {
  color: var(--amber);
}

.tone-bad {
  color: var(--danger);
}
</style>

<style>
.rc-modal.n-card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
}

.rc-modal .n-card-header__main,
.rc-modal .n-card__content {
  color: var(--text) !important;
}
</style>
