<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { Activity, Play, Sparkles, TriangleAlert } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'
import RainPanelA from './RainPanelA.vue'
import CityStageA from './CityStageA.vue'
import AllocatorA from './AllocatorA.vue'
import ImpactDockA from './ImpactDockA.vue'

/**
 * A 版外壳 · 雨夜指挥台
 * 信息层级：顶栏(状态) → 左栏(情境/水路) → 中央(城市) → 右栏(分配) → 底部(预期)
 * 三栏在 1366 宽下中央舞台仍有 ≥700px，不会被挤到不可读。
 */
const store = useGameStore()
const showPreview = ref(false)
const activeNav = ref('plan')

const preview = computed(() => store.preview)
const blockReason = computed(() => store.incBlockReason('station') ?? '5 点已分完')

function openPreview() {
  if (!store.canSimulate) return
  showPreview.value = true
}
</script>

<template>
  <div class="deck">
    <header class="topbar">
      <BrandMark />
      <div class="nav-wrap">
        <TopNav :active="activeNav" @select="activeNav = $event" />
      </div>
      <div class="status">
        <span class="pulse" />
        科学规划 · 从容应对每一场暴雨
      </div>
    </header>

    <aside class="area area--left">
      <RainPanelA />
    </aside>

    <main class="area area--stage">
      <CityStageA />
    </main>

    <aside class="area area--right">
      <AllocatorA />
      <div class="cta-wrap">
        <button type="button" class="cta" :disabled="!store.canSimulate" @click="openPreview">
          <Play :size="18" :stroke-width="2.2" />
          <span class="cta-text">开始推演</span>
        </button>
        <p class="cta-sub">
          <template v-if="store.canSimulate">
            <Activity :size="11" :stroke-width="2" />
            预期韧性 <span class="num cta-score">{{ preview.overallScore }}</span> · {{ preview.grade }} 级
          </template>
          <template v-else>
            <TriangleAlert :size="11" :stroke-width="2" />
            {{ blockReason }}
          </template>
        </p>
      </div>
    </aside>

    <section class="area area--dock">
      <ImpactDockA />
    </section>

    <NModal
      v-model:show="showPreview"
      preset="card"
      title="预演摘要"
      class="preview-modal"
      :style="{ width: '440px' }"
      :bordered="true"
    >
      <div class="summary">
        <div class="score-hero">
          <span class="score num">{{ preview.overallScore }}</span>
          <span class="score-meta">
            <b>{{ preview.grade }} 级 · {{ preview.gradeLabel }}</b>
            <em>{{ preview.strategyType }} · {{ preview.rainType === 'continuous' ? '持续型降雨' : '短时强降雨' }}</em>
          </span>
        </div>

        <ul class="chips">
          <li v-for="s in preview.triggeredSynergies" :key="s.id" class="chip">
            <Sparkles :size="11" :stroke-width="2" />
            {{ s.name }} +{{ s.gain }}
          </li>
          <li v-if="!preview.triggeredSynergies.length" class="chip chip--muted">未触发联动</li>
        </ul>

        <ul class="events">
          <li v-for="e in preview.events.slice(0, 4)" :key="e.index" :class="`tone-${e.tone}`">
            <span class="mono step">{{ e.step }}</span>
            {{ e.text }}
          </li>
        </ul>

        <p class="disclaim">
          以上为确定性规则引擎的预演结果，完整结算页（分项明细 / 因果解释 / 优化建议）在下一阶段接入。
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
  gap: 24px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line-hair);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 55%, transparent), transparent);
}

.nav-wrap {
  display: flex;
  align-items: center;
  height: 100%;
}

.status {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--fs-micro);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--safe);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--safe) 60%, transparent);
  animation: pulse 2.4s ease-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--safe) 55%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.area {
  min-width: 0;
  min-height: 0;
}

.area--left {
  grid-area: left;
}

.area--stage {
  grid-area: stage;
  display: flex;
}

.area--stage > :deep(section) {
  flex: 1;
}

.area--right {
  grid-area: right;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
}

.area--dock {
  grid-area: dock;
  min-height: 0;
}

.cta-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cta {
  position: relative;
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
  transition: transform var(--dur-1) var(--ease), box-shadow var(--dur-2) var(--ease),
    filter var(--dur-1) var(--ease);
}

.cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--amber) 65%, transparent), 0 18px 40px -14px var(--amber);
}

.cta:active:not(:disabled) {
  transform: translateY(0);
}

.cta:disabled {
  background: color-mix(in srgb, var(--surface-elevated) 88%, var(--bg));
  color: var(--text-dim);
  box-shadow: inset 0 0 0 1px var(--border-soft);
  cursor: not-allowed;
}

.cta-text {
  transform: translateY(0.5px);
}

.cta-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  letter-spacing: 0.04em;
}

.cta-sub .cta-score {
  color: var(--amber);
  font-weight: 700;
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
  font-size: 46px;
  font-weight: 700;
  line-height: 1;
  color: var(--amber);
}

.score-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--fs-xs);
  color: var(--text);
}

.score-meta em {
  font-style: normal;
  color: var(--text-muted);
  font-size: var(--fs-micro);
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
  border-radius: var(--r-pill);
  font-size: var(--fs-micro);
  color: var(--teal);
  background: color-mix(in srgb, var(--teal) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent);
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
  line-height: 1.5;
}

.events li {
  display: flex;
  gap: 7px;
}

.step {
  flex: none;
  width: 14px;
  color: var(--text-dim);
  font-size: var(--fs-micro);
  padding-top: 1px;
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
  font-size: var(--fs-micro);
  color: var(--text-dim);
  line-height: 1.6;
  padding-top: 8px;
  border-top: 1px dashed var(--line-hair);
}
</style>

<style>
/* Naive UI 弹层需要非 scoped 覆盖，才能盖住其默认浅色卡片 */
.preview-modal.n-card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow-lift) !important;
}

.preview-modal .n-card-header__main {
  color: var(--text) !important;
  font-size: var(--fs-sm) !important;
  letter-spacing: 0.08em;
}

.preview-modal .n-card__content {
  color: var(--text) !important;
}
</style>
