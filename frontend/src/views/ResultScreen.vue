<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw, SlidersHorizontal, Swords, TrendingUp, Trophy, Users } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import BrandMark from '@/components/shared/BrandMark.vue'
import ImpactChart from '@/components/shared/ImpactChart.vue'
import ScenarioBreakdown from '@/components/ScenarioBreakdown.vue'
import SimulationResultDashboard from '@/components/SimulationResultDashboard.vue'
import SimulationEventLog from '@/components/SimulationEventLog.vue'
import ExplanationPanel from '@/components/ExplanationPanel.vue'
import { useGameStore } from '@/stores/game'
import { usePkStore } from '@/stores/pk'
import { useSimulationStore } from '@/stores/simulation'
import { compareWithPrevious } from '@/services/compare'

/**
 * 结算页（全屏，压在三个设计版本之上）
 * 只渲染 store 里的结果快照：分项、风险、联动、解释、事件、预测全部来自引擎输出。
 * 「与上一轮对比」是本机快照相减得到的展示值，不重新计算任何分数。
 * 双人 PK 模式下：玩家一锁定本局 → 玩家二重新分配 → 判定（同分归先手）。
 */
const sim = useSimulationStore()
const pk = usePkStore()
const game = useGameStore()

const result = computed(() => sim.result)
const rainLabel = computed(() => (result.value?.rainType === 'burst' ? '短时强降雨' : '持续型降雨'))
const previous = computed(() => (result.value ? compareWithPrevious(result.value) : null))

/** 玩家一锁定：清空分配、回到规划页，把设备交给玩家二 */
function lockFirst(): void {
  if (!result.value) return
  pk.lockFirst(result.value)
  game.reset()
  sim.backToPlan()
}

/** 再开一局 PK：双方记录清空、分配清空、回到玩家一 */
function restartPk(): void {
  pk.restart()
  game.reset()
  sim.playAgain()
}

function quitPk(): void {
  pk.quit()
  sim.backToPlan()
}
</script>

<template>
  <div v-if="result" class="result-screen" role="dialog" aria-modal="true" aria-label="推演结算">
    <div class="frame">
      <header class="bar">
        <BrandMark size="sm" />
        <span class="sep" />
        <span class="title">推演结算</span>
        <span class="meta">{{ rainLabel }} · {{ result.strategyType }} · {{ result.gradeLabel }}</span>
        <span class="source-chip" :class="{ 'is-backend': sim.source === 'backend' }">{{ sim.sourceLabel }}</span>
      </header>

      <main class="grid">
        <section class="cell cell--left"><ScenarioBreakdown :results="result.scenarioResults" /></section>
        <section class="cell cell--main">
          <SimulationResultDashboard :result="result" :previous="previous" />
        </section>
        <section class="cell cell--right">
          <ExplanationPanel :explanations="result.explanations" />
          <SimulationEventLog :events="result.events" />
        </section>

        <footer class="cell cell--foot">
          <div class="chart">
            <span class="chart-title"><TrendingUp :size="11" :stroke-width="2" />城市状态预测</span>
            <ImpactChart :points="result.forecast" :height="86" :legend="false" compact />
          </div>

          <p class="hint">
            <template v-if="pk.active">
              <span class="pk-badge">
                <Users :size="11" :stroke-width="2" />
                双人 PK · {{ pk.turn === 1 ? '第一回合 · 玩家一' : '第二回合 · 玩家二' }}
              </span>
              <span v-if="pk.verdict" class="pk-verdict">
                <Trophy :size="11" :stroke-width="2" />
                {{ pk.verdict.title }} · {{ pk.verdict.detail }}
              </span>
              <span v-else>
                锁定后只公开分数与等级，不公开加点；<span class="mono">玩家二必须严格更高才算获胜</span>，同分归玩家一。
              </span>
            </template>
            <template v-else>
              返回调整保留当前 5 点分配；再玩一次从 0 点重新规划。本轮结果已写入
              <span class="mono">{{ sim.source === 'backend' ? '本机 SQLite 与浏览器记录' : '浏览器记录' }}</span>。
            </template>
          </p>

          <div class="btns">
            <template v-if="pk.active">
              <NButton
                v-if="pk.turn === 1 && !pk.p1"
                class="rc-btn again"
                type="warning"
                size="large"
                @click="lockFirst"
              >
                <template #icon><Swords :size="15" /></template>
                锁定本局 · 交给玩家二
              </NButton>
              <NButton v-else class="rc-btn again" type="warning" size="large" @click="restartPk">
                <template #icon><RotateCcw :size="15" /></template>
                再开一局 PK
              </NButton>
              <NButton class="rc-btn ghost" secondary size="large" @click="quitPk">退出 PK</NButton>
            </template>
            <template v-else>
              <NButton class="rc-btn ghost" secondary size="large" @click="sim.backToPlan()">
                <template #icon><SlidersHorizontal :size="15" /></template>
                返回调整
              </NButton>
              <NButton class="rc-btn again" type="warning" size="large" @click="sim.playAgain()">
                <template #icon><RotateCcw :size="15" /></template>
                再玩一次
              </NButton>
            </template>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
