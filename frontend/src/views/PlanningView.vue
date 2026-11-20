<script setup lang="ts">
import { computed } from 'vue'
import { CloudRain, Play } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import GameShell from '@/components/GameShell.vue'
import RainScenarioSelector from '@/components/RainScenarioSelector.vue'
import ScenarioRelationshipGraph from '@/components/ScenarioRelationshipGraph.vue'
import CityOverviewMap from '@/components/CityOverviewMap.vue'
import SceneCard from '@/components/SceneCard.vue'
import ResourceAllocator from '@/components/ResourceAllocator.vue'
import ExpectedImpactPanel from '@/components/ExpectedImpactPanel.vue'
import { useAllocationStore } from '@/stores/allocation'
import { useScenarioStore } from '@/stores/scenario'
import { useSimulationStore } from '@/stores/simulation'
import { runPreview } from '@/engine/previewEngine'
import type { SceneId } from '@/types'

const allocation = useAllocationStore()
const scenario = useScenarioStore()
const sim = useSimulationStore()

/** 预期影响预览：与后端同口径的规则引擎输出（本页不重算任何规则） */
const preview = computed(() => runPreview(allocation.allocation, scenario.rainType))

/** 详情浮层的当前场景结果：来自预览引擎，不额外计算 */
const detailResult = computed(() =>
  scenario.selectedScene
    ? (preview.value.scenarioResults.find((item) => item.sceneId === scenario.selectedScene) ?? null)
    : null,
)

const statusText = computed(() =>
  allocation.isValid ? '配置已就绪 · 可开始推演' : `还需分配 ${allocation.remaining} 点建设资源`,
)

const runHint = computed(() => {
  if (allocation.isValid) return null
  return allocation.validationMessage ?? '请先把 5 点资源分配完'
})

function selectScene(id: SceneId): void {
  scenario.selectScene(scenario.selectedScene === id ? null : id)
}

function start(): void {
  void sim.run()
}
</script>

<template>
  <GameShell active="plan" :status-text="statusText">
    <template #left>
      <RainScenarioSelector />
      <ScenarioRelationshipGraph
        :allocation="allocation.allocation"
        :selected="scenario.selectedScene"
        @select="selectScene"
      />
    </template>

    <div class="stage-wrap">
      <CityOverviewMap
        :allocation="allocation.allocation"
        :selected="scenario.selectedScene"
        @select="selectScene"
      />

      <aside v-if="scenario.selectedConfig" class="detail-float">
        <button type="button" class="detail-close" @click="scenario.selectScene(null)">收起</button>
        <SceneCard
          :scene="scenario.selectedConfig"
          :level="allocation.allocation[scenario.selectedConfig.id]"
          :result="detailResult"
          variant="detail"
          @open="scenario.selectScene(null)"
        />
      </aside>
    </div>

    <template #right>
      <ResourceAllocator />
    </template>

    <template #bottom>
      <ExpectedImpactPanel :result="preview" />

      <div class="run-col">
        <span class="run-hint">{{ runHint ?? '推演数值来自当前配置，跳过动画不影响结果' }}</span>
        <NButton
          class="rc-btn run-btn"
          type="warning"
          size="large"
          :disabled="!allocation.isValid || sim.loading"
          :loading="sim.loading"
          @click="start"
        >
          <template #icon><Play :size="15" /></template>
          开始推演
        </NButton>
        <span class="run-meta">
          <CloudRain :size="11" />
          {{ scenario.currentRain.name }}
        </span>
      </div>
    </template>
  </GameShell>
</template>

<style scoped>
.stage-wrap {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
}

.detail-float {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 292px;
  max-height: calc(100% - 20px);
  overflow: auto;
  background: color-mix(in srgb, var(--surface) 96%, var(--bg));
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lift);
}

.detail-close {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 2;
  padding: 2px 7px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-pill);
}

.run-col {
  display: flex;
  flex: none;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  width: 196px;
  padding-left: 10px;
  border-left: 1px solid var(--line-hair);
}

.run-hint {
  font-size: var(--fs-micro);
  line-height: 1.4;
  color: var(--text-dim);
}

.run-btn {
  width: 100%;
  --n-color: var(--amber);
  --n-color-hover: color-mix(in srgb, var(--amber) 88%, white);
  --n-color-pressed: color-mix(in srgb, var(--amber) 82%, black);
  --n-text-color: #101c11;
  --n-text-color-hover: #101c11;
  --n-text-color-pressed: #101c11;
  --n-text-color-disabled: var(--text-dim);
  --n-color-disabled: color-mix(in srgb, var(--surface-elevated) 70%, transparent);
  box-shadow: var(--glow-amber);
}

.run-meta {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}
</style>
