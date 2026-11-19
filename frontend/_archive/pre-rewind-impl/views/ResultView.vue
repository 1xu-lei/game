<script setup lang="ts">
import { RotateCcw, SlidersHorizontal } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import GameShell from '@/components/GameShell.vue'
import ScenarioBreakdown from '@/components/ScenarioBreakdown.vue'
import SimulationResultDashboard from '@/components/SimulationResultDashboard.vue'
import ExplanationPanel from '@/components/ExplanationPanel.vue'
import StrategyBadge from '@/components/StrategyBadge.vue'
import { useSimulationStore } from '@/stores/simulation'

const sim = useSimulationStore()
</script>

<template>
  <GameShell v-if="sim.result" active="result" :status-text="`推演完成 · ${sim.result.gradeLabel}`">
    <template #left>
      <ScenarioBreakdown :results="sim.result.scenarioResults" />
    </template>

    <SimulationResultDashboard :result="sim.result" />

    <template #right>
      <ExplanationPanel :explanations="sim.result.explanations" />
    </template>

    <template #bottom>
      <div class="action-bar">
        <div class="action-score">
          <span class="action-label">本轮策略</span>
          <StrategyBadge :strategy="sim.result.strategyType" />
          <span class="tag">{{ sim.result.rainType === 'burst' ? '短时强降雨' : '持续型降雨' }}</span>
        </div>

        <p class="action-hint hint">
          调整分配不会清空本轮记录：返回调整可保留当前 5 点配置，再玩一次会从 0 点重新规划。
        </p>

        <div class="action-btns">
          <span class="source-chip" :class="{ 'is-backend': sim.source === 'backend' }">
            {{ sim.sourceLabel }}
          </span>
          <NButton class="rc-btn ghost-btn" secondary size="large" @click="sim.backToPlan()">
            <template #icon><SlidersHorizontal :size="15" /></template>
            返回调整
          </NButton>
          <NButton class="rc-btn play-again" type="warning" size="large" @click="sim.playAgain()">
            <template #icon><RotateCcw :size="15" /></template>
            再玩一次
          </NButton>
        </div>
      </div>
    </template>
  </GameShell>
</template>

<style scoped>
.action-bar {
  display: flex;
  flex: 1;
  gap: 14px;
  align-items: center;
  min-width: 0;
  padding: 12px 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-elevated) 46%, transparent),
    var(--surface-1)
  );
  border: 1px solid var(--border-soft);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-panel);
}

.action-score {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.action-label {
  font-size: var(--fs-tiny);
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.action-hint {
  flex: 1;
  min-width: 0;
}

.action-btns {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.ghost-btn {
  --n-text-color: var(--text);
  --n-text-color-hover: var(--text);
  --n-border: 1px solid var(--border);
}

.play-again {
  --n-color: var(--amber);
  --n-color-hover: color-mix(in srgb, var(--amber) 88%, white);
  --n-color-pressed: color-mix(in srgb, var(--amber) 82%, black);
  --n-text-color: #101c11;
  --n-text-color-hover: #101c11;
  --n-text-color-pressed: #101c11;
  box-shadow: var(--glow-amber);
}
</style>