.result-screen {
  position: fixed;
  inset: 0;
  z-index: 50;
  padding: 12px;
  background:
    radial-gradient(80% 55% at 50% 0%, rgba(56, 189, 248, 0.08), transparent 62%),
    color-mix(in srgb, var(--bg) 96%, black);
}

.frame {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.bar {
  display: flex;
  flex: none;
  gap: 12px;
  align-items: center;
  padding: 0 4px 8px;
  border-bottom: 1px solid var(--line-hair);
}

.sep {
  width: 1px;
  height: 16px;
  background: var(--border);
}

.title {
  font-size: var(--fs-md);
  letter-spacing: 0.1em;
  color: var(--text);
}

.meta {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.bar .source-chip {
  margin-left: auto;
}

.grid {
  display: grid;
  flex: 1;
  gap: 10px;
  min-height: 0;
  grid-template-columns: 300px minmax(0, 1fr) 348px;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'left main right'
    'foot foot foot';
}

.cell {
  min-width: 0;
  min-height: 0;
}

.cell--left {
  grid-area: left;
  display: flex;
}

.cell--main {
  grid-area: main;
  display: flex;
}

.cell--right {
  grid-area: right;
  display: grid;
  grid-template-rows: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 10px;
}

.cell--left > :deep(section),
.cell--main > :deep(section) {
  flex: 1;
  min-height: 0;
}

.cell--foot {
  grid-area: foot;
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-elevated) 42%, transparent), var(--surface-1));
  border: 1px solid var(--border-soft);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-panel);
}

.chart {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  width: 280px;
}

.chart-title {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: var(--fs-micro);
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.hint {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-muted);
}

.hint .mono {
  color: var(--cyan);
}

.pk-badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-right: 7px;
  padding: 1px 7px;
  font-size: var(--fs-micro);
  color: var(--amber);
  border: 1px solid color-mix(in srgb, var(--amber) 44%, transparent);
  border-radius: var(--r-pill);
  background: var(--amber-soft);
}

.pk-verdict {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: var(--text);
}

.btns {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.ghost {
  color: var(--text);
  background: color-mix(in srgb, var(--surface-elevated) 62%, transparent);
  border: 1px solid var(--border);
}

.ghost:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.ghost :deep(.n-button__content) {
  color: var(--text);
}

.again {
  --n-color: var(--amber);
  --n-color-hover: color-mix(in srgb, var(--amber) 88%, white);
  --n-color-pressed: color-mix(in srgb, var(--amber) 82%, black);
  --n-text-color: #101c11;
  --n-text-color-hover: #101c11;
  --n-text-color-pressed: #101c11;
  box-shadow: var(--glow-amber);
}

@media (max-width: 1280px) {
  .grid {
    grid-template-columns: 260px minmax(0, 1fr) 300px;
  }

  .chart {
    width: 220px;
  }
}
</style>
