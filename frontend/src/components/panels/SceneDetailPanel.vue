<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownRight, ArrowUpRight, Droplets, Minus, Plus, Waves } from 'lucide-vue-next'
import PanelFrame from './PanelFrame.vue'
import SceneThumb from '@/components/shared/SceneThumb.vue'
import { useGameStore } from '@/stores/game'
import { useSceneDetail } from '@/composables/useSceneDetail'
import { useSceneVisuals } from '@/composables/useSceneVisuals'
import type { SceneId } from '@/types'

/**
 * 场景详情抽屉（规格书 §5.5）
 * ---------------------------------------------------------------
 * A / B / C 三个设计版本共用：点击城市节点或分配行打开，Esc / X 关闭。
 * 面板内不计算任何分数：档位曲线、传递系数、联动阈值来自 rules.json，
 * 本轮读数与联动是否触发来自 store.preview（引擎输出）。
 */
const props = defineProps<{ sceneId: SceneId }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useGameStore()
const detail = useSceneDetail(() => props.sceneId)
const { iconOf } = useSceneVisuals()

const icon = computed(() => iconOf(props.sceneId))
const deltaTone = computed(() =>
  (detail.value?.deltaValue ?? 0) > 0 ? 'is-up' : (detail.value?.deltaValue ?? 0) < 0 ? 'is-down' : 'is-flat',
)

function step(delta: 1 | -1): void {
  if (!detail.value) return
  if (delta > 0) store.increase(props.sceneId)
  else store.decrease(props.sceneId)
}

const incReason = computed(() => store.incBlockReason(props.sceneId))
const decReason = computed(() => store.decBlockReason(props.sceneId))
</script>

