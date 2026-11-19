<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, Building2, Bus, GraduationCap, Store, Trees, Waves } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { SCENARIO_MAP } from '@/config/sites'
import type { SceneId } from '@/types'
import ScoreRing from '@/components/shared/ScoreRing.vue'
import ImpactChart from '@/components/shared/ImpactChart.vue'

/**
 * A 版底部舱：五个环形预期指标 + 城市状态预测双线。
 * 所有数值来自 store.preview（预览引擎结果对象），组件内不做任何换算或插值。
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
    label: SCENARIO_MAP[r.sceneId].direction,
    accent: `var(${SCENARIO_MAP[r.sceneId].accentVar})`,
    sub: r.invested === 0 ? '无投入' : `${r.invested} 点`,
  })),
)

const risk = computed(() => store.preview.riskMetrics)
</script>

<template>
  <section class="dock">
    <div class="block block--rings">
      <header class="block-head">
        <Waves :size="13" :stroke-width="1.9" />
        <h2>预期效果预览</h2>
        <span class="note">简化指标 · 非工程预测</span>
      </header>
      <div class="rings">
        <ScoreRing
          v-for="ring in rings"
          :key="ring.id"
          :value="ring.value"
          :label="ring.name"
          :sub="ring.sub"
          :accent="ring.accent"
          :size="58"
        >
          <template #icon>
            <component :is="ICONS[ring.id]" :size="11" :stroke-width="2" />
          </template>
        </ScoreRing>
      </div>
    </div>

    <div class="block block--chart">
      <header class="block-head">
        <BarChart3 :size="13" :stroke-width="1.9" />
        <h2>城市状态预测</h2>
        <span class="note mono">
          积水风险 {{ risk.waterlogRisk }} · 损失概率 {{ risk.lossRisk }} · 车站压力 {{ risk.stationPressure }}
        </span>
      </header>
      <ImpactChart :points="store.preview.forecast" :height="112" />
    </div>
  </section>
</template>

<style scoped>
.dock {
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.block {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 9px 11px 6px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-panel);
}

.block-head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--cyan);
  padding-bottom: 6px;
}

.block-head h2 {
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text);
}

.note {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rings {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: start;
  gap: 4px;
  padding: 2px 0 4px;
}

.block--chart {
  padding-bottom: 4px;
}
</style>
