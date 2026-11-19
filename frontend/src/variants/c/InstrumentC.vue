<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import {
  ArrowRight,
  Building2,
  Bus,
  CloudRain,
  GraduationCap,
  Play,
  Store,
  Trees,
} from 'lucide-vue-next'
import { RAIN_TYPES, SCENARIO_MAP } from '@/config/sites'
import { NODE_LAYOUTS } from '@/config/nodeLayout'
import { useGameStore } from '@/stores/game'
import type { SceneId } from '@/types'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'
import LevelPips from '@/components/shared/LevelPips.vue'

/**
 * C 版 · 水文仪
 * ---------------------------------------------------------------
 * 与 A（三栏 HUD）／B（沉浸全景）刻意区分：中央是「平面流域示意图」，
 * 右侧是一块仪表读数面板，气质接近制图台/水文分析仪而不是游戏大厅。
 * 五场景 / 四条固定水路 / 5 点规则 与其它版本完全一致；数值全部只读 store.preview。
 */
const store = useGameStore()
const showPreview = ref(false)
const nodes = NODE_LAYOUTS.c

const ICONS = {
  school: GraduationCap,
  market: Store,
  park: Trees,
  residential: Building2,
  station: Bus,
} as const

const resultOf = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r
      return acc
    },
    {} as Record<SceneId, (typeof store.preview.scenarioResults)[number]>,
  ),
)

const accentOf = (id: SceneId) => `var(${SCENARIO_MAP[id].accentVar})`

/** 小图只吃数值：把 outflow 抽成扁表，避免把整个结果对象塞进图组件 */
const outflowOf = computed(() =>
  store.preview.scenarioResults.reduce(
    (acc, r) => {
      acc[r.sceneId] = r.outflow
      return acc
    },
    {} as Record<SceneId, number>,
  ),
)
const gauge = computed(() => {
  const r = store.preview.riskMetrics
  return [
    { key: '积水风险', value: r.waterlogRisk, color: 'var(--cyan)' },
    { key: '损失概率', value: r.lossRisk, color: 'var(--risk)' },
    { key: '车站压力', value: r.stationPressure, color: 'var(--danger)' },
    { key: '排水负荷', value: r.drainageLoad, color: 'var(--teal)' },
  ]
})

/** 四条固定水路：上游 → 下游，线宽由该场景 outflow 决定 */
const links = computed(() =>
  [
    ['school', 'park'],
    ['market', 'residential'],
    ['park', 'station'],
    ['residential', 'station'],
  ].map(([from, to]) => {
    const a = nodes.find((n) => n.id === from)!
    const b = nodes.find((n) => n.id === to)!
    return {
      key: `${from}-${to}`,
      from: from as SceneId,
      d: `M${a.x} ${a.y} L${b.x} ${b.y}`,
      w: 0.7 + Math.min(100, resultOf.value[from as SceneId].outflow) / 22,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      value: resultOf.value[from as SceneId].outflow,
    }
  }),
)