<template>
  <PanelFrame
    v-if="detail"
    :title="`${detail.name} · 场景详情`"
    :subtitle="`${detail.nameEn} · ${detail.rainLabel} · 规则 ${detail.levels.length} 档`"
    width="min(410px, 100%)"
    @close="emit('close')"
  >
    <div class="detail" :style="{ '--accent': detail.accent }">
      <header class="hero">
        <SceneThumb :scene-id="detail.id" />
        <div class="hero-main">
          <span class="hero-name">
            <component :is="icon" :size="13" :stroke-width="1.9" />
            {{ detail.direction }}
          </span>
          <span class="hero-sub">{{ detail.project }}</span>
        </div>
        <div class="stepper">
          <button
            type="button"
            class="step"
            :disabled="detail.invested <= 0"
            :title="decReason ?? '减少 1 点'"
            @click="step(-1)"
          >
            <Minus :size="12" :stroke-width="2.4" />
          </button>
          <span class="value num">{{ detail.invested }}<i>/{{ detail.maxPoints }}</i></span>
          <button
            type="button"
            class="step"
            :disabled="!!incReason"
            :title="incReason ?? '增加 1 点'"
            @click="step(1)"
          >
            <Plus :size="12" :stroke-width="2.4" />
          </button>
        </div>
      </header>

      <section class="block">
        <h4>本轮读数</h4>
        <div class="metrics">
          <div class="metric">
            <em>本地防护</em><b class="num">{{ detail.coverage }}</b>
          </div>
          <div class="metric">
            <em>净安全度</em><b class="num">{{ detail.effective }}</b>
          </div>
          <div class="metric">
            <em>上游来水</em><b class="num">{{ detail.inflow }}</b>
          </div>
          <div class="metric">
            <em>下游径流</em><b class="num">{{ detail.outflow }}</b>
          </div>
        </div>
        <p class="delta" :class="deltaTone">
          <component
            :is="detail.deltaValue > 0 ? ArrowUpRight : detail.deltaValue < 0 ? ArrowDownRight : Minus"
            :size="11"
            :stroke-width="2.2"
          />
          相对基准方案（1/1/1/1/1）：{{ detail.deltaText }}
        </p>
        <p class="note">
          当前档位：{{ detail.stageLabel }}（{{ detail.invested }} 点）· 0 点也保留基础状态：
          {{ detail.baseNote }}
        </p>
      </section>

      <section class="block">
        <h4>
          0–5 档位效果
          <em>档位收益来自规则配置表</em>
        </h4>
        <table class="level-table">
          <thead>
            <tr>
              <th>档位</th>
              <th>阶段</th>
              <th>本地防护达成</th>
              <th>边际</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in detail.levels" :key="row.level" :class="{ 'is-current': row.current }">
              <td class="num">{{ row.level }}</td>
              <td>{{ row.label }}</td>
              <td>
                <span class="level-cell">
                  <span class="mini-bar level-bar"><i :style="{ width: `${row.percent}%` }" /></span>
                  <b class="num">{{ row.percent }}%</b>
                </span>
              </td>
              <td class="num muted">{{ row.delta === null ? '—' : `+${row.delta}` }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="block">
        <h4>水流关系（固定，不可增删）</h4>
        <ul class="links">
          <li v-for="link in detail.links" :key="`${link.role}-${link.id}`" class="link">
            <span class="link-role" :class="`is-${link.role}`">
              {{ link.role === 'upstream' ? '上游' : '下游' }}
            </span>
            <span class="link-name">{{ link.role === 'upstream' ? `${link.name} → 本场景` : `本场景 → ${link.name}` }}</span>
            <span class="link-meta mono">
              传递系数 {{ link.transfer }}
              <template v-if="link.outflow !== null"> · 本轮排出 {{ link.outflow }}</template>
            </span>
          </li>
          <li class="link">
            <span class="link-role">{{ detail.id === 'station' ? '汇流' : '角色' }}</span>
            <span class="link-name">{{ detail.flowRole }}</span>
          </li>
        </ul>
      </section>

      <section class="block">
        <h4>
          联动判定
          <em>{{ detail.synergies.length ? '阈值来自规则配置' : '本场景不在联动条件中' }}</em>
        </h4>
        <ul class="synergies">
          <li v-for="rule in detail.synergies" :key="rule.id" :class="{ 'is-on': rule.triggered }">
            <span class="dot" />
            <span class="syn-main">
              <b>{{ rule.name }}</b>
              <em>{{ rule.effect }}</em>
            </span>
            <span class="syn-cond mono">{{ rule.conditionText }}</span>
            <span class="syn-state">{{ rule.triggered ? '已触发' : '未达成' }}</span>
          </li>
          <li v-if="!detail.synergies.length" class="empty">本场景不参与任何联动阈值判定。</li>
        </ul>
      </section>

      <section class="block">
        <h4>
          策略提示
          <em>按规则配置推导，非 AI 生成</em>
        </h4>
        <p class="tip">
          <template v-if="detail.nextGain !== null && detail.remaining > 0">
            再投 1 点 → 本地防护达成率 +{{ detail.nextGain }} 个百分点（当前还可分配 {{ detail.remaining }} 点）。
          </template>
          <template v-else-if="detail.nextGain !== null">
            再投 1 点 → 本地防护达成率 +{{ detail.nextGain }} 个百分点，但 5 点已分完，需先从其他场景收回。
          </template>
          <template v-else>已达 {{ detail.maxPoints }} 点极限专精，本场景没有更高档位。</template>
        </p>
        <p class="tip dim">
          <Droplets :size="10" :stroke-width="2" />
          本雨型评分权重 {{ Math.round(detail.scoreWeight * 100) }}%；暴露度（总量
          {{ detail.exposureVolume }} / 峰值 {{ detail.exposurePeak }}）。
          <Waves :size="10" :stroke-width="2" />
          指标为项目自定义简化值，不是工程单位。
        </p>
      </section>
    </div>
  </PanelFrame>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  background: color-mix(in srgb, var(--accent) 8%, var(--surface-1));
  border: 1px solid color-mix(in srgb, var(--accent) 34%, var(--border));
  border-radius: var(--r-md);
}

