<script setup lang="ts">
import { computed } from 'vue'
import { Activity, ArrowLeftRight, ArrowUpRight, Droplets, Waves } from 'lucide-vue-next'
import StrategyBadge from './StrategyBadge.vue'
import { SCENARIO_MAP } from '@/config/sites'
import type { RunComparison } from '@/services/compare'
import type { SimulationResult } from '@/types'

interface Props {
  /** 结算结果快照（后端响应或本地预览引擎输出），组件只渲染不计算 */
  result: SimulationResult
  /** 与上一轮推演对比（本机快照派生，可能为空：本机只有这一轮） */
  previous?: RunComparison | null
}

const props = withDefaults(defineProps<Props>(), { previous: null })

const RISK_ITEMS = [
  { key: 'waterlogRisk', label: '积水风险' },
  { key: 'lossRisk', label: '损失概率' },
  { key: 'stationPressure', label: '车站压力' },
  { key: 'drainageLoad', label: '排水负荷' },
] as const

/** 阈值只决定颜色，不参与任何评分 */
const toneOf = (value: number): string => (value < 35 ? 'is-safe' : value < 62 ? 'is-warn' : 'is-risk')

const risks = computed(() =>
  RISK_ITEMS.map((item) => ({
    ...item,
    value: props.result.riskMetrics[item.key],
    tone: toneOf(props.result.riskMetrics[item.key]),
  })),
)

const recommendations = computed(() =>
  props.result.recommendations.map((item) => ({
    ...item,
    sceneName: SCENARIO_MAP[item.sceneId].name,
  })),
)

/** 对比块：只展示变化最大的 3 个场景，Δ 由两条已有结果相减得到 */
const comparedScenes = computed(() =>
  (props.previous?.sceneDeltas ?? []).filter((row) => row.delta !== 0).slice(0, 3),
)
</script>

<template>
  <section class="panel dashboard">
    <div class="hero">
      <div class="hero-score">
        <span class="score-label">综合评分</span>
        <span class="score-value num">{{ props.result.overallScore }}<i>/100</i></span>
        <span class="score-grade">{{ props.result.gradeLabel }}</span>
      </div>

      <div class="hero-side">
        <StrategyBadge :strategy="props.result.strategyType" />
        <span class="score-grade-note">{{ props.result.grade }}</span>
        <div class="hero-tags">
          <span class="tag"><Droplets :size="10" />{{ props.result.rainType === 'burst' ? '短时强降雨' : '持续型降雨' }}</span>
          <span class="tag"><Waves :size="10" />联动 {{ props.result.triggeredSynergies.length }} 条</span>
        </div>
      </div>
    </div>

    <div class="risk-grid">
      <div v-for="item in risks" :key="item.key" class="risk-cell" :class="item.tone">
        <span class="risk-label">{{ item.label }}</span>
        <span class="risk-value num">{{ item.value }}</span>
        <span class="risk-bar mini-bar"><i :style="{ width: `${item.value}%` }" /></span>
      </div>
    </div>

    <div class="dash-body scroll-y">
      <div class="block">
        <header class="block-head">
          <Activity :size="12" />
          <span>触发的场景联动</span>
          <em>{{ props.result.triggeredSynergies.length ? `共 ${props.result.triggeredSynergies.length} 条生效` : '本轮未触发联动' }}</em>
        </header>
        <ul class="synergy-list">
          <li v-if="!props.result.triggeredSynergies.length" class="hint">
            联动需要同时满足上下游场景的最低投入，例如公园与车站同时达到 2 点。
          </li>
          <li v-for="item in props.result.triggeredSynergies" :key="item.id" class="synergy">
            <span class="synergy-name">{{ item.name }}</span>
            <span class="synergy-gain num">+{{ item.gain }}</span>
            <span class="synergy-detail">{{ item.detail }}</span>
          </li>
        </ul>
      </div>

      <div v-if="props.previous" class="block">
        <header class="block-head">
          <ArrowLeftRight :size="12" />
          <span>与上一轮对比</span>
          <em>{{ props.previous.rainLabel }} · 本机最近一条其它记录</em>
        </header>
        <div class="compare">
          <div class="cmp-head">
            <span class="cmp-prev num">{{ props.previous.prevScore }}</span>
            <span class="cmp-arrow">→</span>
            <span class="cmp-now num">{{ props.result.overallScore }}</span>
            <span
              class="cmp-delta num"
              :class="props.previous.scoreDelta >= 0 ? 'is-up' : 'is-down'"
            >
              {{ props.previous.scoreDelta >= 0 ? `+${props.previous.scoreDelta}` : props.previous.scoreDelta }}
            </span>
            <span class="cmp-grade mono">
              上一轮 {{ props.previous.prevGrade }} 级 · {{ props.previous.prevStrategy }}
            </span>
          </div>
          <p class="cmp-alloc mono">
            上一轮配置 {{ props.previous.allocationText }}
            <template v-if="props.previous.allocationChanges.length">
              · 本轮变化 {{ props.previous.allocationChanges.join(' / ') }}
            </template>
            <template v-else>· 本轮配置与上一轮相同</template>
          </p>
          <ul v-if="comparedScenes.length" class="cmp-scenes">
            <li v-for="row in comparedScenes" :key="row.sceneId">
              <span class="cmp-name">{{ row.name }}</span>
              <span class="cmp-pair mono">{{ row.previous }} → {{ row.current }}</span>
              <span class="cmp-scene-delta num" :class="row.delta >= 0 ? 'is-up' : 'is-down'">
                {{ row.delta >= 0 ? `+${row.delta}` : row.delta }}
              </span>
            </li>
          </ul>
          <p v-else class="hint">两轮五个场景的净安全度没有差异，差别只在总分与雨型。</p>
        </div>
      </div>

      <div class="block">
        <header class="block-head">
          <ArrowUpRight :size="12" />
          <span>可优化的下一步</span>
          <em>策略提示 · 非 AI 生成</em>
        </header>
        <ul class="rec-list">
          <li v-if="!recommendations.length" class="hint">当前分配已无可提升项，换一种雨型再试。</li>
          <li v-for="item in recommendations" :key="`${item.sceneId}-${item.text}`" class="rec">
            <span class="tag">{{ item.sceneName }}</span>
            <span class="rec-text">{{ item.text }}</span>
            <span class="rec-gain num">+{{ item.gain }}</span>
          </li>
        </ul>
      </div>
    </div>

    <footer class="dash-foot mono">
      <span>rules {{ props.result.rulesVersion }}</span>
      <span>sim {{ props.result.simulationId }}</span>
    </footer>
  </section>
