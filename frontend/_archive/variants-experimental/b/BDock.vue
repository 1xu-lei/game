<script setup lang="ts">
import { computed } from 'vue'
import { Activity, BarChart3, Building2, Bus, GraduationCap, Play, Store, Trees, TriangleAlert, Waves } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { SCENARIO_MAP } from '@/config/sites'
import type { SceneId } from '@/types'
import ScoreRing from '@/components/shared/ScoreRing.vue'
import ImpactChart from '@/components/shared/ImpactChart.vue'

/**
 * B 版底部悬浮舱：五场景预期环 + 城市状态预测 + 主按钮。
 * 数值一律读 store.preview（预览引擎结果），组件内不做任何评分换算。
 */
const store = useGameStore()

const emit = defineEmits<{ (e: 'simulate'): void }>()

const ICONS = {
  school: GraduationCap,
  market: Store,
  park: Trees,
  residential: Building2,
  station: Bus,
} as const

const rings = computed(() =>
  store.preview.scenarioResults.map((r) => ({
    id: r.sceneId as SceneId,
    name: SCENARIO_MAP[r.sceneId].name,
    accent: `var(${SCENARIO_MAP[r.sceneId].accentVar})`,
    value: r.effective,
    sub: r.invested === 0 ? '无投入' : `${r.invested} 点`,
  })),
)
</script>

<template>
  <footer class="dock">
    <div class="block block--rings">
      <span class="block-head">
        <Waves :size="12" :stroke-width="1.9" />
        预期效果
      </span>
      <div class="rings">
        <ScoreRing
          v-for="ring in rings"
          :key="ring.id"
          :value="ring.value"
          :label="ring.name"
          :sub="ring.sub"
          :accent="ring.accent"
          :size="50"
        >
          <template #icon>
            <component :is="ICONS[ring.id]" :size="9" :stroke-width="2" />
          </template>
        </ScoreRing>
      </div>
    </div>

    <span class="divider" />

    <div class="block block--chart">
      <span class="block-head">
        <BarChart3 :size="12" :stroke-width="1.9" />
        城市状态预测
      </span>
      <ImpactChart :points="store.preview.forecast" :height="90" :legend="false" compact />
    </div>

    <span class="divider" />

    <div class="block block--cta">
      <button type="button" class="cta" :disabled="!store.canSimulate" @click="emit('simulate')">
        <Play :size="16" :stroke-width="2.2" />
        <span class="cta-text">开始推演</span>
      </button>
      <p class="cta-sub" :class="{ 'is-blocked': !store.canSimulate }">
        <template v-if="store.canSimulate">
          <Activity :size="11" :stroke-width="2" />
          预期韧性 <b class="num score">{{ store.preview.overallScore }}</b> · {{ store.preview.grade }} 级
        </template>
        <template v-else>
          <TriangleAlert :size="11" :stroke-width="2" />
          {{ store.validationMessage }}
        </template>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.dock {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 3;
  transform: translateX(-50%);
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-panel);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.block-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-micro);
  letter-spacing: 0.1em;
  color: var(--text-muted);
  white-space: nowrap;
}

.block-head :deep(svg) {
  color: var(--cyan);
}

.rings {
  display: grid;
  grid-template-columns: repeat(5, 52px);
  gap: 4px;
}

.block--chart {
  width: 250px;
}

.block--cta {
  justify-content: center;
  gap: 6px;
  width: 176px;
}

.divider {
  width: 1px;
  flex: none;
  background: var(--line-hair);
}

.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  border-radius: var(--r-md);
  color: #1a1204;
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.14em;
  background: linear-gradient(180deg, #f8c565, var(--amber) 58%, #d99a2c);
  box-shadow: var(--glow-amber);
  transition: transform var(--dur-1) var(--ease), box-shadow var(--dur-2) var(--ease);
}

.cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--amber) 65%, transparent),
    0 18px 40px -14px var(--amber);
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
  line-height: 1.4;
  color: var(--text-dim);
  text-align: center;
}

.cta-sub .score {
  color: var(--amber);
  font-weight: 700;
}

.cta-sub.is-blocked {
  color: var(--amber);
}
</style>