const synergyRules = [
  { id: 'upstream-store', name: '上游调蓄', cond: '公园 ≥ 3' },
  { id: 'store-drain', name: '排蓄协同', cond: '公园 ≥ 2 且 车站 ≥ 2' },
  { id: 'balanced', name: '全域均衡', cond: '五场景均 ≥ 1' },
]
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <BrandMark size="sm" />
      <span class="divider" />
      <div class="rain-switch">
        <button
          v-for="rain in RAIN_TYPES"
          :key="rain.id"
          type="button"
          class="pill"
          :class="{ 'is-on': store.rainType === rain.id }"
          @click="store.setRain(rain.id)"
        >
          <CloudRain :size="12" :stroke-width="2" />
          {{ rain.name }}
        </button>
      </div>
      <div class="nav">
        <TopNav density="icons" />
      </div>
      <span class="rule mono">RULES {{ store.preview.rulesVersion }} · 简化指标 0–100</span>
    </header>

    <aside class="left">
      <section class="bar-panel">
        <h2>降雨情境</h2>
        <button
          v-for="rain in RAIN_TYPES"
          :key="rain.id"
          type="button"
          class="rain-row"
          :class="{ 'is-on': store.rainType === rain.id }"
          @click="store.setRain(rain.id)"
        >
          <span class="rain-name">{{ rain.name }}</span>
          <span class="rain-en mono">{{ rain.nameEn }}</span>
          <span class="rain-ch">
            <span v-for="c in rain.challenge" :key="c">{{ c }}</span>
          </span>
        </button>
      </section>

      <section class="bar-panel bar-panel--flow">
        <h2>水路拓扑 · 固定</h2>
        <ul class="topo">
          <li><span class="t-from">学校</span><i class="t-arrow" /><span class="t-to">公园</span><em class="mono">径流 {{ outflowOf.school }}</em></li>
          <li><span class="t-from">集市</span><i class="t-arrow" /><span class="t-to">居民区</span><em class="mono">径流 {{ outflowOf.market }}</em></li>
          <li><span class="t-from">公园</span><i class="t-arrow" /><span class="t-to sink">车站</span><em class="mono">下泄 {{ outflowOf.park }}</em></li>
          <li><span class="t-from">居民区</span><i class="t-arrow" /><span class="t-to sink">车站</span><em class="mono">下泄 {{ outflowOf.residential }}</em></li>
        </ul>
        <p class="foot-note">两路汇入车站，车站为最终排水压力承受点</p>
      </section>
    </aside>

    <main class="basin">
      <svg class="basin-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="rgba(45,212,191,0.22)" />
            <stop offset="100%" stop-color="rgba(56,189,248,0.1)" />
          </linearGradient>
        </defs>
        <g class="contours">
          <ellipse cx="47" cy="48" rx="45" ry="43" />
          <ellipse cx="47" cy="48" rx="34" ry="32" />
          <ellipse cx="47" cy="48" rx="23" ry="21" />
          <ellipse cx="47" cy="48" rx="12" ry="11" />
        </g>
        <g class="grid">
          <path v-for="i in 9" :key="`v${i}`" :d="`M${i * 10} 6 L${i * 10} 94`" />
          <path v-for="i in 9" :key="`h${i}`" :d="`M6 ${i * 10} L94 ${i * 10}`" />
        </g>
        <path class="river" d="M4 30 C 26 34, 34 46, 48 48 C 64 51, 78 44, 96 52" />
        <path
          v-for="l in links"
          :key="l.key"
          :d="l.d"
          class="link"
          :class="{ 'is-active': store.selectedScene === l.from || store.selectedScene === 'station' }"
          :stroke-width="l.w"
          vector-effect="non-scaling-stroke"
          marker-end="url(#arrow)"
        />
        <defs>
          <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="var(--cyan)" />
          </marker>
        </defs>
      </svg>

      <div
        v-for="n in nodes"
        :key="n.id"
        class="puck"
        :class="{ 'is-selected': store.selectedScene === n.id, 'is-zero': resultOf[n.id].invested === 0, 'is-sink': n.id === 'station' }"
        :style="{ left: `${n.x}%`, top: `${n.y}%`, '--accent': accentOf(n.id) }"
        @click="store.selectScene(n.id)"
        @mouseenter="store.setHover(n.id)"
        @mouseleave="store.setHover(null)"
      >
        <span class="puck-ring">
          <component :is="ICONS[n.id]" :size="15" :stroke-width="1.8" />
        </span>
        <span class="puck-meta">
          <span class="puck-name">
            {{ SCENARIO_MAP[n.id].name }}
            <b class="num">{{ resultOf[n.id].invested }}</b>
          </span>
          <LevelPips :value="resultOf[n.id].invested" :accent="accentOf(n.id)" size="xs" />
        </span>
      </div>

      <div class="legend mono">
        <span>线宽 = 下泄径流</span>
        <span>·</span>
        <span>车站压力 {{ store.preview.riskMetrics.stationPressure }}</span>
      </div>
    </main>

    <aside class="right">
      <section class="score-block">
        <div class="score-head">
          <span class="mono">OVERALL SCORE</span>
          <span class="grade">{{ store.preview.grade }}</span>
        </div>
        <div class="score-line">
          <span class="score num">{{ store.preview.overallScore }}</span>
          <span class="score-meta">
            <b>{{ store.preview.gradeLabel }}</b>
            <em>{{ store.preview.strategyType }}</em>
          </span>
        </div>
      </section>

      <section class="gauge-grid">
        <div v-for="g in gauge" :key="g.key" class="gauge">
          <span class="gauge-key">{{ g.key }}</span>
          <span class="gauge-value num" :style="{ color: g.color }">{{ g.value }}</span>
          <span class="mini-bar"><i :style="{ width: `${g.value}%`, background: g.color }" /></span>
        </div>
      </section>

      <section class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>场景</th>
              <th class="num">投入</th>
              <th class="num">来水</th>
              <th class="num">净安全</th>
              <th class="num">Δ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in store.preview.scenarioResults"
              :key="s.sceneId"
              :class="{ 'is-selected': store.selectedScene === s.sceneId }"
              @mouseenter="store.setHover(s.sceneId)"
              @mouseleave="store.setHover(null)"
              @click="store.selectScene(s.sceneId)"
            >
              <td>{{ SCENARIO_MAP[s.sceneId].name }}</td>
              <td class="num">{{ s.invested }}</td>
              <td class="num">{{ s.inflow }}</td>
              <td class="num strong">{{ s.effective }}</td>
              <td class="num" :class="s.deltaValue > 0 ? 'up' : s.deltaValue < 0 ? 'down' : ''">
                {{ s.deltaValue > 0 ? `+${s.deltaValue}` : s.deltaValue }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="syn">
        <h3>联动判定</h3>
        <ul>
          <li v-for="rule in synergyRules" :key="rule.id" :class="{ 'is-on': store.preview.triggeredSynergies.some((t) => t.id === rule.id) }">
            <span class="dot" />
            <span class="syn-name">{{ rule.name }}</span>
            <span class="syn-cond mono">{{ rule.cond }}</span>
          </li>
        </ul>
      </section>
    </aside>

    <footer class="dock">
      <div class="bars">
        <div v-for="s in store.preview.scenarioResults" :key="s.sceneId" class="bar-row">
          <span class="bar-name">{{ SCENARIO_MAP[s.sceneId].name }}</span>
          <span class="bar-track">
            <i :style="{ width: `${s.effective}%`, background: accentOf(s.sceneId) }" />
          </span>
          <span class="bar-value num">{{ s.effective }}</span>
        </div>
      </div>
      <div class="cta-col">
        <button type="button" class="cta" :disabled="!store.canSimulate" @click="showPreview = true">
          <Play :size="16" :stroke-width="2.4" />
          开始推演
          <ArrowRight :size="15" :stroke-width="2.4" />
        </button>
        <span class="cta-note">
          {{ store.canSimulate ? `已分配 ${store.total}/5 · 预期 ${store.preview.overallScore} 分` : store.validationMessage }}
        </span>
      </div>
    </footer>

    <NModal v-model:show="showPreview" preset="card" title="预演摘要" :style="{ width: '430px' }" class="c-modal">
      <div class="modal-body">
        <p class="modal-score">
          <span class="num">{{ store.preview.overallScore }}</span>
          <span>{{ store.preview.grade }} 级 · {{ store.preview.gradeLabel }} · {{ store.preview.strategyType }}</span>
        </p>
        <ul class="modal-syn">
          <li v-for="t in store.preview.triggeredSynergies" :key="t.id">{{ t.name }} +{{ t.gain }}</li>
          <li v-if="!store.preview.triggeredSynergies.length" class="muted">未触发联动</li>
        </ul>
        <ol class="modal-events">
          <li v-for="e in store.preview.events.slice(0, 4)" :key="e.index">
            <span class="mono">{{ e.step }}</span> {{ e.text }}
          </li>
        </ol>
        <p class="modal-note">结果来自确定性规则引擎预演；完整结算页在下一阶段接入。</p>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  height: 100vh;
  padding: 10px;
  gap: 10px;
  grid-template-columns: 252px minmax(0, 1fr) 344px;
  grid-template-rows: 50px minmax(0, 1fr) 104px;
  grid-template-areas:
    'top top top'
    'left basin right'
    'left dock right';
  background: linear-gradient(180deg, #08171f, var(--bg) 46%);
}

.topbar {
  grid-area: top;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background: var(--surface);
}

.divider {
  width: 1px;
  height: 18px;
  background: var(--border);
}

.rain-switch {
  display: flex;
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border-soft);
  color: var(--text-muted);
  font-size: var(--fs-micro);
}

