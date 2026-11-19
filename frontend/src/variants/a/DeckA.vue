<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { Activity, CloudRain, Play, Sparkles, TriangleAlert } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'
import ARainRail from './ARainRail.vue'
import ACityStage from './ACityStage.vue'
import AAllocator from './AAllocator.vue'
import AImpactDock from './AImpactDock.vue'

/**
 * A 版外壳 · 雨夜指挥台（三栏 HUD）
 * 栅格：顶栏 58 / 左 306 / 中自适应 / 右 358 / 底 196
 * 1366 宽下中央舞台仍有 700px 以上，不会被三栏挤废。
 */
const store = useGameStore()
const showPreview = ref(false)
const activeNav = ref('plan')

const preview = computed(() => store.preview)
const rainLabel = computed(() => (store.rainType === 'continuous' ? '持续型降雨' : '短时强降雨'))
const blockReason = computed(() => store.validationMessage ?? '')
</script>

<template>
  <div class="deck">
    <header class="topbar">
      <BrandMark />
      <TopNav :active="activeNav" @select="activeNav = $event" />
      <div class="status">
        <span class="source-chip">
          <CloudRain :size="11" :stroke-width="2" />
          本地预览引擎
        </span>
        <span class="sep" />
        <span class="mono">{{ rainLabel }} · {{ store.preview.rulesVersion }}</span>
        <span class="sep" />
        <span>科学规划 · 从容应对每一场暴雨</span>
      </div>
    </header>

    <aside class="cell cell--left"><ARainRail /></aside>
    <main class="cell cell--stage"><ACityStage /></main>

    <aside class="cell cell--right">
      <AAllocator />
      <div class="cta-wrap">
        <button type="button" class="cta" :disabled="!store.canSimulate" @click="showPreview = true">
          <Play :size="18" :stroke-width="2.2" />
          <span>开始推演</span>
        </button>
        <p class="cta-sub">
          <template v-if="store.canSimulate">
            <Activity :size="11" :stroke-width="2" />
            预期韧性 <b class="num">{{ preview.overallScore }}</b> · {{ preview.grade }} 级
          </template>
          <template v-else>
            <TriangleAlert :size="11" :stroke-width="2" />
            {{ blockReason }}
          </template>
        </p>
      </div>
    </aside>

    <section class="cell cell--dock"><AImpactDock /></section>

    <NModal v-model:show="showPreview" preset="card" title="预演摘要" class="rc-modal" :style="{ width: '440px' }">
      <div class="summary">
        <div class="score-hero">
          <span class="score num">{{ preview.overallScore }}</span>
          <span class="score-meta">
            <b>{{ preview.grade }} 级 · {{ preview.gradeLabel }}</b>
            <em>{{ preview.strategyType }} · {{ rainLabel }}</em>
          </span>
        </div>
        <ul class="chips">
          <li v-for="s in preview.triggeredSynergies" :key="s.id" class="chip">
            <Sparkles :size="11" :stroke-width="2" />{{ s.name }} +{{ s.gain }}
          </li>
          <li v-if="!preview.triggeredSynergies.length" class="chip chip--muted">未触发联动</li>
        </ul>
        <ul class="events">
          <li v-for="e in preview.events.slice(0, 4)" :key="e.index" :class="`tone-${e.tone}`">
            <span class="mono step">{{ e.step }}</span>{{ e.text }}
          </li>
        </ul>
        <p class="disclaim">
          以上为确定性规则引擎的预演结果；完整结算页（分项明细 / 因果解释 / 优化建议）在下一阶段接入。
        </p>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.deck {
  display: grid;
  height: 100vh;
  padding: 10px;
  gap: 10px;
  grid-template-columns: 306px minmax(0, 1fr) 358px;
  grid-template-rows: 58px minmax(0, 1fr) 196px;
  grid-template-areas:
    'top top top'
    'left stage right'
    'left dock right';
  background:
    radial-gradient(90% 60% at 50% 0%, rgba(56, 189, 248, 0.08), transparent 60%),
    linear-gradient(180deg, #081724, var(--bg) 42%);
}

.topbar {
  grid-area: top;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line-hair);
}

.status {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-micro);
  letter-spacing: 0.06em;
  color: var(--text-muted);
  white-space: nowrap;
}

.sep {
  width: 1px;
  height: 10px;
  background: var(--border);
}

.cell {
  min-width: 0;
  min-height: 0;
}

.cell--left {
  grid-area: left;
}

.cell--stage {
  grid-area: stage;
  display: flex;
}

.cell--stage > :deep(section) {
  flex: 1;
}

.cell--right {
  grid-area: right;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
}

.cell--dock {
  grid-area: dock;
  min-height: 0;
}

.cta-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  height: 52px;
  border-radius: var(--r-md);
  color: #1a1204;
  font-size: var(--fs-md);
  font-weight: 700;
  letter-spacing: 0.16em;
  background: linear-gradient(180deg, #f8c565, var(--amber) 58%, #d99a2c);
  box-shadow: var(--glow-amber);
  transition: transform var(--dur-1) var(--ease), box-shadow var(--dur-2) var(--ease);
}

.cta:hover:not(:disabled) {
  transform: translateY(-1px);
}

.cta:disabled {
  background: color-mix(in srgb, var(--surface-elevated) 88%, var(--bg));
  color: var(--text-dim);
  box-shadow: inset 0 0 0 1px var(--border-soft);
  cursor: not-allowed;
}

.cta-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.cta-sub b {
  color: var(--amber);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-hero {
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

.score-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--fs-xs);
}

.score-meta em {
  font-style: normal;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  font-size: var(--fs-micro);
  color: var(--teal);
  background: color-mix(in srgb, var(--teal) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent);
  border-radius: var(--r-pill);
}

.chip--muted {
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
  gap: 7px;
  line-height: 1.5;
}

.step {
  flex: none;
  width: 14px;
  color: var(--text-dim);
  font-size: var(--fs-micro);
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

.disclaim {
  padding-top: 8px;
  border-top: 1px dashed var(--line-hair);
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-dim);
}
</style>

<style>
.rc-modal.n-card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow-lift) !important;
}

.rc-modal .n-card-header__main {
  color: var(--text) !important;
  font-size: var(--fs-sm) !important;
  letter-spacing: 0.08em;
}

.rc-modal .n-card__content {
  color: var(--text) !important;
}
</style>