.hero-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.hero-name {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--accent);
}

.hero-sub {
  font-size: var(--fs-micro);
  line-height: 1.4;
  color: var(--text-muted);
}

.stepper {
  display: flex;
  flex: none;
  gap: 2px;
  align-items: center;
  padding: 2px;
  background: color-mix(in srgb, var(--bg) 52%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
}

.step {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: var(--text-muted);
  border-radius: 4px;
  transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
}

.step:hover:not(:disabled) {
  color: var(--cyan);
  background: var(--cyan-soft);
}

.step:disabled {
  color: color-mix(in srgb, var(--text-dim) 70%, transparent);
  cursor: not-allowed;
}

.value {
  min-width: 34px;
  font-size: var(--fs-md);
  font-weight: 700;
  text-align: center;
}

.value i {
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-dim);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-hair);
}

.block:last-of-type {
  padding-bottom: 0;
  border-bottom: 0;
}

h4 {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: var(--fs-sm);
  letter-spacing: 0.05em;
  color: var(--text);
}

h4 em {
  margin-left: auto;
  font-size: var(--fs-micro);
  font-style: normal;
  font-weight: 400;
  color: var(--text-dim);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  background: color-mix(in srgb, var(--surface-elevated) 26%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
}

.metric em {
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-dim);
}

.metric b {
  font-size: var(--fs-lg);
  line-height: 1.1;
  color: var(--text);
}

.delta {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.delta.is-up {
  color: var(--safe);
}

.delta.is-down {
  color: var(--risk);
}

.note {
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-dim);
}

.level-table {
  width: 100%;
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
  padding: 4px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 24%, transparent);
}

.level-table tr.is-current td {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.level-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.level-bar {
  flex: 1;
  height: 3px;
  --bar-color: var(--accent);
}

.level-cell b {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.muted {
  color: var(--text-dim);
}

.links,
.synergies {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.link {
  display: flex;
  gap: 7px;
  align-items: baseline;
  padding: 5px 8px;
  font-size: var(--fs-micro);
  background: color-mix(in srgb, var(--surface) 54%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
}

.link-role {
  flex: none;
  padding: 0 5px;
  font-size: 9px;
  line-height: 15px;
  color: var(--text-dim);
  background: color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: 3px;
}

.link-role.is-upstream {
  color: var(--cyan);
  background: var(--cyan-soft);
}

.link-role.is-downstream {
  color: var(--risk);
  background: var(--risk-soft);
}

.link-name {
  flex: 1;
  min-width: 0;
  color: var(--text);
}

.link-meta {
  flex: none;
  color: var(--text-dim);
}

.synergies li {
  display: flex;
  gap: 7px;
  align-items: baseline;
  padding: 5px 8px;
  font-size: var(--fs-micro);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-sm);
  background: color-mix(in srgb, var(--surface) 46%, transparent);
}

.synergies li.is-on {
  border-color: color-mix(in srgb, var(--safe) 44%, transparent);
  background: var(--safe-soft);
}

.dot {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border);
}

.synergies li.is-on .dot {
  background: var(--safe);
  box-shadow: 0 0 8px 1px color-mix(in srgb, var(--safe) 55%, transparent);
}

.syn-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.syn-main b {
  font-size: var(--fs-micro);
  color: var(--text);
}

.syn-main em {
  font-size: 9px;
  font-style: normal;
  color: var(--text-dim);
}

.syn-cond {
  flex: none;
  font-size: 9px;
  color: var(--text-muted);
}

.syn-state {
  flex: none;
  font-size: 9px;
  color: var(--text-dim);
}

.synergies li.is-on .syn-state {
  color: var(--safe);
}

.empty {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.tip {
  display: flex;
  gap: 4px;
  align-items: baseline;
  font-size: var(--fs-micro);
  line-height: 1.7;
  color: var(--text-muted);
}

.tip.dim {
  flex-wrap: wrap;
  color: var(--text-dim);
}
</style>