.pill.is-on {
  color: var(--cyan);
  border-color: var(--cyan-line);
  background: var(--cyan-soft);
}

.nav {
  margin-left: 8px;
}

.rule {
  margin-left: auto;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}

.left {
  grid-area: left;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.bar-panel {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background: var(--surface);
  min-height: 0;
}

.bar-panel h2 {
  font-size: var(--fs-micro);
  letter-spacing: 0.14em;
  color: var(--text-dim);
  font-weight: 600;
}

.rain-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 8px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: var(--surface-1);
  text-align: left;
}

.rain-row.is-on {
  border-color: var(--cyan-line);
  background: color-mix(in srgb, var(--cyan) 8%, var(--surface-1));
}

.rain-name {
  font-size: var(--fs-xs);
  color: var(--text);
  font-weight: 600;
}

.rain-en {
  font-size: 8px;
  color: var(--text-dim);
  letter-spacing: 0.12em;
}

.rain-ch {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.rain-ch span {
  font-size: 9px;
  line-height: 13px;
  padding: 0 4px;
  border-radius: 3px;
  color: var(--teal);
  background: color-mix(in srgb, var(--teal) 12%, transparent);
  white-space: nowrap;
}

.bar-panel--flow {
  gap: 5px;
}

.topo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 4px 0 2px;
}

