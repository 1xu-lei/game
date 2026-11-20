<script setup lang="ts">
import { computed } from 'vue'
import { Activity, CloudRain, Minus, Play, Plus, TriangleAlert, Waves } from 'lucide-vue-next'
import { RAIN_TYPES, SCENARIOS, SCENARIO_MAP } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import { useSimulationStore } from '@/stores/simulation'
import { useUiStore } from '@/stores/ui'
import type { SceneId } from '@/types'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'
import LevelPips from '@/components/shared/LevelPips.vue'
import SceneThumb from '@/components/shared/SceneThumb.vue'
import ScoreRing from '@/components/shared/ScoreRing.vue'
import ImpactChart from '@/components/shared/ImpactChart.vue'

/** B 版悬浮 HUD（叠在全屏城市之上）：顶部条 / 右侧分配卡 / 底部舱。全部只读 store.preview。 */
const store = useGameStore()
const sim = useSimulationStore()
const ui = useUiStore()

const accentOf = (id: SceneId) => `var(${SCENARIO_MAP[id].accentVar})`
const rows = computed(() =>
  SCENARIOS.map((scene) => ({
    scene,
    result: store.preview.scenarioResults.find((r) => r.sceneId === scene.id)!,
    incReason: store.incBlockReason(scene.id),
  })),
)
const rings = computed(() =>
  store.preview.scenarioResults.map((r) => ({
    id: r.sceneId as SceneId,
    name: SCENARIO_MAP[r.sceneId].name,
    value: r.effective,
    accent: `var(${SCENARIO_MAP[r.sceneId].accentVar})`,
  })),
)
</script>

<template>
  <div class="chrome">
    <header class="top">
      <BrandMark size="sm" />
      <span class="sep" />
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
      <div class="nav"><TopNav :active="ui.nav" density="icons" @select="ui.setNav" /></div>
      <span class="status"><i class="dot" />科学规划 · 从容应对每一场暴雨</span>
      <span class="rule mono">{{ store.preview.rulesVersion }}</span>
      <button type="button" class="pill" :class="{ 'is-on': store.rainLayerOn }" @click="store.rainLayerOn = !store.rainLayerOn">
        <Waves :size="12" :stroke-width="2" />
        雨层
      </button>
    </header>

    <aside class="alloc">
      <div class="alloc-head"><span>资源分配</span><span class="mono">共 5 点</span></div>
      <div
        v-for="{ scene, result, incReason } in rows"
        :key="scene.id"
        class="row"
        :class="{ 'is-selected': store.selectedScene === scene.id, 'is-zero': result.invested === 0 }"
        :style="{ '--accent': accentOf(scene.id) }"
        @mouseenter="store.setHover(scene.id)"
        @mouseleave="store.setHover(null)"
        @click="store.selectScene(scene.id)"
      >
        <SceneThumb :scene-id="scene.id" />
        <div class="meta">
          <div class="meta-top">
            <span class="name">{{ scene.name }}</span>
            <span class="dir">{{ scene.direction }}</span>
          </div>
          <LevelPips :value="result.invested" :accent="accentOf(scene.id)" size="xs" />
        </div>
        <div class="stepper" @click.stop>
          <button type="button" :disabled="result.invested <= 0" @click="store.decrease(scene.id)">
            <Minus :size="11" :stroke-width="2.6" />
          </button>
          <b class="num">{{ result.invested }}</b>
          <button type="button" :disabled="!!incReason" :title="incReason ?? ''" @click="store.increase(scene.id)">
            <Plus :size="11" :stroke-width="2.6" />
          </button>
        </div>
      </div>
      <footer class="alloc-foot">
        <div class="sum">
          <span>已分配 <b class="num" :class="{ ok: store.total === 5 }">{{ store.total }}/5</b></span>
          <span class="mono">剩余 {{ store.remaining }}</span>
          <div class="macro">
            <button type="button" @click.stop="store.fillBalanced()">均衡</button>
            <i class="mdot" />
            <button type="button" @click.stop="store.reset()">清空</button>
          </div>
        </div>
        <p class="reason" :class="{ ok: store.canSimulate }">
          <TriangleAlert v-if="!store.canSimulate" :size="10" :stroke-width="2.2" />
          {{ store.canSimulate ? '5 点已分配，可以推演' : store.validationMessage }}
        </p>
      </footer>
    </aside>

    <section class="dock">
      <div class="rings">
        <ScoreRing v-for="r in rings" :key="r.id" :value="r.value" :label="r.name" :accent="r.accent" :size="46" />
      </div>
      <div class="chart">
        <div class="chart-head">
          <Activity :size="11" :stroke-width="2" />城市状态预测
          <span class="mono">积水 {{ store.preview.riskMetrics.waterlogRisk }} · 损失 {{ store.preview.riskMetrics.lossRisk }}</span>
        </div>
        <ImpactChart :points="store.preview.forecast" :height="62" :legend="false" compact />
      </div>
      <div class="cta-col">
        <button
          type="button"
          class="cta"
          :disabled="!store.canSimulate || sim.loading"
          @click="sim.run()"
        >
          <Play :size="16" :stroke-width="2.4" />{{ sim.loading ? '推演中…' : '开始推演' }}
        </button>
        <span class="cta-note">
          {{
            sim.error
              ? sim.error
              : store.canSimulate
                ? `预期韧性 ${store.preview.overallScore} · ${store.preview.grade} 级`
                : '完成 5 点分配后可推演'
          }}
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.chrome {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.chrome > * {
  pointer-events: auto;
}

.top {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, #061019 78%, transparent);
  border: 1px solid var(--border-soft);
}

.sep {
  width: 1px;
  height: 16px;
  background: var(--border);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border-soft);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  white-space: nowrap;
}

