<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-vue-next'
import { STAGE_LABELS } from '@/config/sites'
import { stageLabelOf } from '@/engine/previewEngine'
import { assetUrl, useSceneVisuals } from '@/composables/useSceneVisuals'
import type { ScenarioConfig, ScenarioResult, SceneId } from '@/types'

interface Props {
  scene: ScenarioConfig
  level: number
  result?: ScenarioResult | null
  variant?: 'compact' | 'detail'
}

const props = withDefaults(defineProps<Props>(), { result: null, variant: 'compact' })
const emit = defineEmits<{ open: [id: SceneId] }>()

const { iconOf, accentOf } = useSceneVisuals()

const icon = computed(() => iconOf(props.scene.id))
const accent = computed(() => accentOf(props.scene.id))
const stage = computed(() => stageLabelOf(props.level))

/** 0–5 档位收益表：直接展示配置曲线，组件内不做任何收益计算 */
const levels = computed(() =>
  props.scene.yieldCurve.map((value, index) => ({
    level: index,
    label: STAGE_LABELS[index],
    percent: Math.round(value * 100),
    current: index === props.level,
  })),
)

const deltaTone = computed(() => {
  const value = props.result?.deltaValue ?? 0
  if (value > 0) return 'is-up'
  if (value < 0) return 'is-down'
  return 'is-flat'
})
</script>

<template>
  <!-- 结算/详情用紧凑卡：一行说清「投了多少、买到什么」 -->
  <article
    v-if="props.variant === 'compact'"
    class="scene-card"
    :class="{ 'is-zero': props.level === 0 }"
    :style="{ '--accent': accent }"
  >
    <img class="card-thumb" :src="assetUrl(props.scene.asset)" :alt="props.scene.name" loading="lazy" />

    <div class="card-main">
      <div class="card-title">
        <component :is="icon" :size="12" />
        <strong>{{ props.scene.name }}</strong>
        <span class="tag">{{ props.scene.direction }}</span>
      </div>
      <div class="card-sub">
        <span class="card-level" :class="{ 'is-zero': props.level === 0 }">
          {{ props.level === 0 ? '无专项投入' : `${props.level} 点 · ${stage}` }}
        </span>
        <span v-if="props.result" class="card-delta" :class="deltaTone">
          <component
            :is="props.result.deltaValue > 0 ? ArrowUpRight : props.result.deltaValue < 0 ? ArrowDownRight : Minus"
            :size="10"
          />
          {{ props.result.deltaText }}
        </span>
      </div>

      <div v-if="props.result" class="card-metrics">
        <span class="metric">
          <em>本地防护</em><b class="num">{{ props.result.coverage }}</b>
        </span>
        <span class="metric">
          <em>净安全度</em><b class="num">{{ props.result.effective }}</b>
        </span>
        <span class="metric">
          <em>上游来水</em><b class="num">{{ props.result.inflow }}</b>
        </span>
        <span class="metric">
          <em>下游径流</em><b class="num">{{ props.result.outflow }}</b>
        </span>
      </div>
    </div>

    <button type="button" class="card-open" @click="emit('open', props.scene.id)">详情</button>
  </article>

  <!-- 场景详情：概览 + 0–5 档位效果表 + 关联关系 -->
  <article v-else class="scene-detail" :style="{ '--accent': accent }">
    <div class="detail-hero">
      <img :src="assetUrl(props.scene.asset)" :alt="props.scene.name" />
      <div class="detail-hero-mask">
        <span class="detail-badge">
          <component :is="icon" :size="13" />
          {{ props.scene.name }}
          <em>{{ props.scene.nameEn }}</em>
        </span>
        <span class="detail-points num">{{ props.level }}<i>/5</i></span>
      </div>
    </div>

    <div class="detail-body">
      <p class="detail-line">
        <span class="detail-key">投资方向</span>
        <span>{{ props.scene.direction }} · {{ props.scene.project }}</span>
      </p>
      <p class="detail-line">
        <span class="detail-key">水流关系</span>
        <span>{{ props.scene.flowRole }}</span>
      </p>
      <p class="detail-line">
        <span class="detail-key">当前档位</span>
        <span>{{ stage }}{{ props.level === 0 ? `（${props.scene.baseNote}）` : '' }}</span>
      </p>

      <table class="level-table">
        <thead>
          <tr>
            <th>档位</th>
            <th>阶段</th>
            <th>本地防护达成</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in levels" :key="row.level" :class="{ 'is-current': row.current }">
            <td class="num">{{ row.level }}</td>
            <td>{{ row.label }}</td>
            <td>
              <span class="level-cell">
                <span class="mini-bar level-bar" :style="{ '--bar-color': accent }">
                  <i :style="{ width: `${row.percent}%` }" />
                </span>
                <b class="num">{{ row.percent }}%</b>
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="props.result" class="detail-hint">
        <span class="detail-key">本轮结果</span>
        <span>
          净安全度 {{ props.result.effective }}，{{ props.result.deltaText }}（相对 1/1/1/1/1 基准方案）。
        </span>
      </p>
      <p class="detail-note">
        策略提示：以上档位收益来自规则配置表，不是 AI 生成的建议。
      </p>
    </div>
  </article>