.topo li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.t-from {
  color: var(--text);
  min-width: 32px;
}

.t-arrow {
  position: relative;
  flex: 1;
  height: 1px;
  background: var(--cyan-line);
}

.t-arrow::after {
  content: '';
  position: absolute;
  right: 0;
  top: -2px;
  border-left: 4px solid var(--cyan);
  border-top: 2.5px solid transparent;
  border-bottom: 2.5px solid transparent;
}

.t-to {
  min-width: 32px;
  text-align: right;
  color: var(--text);
}

.t-to.sink {
  color: var(--risk);
}

.topo em {
  font-style: normal;
  font-size: 9px;
  color: var(--text-dim);
  min-width: 44px;
  text-align: right;
}

.foot-note {
  font-size: 9px;
  line-height: 1.5;
  color: var(--text-dim);
}

.basin {
  grid-area: basin;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background:
    radial-gradient(120% 90% at 30% 20%, rgba(45, 212, 191, 0.07), transparent 62%),
    var(--surface);
}

.basin-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.contours ellipse {
  fill: none;
  stroke: color-mix(in srgb, var(--teal) 32%, transparent);
  stroke-width: 0.35;
}

.grid path {
  stroke: var(--line-hair);
  stroke-width: 0.25;
}

.river {
  fill: none;
  stroke: url(#river);
  stroke-width: 5;
  stroke-linecap: round;
}

.link {
  fill: none;
  stroke: var(--cyan);
  opacity: 0.62;
  stroke-linecap: round;
}

.link.is-active {
  opacity: 0.95;
}

.puck {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 7px 4px 4px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border: 1px solid var(--border-soft);
  cursor: pointer;
  transition: border-color var(--dur-1) var(--ease), transform var(--dur-1) var(--ease);
}

.puck:hover {
  transform: translate(-50%, -50%) scale(1.03);
}

.puck-ring {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 48%, var(--border));
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}

.puck.is-zero .puck-ring {
  border-style: dashed;
  opacity: 0.72;
}

.puck.is-selected {
  border-color: color-mix(in srgb, var(--accent) 62%, var(--border));
  box-shadow: 0 0 18px -6px color-mix(in srgb, var(--accent) 70%, transparent);
}

.puck-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.puck-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-micro);
  color: var(--text);
  white-space: nowrap;
}

.puck-name b {
  color: var(--accent);
  font-size: var(--fs-tiny);
}

