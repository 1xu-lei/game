<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, Building2, Bus, GraduationCap, Store, Trees, Waves } from 'lucide-vue-next'
import { SCENARIO_MAP } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import ScoreRing from '@/components/shared/ScoreRing.vue'
import ImpactChart from '@/components/shared/ImpactChart.vue'
import type { SceneId } from '@/types'

/**
 * A 版底部舱：五个环形预期指标 + 城市状态预测双线。
 * 数值全部来自 store.preview（结果对象），组件内不做换算或插值。
 */
const store = useGameStore()

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
    value: r.effective,
    accent: `var(${SCENARIO_MAP[r.sceneId].accentVar})`,
    sub: r.invested === 0 ? '无投入' : `${r.invested} 点`,
  })),
)

const risk = computed(() => store.preview.riskMetrics)
</script>

<template>
  <div class="dock">
    <section class="panel">
      <header class="panel-head">
        <span class="ico-chip"><Waves :size="13" :stroke-width="1.9" /></span>
        <span class="panel-label">预期效果预览</span>
        <span class="panel-meta">简化指标 · 非工程预测</span>
      </header>
      <div class="rings">
        <ScoreRing
          v-for="r in rings"
          :key="r.id"
          :value="r.value"
          :label="r.name"
          :sub="r.sub"
          :accent="r.accent"
          :size="58"
        >
          <template #icon>
            <component :is="ICONS[r.id]" :size="11" :stroke-width="2" />
          </template>
        </ScoreRing>
      </div>
    </section>

    <section class="panel">
      <header class="panel-head">
        <span class="ico-chip"><BarChart3 :size="13" :stroke-width="1.9" /></span>
        <span class="panel-label">城市状态预测</span>
        <span class="panel-meta mono">
          积水 {{ risk.waterlogRisk }} · 损失 {{ risk.lossRisk }} · 车站压力 {{ risk.stationPressure }}
        </span>
      </header>
      <div class="chart">
        <ImpactChart :points="store.preview.forecast" :height="112" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.dock {
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.rings {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: start;
  gap: 4px;
  padding: 8px 6px 4px;
}

.chart {
  flex: 1;
  min-height: 0;
  padding: 0 8px 4px;
}
</style>