</template>

<style scoped>
.dashboard {
  flex: 1;
  min-height: 0;
}

.hero {
  display: flex;
  gap: var(--sp-4);
  align-items: flex-end;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--line-hair);
  background: radial-gradient(
    120% 160% at 12% 0%,
    color-mix(in srgb, var(--amber) 12%, transparent),
    transparent 62%
  );
}

.hero-score {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.score-label {
  font-size: var(--fs-tiny);
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.score-value {
  font-size: var(--fs-hero);
  font-weight: 600;
  line-height: 1;
  color: var(--amber);
}

.score-value i {
  margin-left: 4px;
  font-size: var(--fs-xs);
  font-style: normal;
  color: var(--text-dim);
}

.score-grade {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.hero-side {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin-left: auto;
}

.score-grade-note {
  font-size: var(--fs-tiny);
  color: var(--text-dim);
}

.hero-tags {
  display: flex;
  gap: 5px;
  width: 100%;
  justify-content: flex-end;
}

.risk-grid {
  display: grid;
  flex: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line-hair);
}

.risk-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 9px;
  background: color-mix(in srgb, var(--surface-elevated) 28%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
  --bar-color: var(--cyan);
}

.risk-label {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.risk-value {
  font-size: var(--fs-lg);
  line-height: 1.1;
  color: var(--text);
}

.risk-cell.is-safe {
  --bar-color: var(--safe);
}

.risk-cell.is-warn {
  --bar-color: var(--risk);
}

.risk-cell.is-risk {
  --bar-color: var(--danger);
}

.risk-cell.is-risk .risk-value {
  color: var(--danger);
}

.dash-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 10px 16px 12px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-head {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: var(--fs-xs);
  color: var(--text);
}

.block-head em {
  margin-left: auto;
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-dim);
}

.synergy-list,
.rec-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.synergy,
.rec {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 6px 8px;
  background: color-mix(in srgb, var(--surface-elevated) 26%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
}

.synergy-name {
  flex: none;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--safe);
}

.synergy-gain,
.rec-gain {
  flex: none;
  font-size: var(--fs-xs);
  color: var(--amber);
}

.synergy-detail,
.rec-text {
  font-size: var(--fs-micro);
  line-height: 1.45;
  color: var(--text-muted);
}

/* —— 与上一轮对比 —— */
.compare {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 9px;
  background: color-mix(in srgb, var(--surface-elevated) 24%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
}

.cmp-head {
  display: flex;
  gap: 7px;
  align-items: baseline;
}

.cmp-prev {
  font-size: var(--fs-xs);
  color: var(--text-dim);
}

.cmp-arrow {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.cmp-now {
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--amber);
}

.cmp-delta {
  font-size: var(--fs-xs);
}

.cmp-delta.is-up {
  color: var(--safe);
}

.cmp-delta.is-down {
  color: var(--risk);
}

.cmp-grade {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.cmp-alloc {
  font-size: var(--fs-micro);
  line-height: 1.5;
  color: var(--text-muted);
}

.cmp-scenes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.cmp-scenes li {
  display: flex;
  gap: 5px;
  align-items: baseline;
  font-size: var(--fs-micro);
}

.cmp-name {
  color: var(--text-muted);
}

.cmp-pair {
  color: var(--text-dim);
}

.cmp-scene-delta.is-up {
  color: var(--safe);
}

.cmp-scene-delta.is-down {
  color: var(--risk);
}

.dash-foot {
  display: flex;
  justify-content: space-between;
  padding: 6px 16px 8px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  border-top: 1px solid var(--line-hair);
}
</style>