.puck.is-sink .puck-name::after {
  content: '汇流';
  font-size: 8px;
  color: var(--risk);
  border: 1px solid color-mix(in srgb, var(--risk) 40%, transparent);
  border-radius: 3px;
  padding: 0 3px;
}

.legend {
  position: absolute;
  left: 10px;
  bottom: 8px;
  display: flex;
  gap: 7px;
  font-size: 9px;
  color: var(--text-dim);
}

.right {
  grid-area: right;
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-height: 0;
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background: var(--surface);
}

.score-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
}

.grade {
  font-family: var(--font-num);
  font-size: var(--fs-sm);
  color: var(--amber);
  border: 1px solid color-mix(in srgb, var(--amber) 45%, transparent);
  border-radius: 4px;
  padding: 0 6px;
}

.score-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 4px 0 8px;
  border-bottom: 1px solid var(--line-hair);
}

.score {
  font-size: 44px;
  line-height: 1;
  font-weight: 700;
  color: var(--amber);
}

.score-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.score-meta em {
  font-style: normal;
  color: var(--text-dim);
}

.gauge-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 10px;
}

.gauge {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.gauge-key {
  font-size: 9px;
  color: var(--text-dim);
}

.gauge-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.mini-bar {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  overflow: hidden;
}

.mini-bar i {
  display: block;
  height: 100%;
  transition: width var(--dur-2) var(--ease);
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-micro);
}

.table th {
  text-align: left;
  font-weight: 500;
  color: var(--text-dim);
  padding: 3px 4px;
  border-bottom: 1px solid var(--line-hair);
}

.table td {
  padding: 4px;
  color: var(--text-muted);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 30%, transparent);
  cursor: pointer;
}

.table tr.is-selected td {
  color: var(--text);
  background: color-mix(in srgb, var(--cyan) 8%, transparent);
}

.table .strong {
  color: var(--text);
}

.table .up {
  color: var(--safe);
}

.table .down {
  color: var(--danger);
}

.syn h3 {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--text-dim);
  margin-bottom: 5px;
}

.syn ul {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.syn li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.syn .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border);
}

.syn li.is-on {
  color: var(--safe);
}

.syn li.is-on .dot {
  background: var(--safe);
  box-shadow: 0 0 8px 1px color-mix(in srgb, var(--safe) 55%, transparent);
}

.syn-cond {
  margin-left: auto;
  font-size: 9px;
}

.dock {
  grid-area: dock;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background: var(--surface);
}

.bars {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-content: center;
  gap: 4px 16px;
  min-width: 0;
}

.bar-row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 26px;
  align-items: center;
  gap: 7px;
}

.bar-name {
  font-size: 9px;
  color: var(--text-muted);
}

.bar-track {
  height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  overflow: hidden;
}

.bar-track i {
  display: block;
  height: 100%;
  transition: width var(--dur-2) var(--ease);
}

.bar-value {
  font-size: 9px;
  color: var(--text-muted);
  text-align: right;
}

.cta-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  width: 190px;
}

.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  height: 40px;
  border-radius: var(--r-sm);
  color: #1a1204;
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.14em;
  background: linear-gradient(180deg, #f8c565, var(--amber) 60%, #d99a2c);
  box-shadow: var(--glow-amber);
}

.cta:disabled {
  background: color-mix(in srgb, var(--surface-elevated) 90%, var(--bg));
  color: var(--text-dim);
  box-shadow: inset 0 0 0 1px var(--border-soft);
  cursor: not-allowed;
}

.cta-note {
  font-size: 9px;
  color: var(--text-dim);
  text-align: right;
  line-height: 1.4;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--text);
}

.modal-score {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.modal-score .num {
  font-size: 38px;
  font-weight: 700;
  color: var(--amber);
}

.modal-syn {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: var(--fs-micro);
  color: var(--teal);
}

.modal-syn .muted {
  color: var(--text-dim);
}

.modal-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  padding-left: 4px;
}

.modal-note {
  font-size: 9px;
  color: var(--text-dim);
  border-top: 1px dashed var(--line-hair);
  padding-top: 6px;
}
</style>

<style>
.c-modal.n-card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
}

.c-modal .n-card-header__main,
.c-modal .n-card__content {
  color: var(--text) !important;
}
</style>
