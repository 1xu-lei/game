<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { Sparkles } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import BTopBar from './BTopBar.vue'
import BStage from './BStage.vue'
import BAllocator from './BAllocator.vue'
import BDock from './BDock.vue'

/**
 * B 版外壳 · 沉浸全景
 * 城市铺满视口，HUD 全部改为悬浮件：顶栏 / 右侧分配卡 / 底部推演舱。
 * 所有数值一律读 store.preview，本层不做任何评分计算。
 */
const store = useGameStore()
const showPreview = ref(false)
const activeNav = ref('plan')

const preview = computed(() => store.preview)

function openPreview() {
  if (!store.canSimulate) return
  showPreview.value = true
}
</script>

<template>
  <div class="immersive">
    <BStage />
    <BTopBar :active="activeNav" @nav="activeNav = $event" />
    <BAllocator />
    <BDock @simulate="openPreview" />

    <NModal
      v-model:show="showPreview"
      preset="card"
      title="预演摘要"
      class="b-preview-modal"
      :style="{ width: '460px' }"
      :bordered="true"
    >
      <div class="summary">
        <div class="hero">
          <span class="hero-score num">{{ preview.overallScore }}</span>
          <span class="hero-meta">
            <b>{{ preview.grade }} 级 · {{ preview.gradeLabel }}</b>
            <em>{{ preview.strategyType }} · {{ preview.rainType === 'continuous' ? '持续型降雨' : '短时强降雨' }}</em>
          </span>
          <span class="hero-ver mono">{{ preview.rulesVersion }}</span>
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
.immersive {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-hair);
}

.hero-score {
  font-size: var(--fs-hero);
  font-weight: 700;
  line-height: 1;
  color: var(--amber);
}

.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--fs-xs);
  color: var(--text);
}

.hero-meta em {
  font-style: normal;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.hero-ver {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
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
  line-height: 1.5;
  color: var(--text-muted);
}

.events li {
  display: flex;
  gap: 7px;
}

.step {
  flex: none;
  width: 14px;
  padding-top: 1px;
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

.disclaim {
  padding-top: 8px;
  border-top: 1px dashed var(--line-hair);
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-dim);
}
</style>

<style>
/* Naive UI 弹层需要非 scoped 覆盖，才能盖住其默认浅色卡片 */
.b-preview-modal.n-card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow-lift) !important;
}

.b-preview-modal .n-card-header__main {
  color: var(--text) !important;
  font-size: var(--fs-sm) !important;
  letter-spacing: 0.08em;
}

.b-preview-modal .n-card__content {
  color: var(--text) !important;
}
</style>