.pill.is-on {
  color: var(--cyan);
  border-color: var(--cyan-line);
  background: var(--cyan-soft);
}

.nav {
  margin-left: auto;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--safe);
}

.rule {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.alloc {
  position: absolute;
  top: 62px;
  right: 10px;
  width: 292px;
  max-height: calc(100vh - 200px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--surface) 95%, transparent);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-panel);
}

.alloc-head {
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 3px 4px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  cursor: pointer;
}

.row:hover {
  border-color: var(--border-strong);
}

.row.is-selected {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.row.is-zero {
  opacity: 0.82;
}

.row :deep(img) {
  width: 34px;
  height: 34px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.meta-top {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.name {
  font-size: var(--fs-xs);
  color: var(--text);
  font-weight: 600;
}

.dir {
  font-size: 8px;
  color: var(--accent);
  padding: 0 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  white-space: nowrap;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 1px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
}

.stepper button {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  color: var(--text-muted);
}

.stepper button:hover:not(:disabled) {
  background: var(--cyan-soft);
  color: var(--cyan);
}

.stepper button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper b {
  min-width: 14px;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text);
}

.alloc-foot {
  padding-top: 5px;
  border-top: 1px solid var(--line-hair);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sum {
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.sum .ok {
  color: var(--safe);
}

.macro {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-left: auto;
}

.macro button {
  font-size: var(--fs-micro);
  color: var(--text-muted);
  transition: color var(--dur-1) var(--ease);
}

.macro button:hover {
  color: var(--cyan);
}

.mdot {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--border);
}

.reason {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  line-height: 1.4;
  color: var(--amber);
}

.reason.ok {
  color: var(--safe);
}

.dock {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  min-height: 92px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, #061019 84%, transparent);
  border: 1px solid var(--border-soft);
}

.rings {
  display: flex;
  gap: 10px;
}

.chart {
  min-width: 0;
  overflow: hidden;
}

.chart-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.06em;
}

.chart-head .mono {
  margin-left: auto;
}

.cta-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  width: 164px;
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
  background: color-mix(in srgb, var(--surface-elevated) 88%, var(--bg));
  color: var(--text-dim);
  box-shadow: inset 0 0 0 1px var(--border-soft);
  cursor: not-allowed;
}

.cta-note {
  font-size: 9px;
  color: var(--text-dim);
}

.modal {
  display: flex;
  flex-direction: column;
  gap: 9px;
  color: var(--text);
}

.modal-score {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.modal-score .num {
  font-size: 36px;
  font-weight: 700;
  color: var(--amber);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: var(--fs-micro);
  color: var(--teal);
}

.chips li {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.chips .muted {
  color: var(--text-dim);
}

.events {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  padding-left: 4px;
}

.note {
  font-size: 9px;
  color: var(--text-dim);
  border-top: 1px dashed var(--line-hair);
  padding-top: 6px;
}
</style>

<style>
.b-modal.n-card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
}

.b-modal .n-card-header__main,
.b-modal .n-card__content {
  color: var(--text) !important;
}
</style>