</template>

<style scoped>
/* —— 紧凑卡 —— */
.scene-card {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 9px;
  background: color-mix(in srgb, var(--surface-elevated) 34%, transparent);
  border: 1px solid var(--border-soft);
  border-left: 2px solid var(--accent);
  border-radius: var(--r-md);
  transition: background var(--dur-1) var(--ease);
}

.scene-card:hover {
  background: color-mix(in srgb, var(--surface-elevated) 62%, transparent);
}

.scene-card.is-zero {
  border-left-style: dashed;
}

.card-thumb {
  flex: none;
  width: 46px;
  height: 40px;
  object-fit: cover;
  background: var(--bg);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-sm);
}

.card-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
}

.card-title strong {
  font-size: var(--fs-xs);
  color: var(--text);
}

.card-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.card-level.is-zero {
  color: var(--text-dim);
}

.card-delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-dim);
}

.card-delta.is-up {
  color: var(--safe);
}

.card-delta.is-down {
  color: var(--risk);
}

.card-metrics {
  display: flex;
  gap: 12px;
  margin-top: 1px;
}

.metric {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--fs-micro);
}

.metric em {
  font-style: normal;
  color: var(--text-dim);
}

.metric b {
  font-size: var(--fs-xs);
  color: var(--text);
}

.card-open {
  flex: none;
  padding: 3px 8px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-pill);
  transition:
    color var(--dur-1) var(--ease),
    border-color var(--dur-1) var(--ease);
}

.card-open:hover {
  color: var(--accent);
  border-color: var(--accent);
}

/* —— 详情 —— */
.scene-detail {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}

.detail-hero {
  position: relative;
  height: 128px;
  overflow: hidden;
}

.detail-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-hero-mask {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(0deg, rgba(7, 19, 33, 0.92), transparent);
}

.detail-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-sm);
  color: var(--text);
}

.detail-badge em {
  font-family: var(--font-num);
  font-size: var(--fs-micro);
  font-style: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.detail-points {
  margin-left: auto;
  font-size: 22px;
  font-weight: 600;
  color: var(--accent);
}

.detail-points i {
  font-size: var(--fs-xs);
  font-style: normal;
  color: var(--text-dim);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px 12px;
}

.detail-line,
.detail-hint {
  display: flex;
  gap: 8px;
  font-size: var(--fs-xs);
  line-height: 1.5;
  color: var(--text-muted);
}

.detail-key {
  flex: none;
  width: 54px;
  color: var(--text-dim);
}

.level-table {
  width: 100%;
  margin: 2px 0;
  border-collapse: collapse;
}

.level-table th {
  padding: 3px 4px;
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--text-dim);
  text-align: left;
  border-bottom: 1px solid var(--line-hair);
}

.level-table td {
  padding: 3px 4px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 26%, transparent);
}

.level-table tr.is-current td {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.level-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.level-bar {
  flex: 1;
  height: 3px;
}

.level-cell b {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.detail-note {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}
</style>
