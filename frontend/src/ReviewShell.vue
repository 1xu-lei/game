<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { VariantId } from '@/types'
import { useGameStore } from '@/stores/game'
import { useSimulationStore } from '@/stores/simulation'
import { useUiStore } from '@/stores/ui'
import DeckA from '@/variants/a/DeckA.vue'
import BStage from '@/variants/b/BStage.vue'
import BChrome from '@/variants/b/BChrome.vue'
import InstrumentC from '@/variants/c/InstrumentC.vue'
import SimulationOverlay from '@/views/SimulationOverlay.vue'
import ResultScreen from '@/views/ResultScreen.vue'
import HistoryPanel from '@/components/panels/HistoryPanel.vue'
import RankPanel from '@/components/panels/RankPanel.vue'
import SettingsPanel from '@/components/panels/SettingsPanel.vue'
import PkPanel from '@/components/panels/PkPanel.vue'
import SceneDetailPanel from '@/components/panels/SceneDetailPanel.vue'

/**
 * 入口外壳（index.html → main.ts 直接挂载此组件）
 * ---------------------------------------------------------------
 * 三个设计版本共用同一套 tokens / game store / 规则引擎，只更换信息架构与视觉组织：
 *   A · 雨夜指挥台 —— 三栏 HUD，最接近参考图，信息密度最高
 *   B · 沉浸全景   —— 城市铺满全屏，HUD 悬浮，最沉浸
 *   C · 水文仪     —— 平面流域示意图 + 仪表读数，最可解释
 * 切换用于评审，不进入游戏流程；支持 ?v=a|b|c 与键盘 1/2/3。
 *
 * 主流程压在版本之上（与版本无关，三个版本共用）：
 *   规划 → 推演过程（SimulationOverlay）→ 结算（ResultScreen）
 * 顶部导航的历史记录 / 排行榜 / 设置打开对应侧栏，不改动版本本身。
 * 点击任意版本的场景节点 / 分配行 → 场景详情抽屉（SceneDetailPanel，规格书 §5.5）。
 */
const VARIANTS: { id: VariantId; name: string; note: string }[] = [
  { id: 'a', name: 'A 雨夜指挥台', note: '三栏 HUD · 密度最高' },
  { id: 'b', name: 'B 沉浸全景', note: '城市全屏 · 最沉浸' },
  { id: 'c', name: 'C 水文仪', note: '流域图 · 最可解释' },
]

const sim = useSimulationStore()
const ui = useUiStore()
const game = useGameStore()

const readInitial = (): VariantId => {
  const q = new URLSearchParams(location.search).get('v')
  if (q === 'a' || q === 'b' || q === 'c') return q
  const saved = localStorage.getItem('rc-variant')
  return saved === 'b' || saved === 'c' ? saved : 'a'
}

const current = ref<VariantId>(readInitial())

watch(current, (v) => {
  localStorage.setItem('rc-variant', v)
  const url = new URL(location.href)
  url.searchParams.set('v', v)
  history.replaceState(null, '', url)
})

/** 面板互斥：任一侧栏打开时关闭其它面板由 ui.nav 单值天然保证 */
function closePanel(): void {
  ui.close()
}

/** 场景详情抽屉：与导航侧栏互斥（ui.nav 默认 'plan' 表示没有侧栏），打开侧栏时收起详情 */
watch(
  () => ui.nav,
  (nav) => {
    if (nav !== 'plan') game.selectScene(null)
  },
)

function closeSceneDetail(): void {
  game.selectScene(null)
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) return
  if (e.key === 'Escape') {
    if (game.selectedScene) {
      closeSceneDetail()
      return
    }
    closePanel()
  }
  if (e.key === '1') current.value = 'a'
  if (e.key === '2') current.value = 'b'
  if (e.key === '3') current.value = 'c'
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <DeckA v-if="current === 'a'" />
  <div v-else-if="current === 'b'" class="b-layer">
    <BStage />
    <BChrome />
  </div>
  <InstrumentC v-else />

  <SimulationOverlay v-if="sim.phase === 'running'" />
  <ResultScreen v-if="sim.phase === 'result'" />

  <SceneDetailPanel
    v-if="game.selectedScene && sim.phase === 'plan' && ui.nav === 'plan'"
    :scene-id="game.selectedScene"
    @close="closeSceneDetail"
  />

  <HistoryPanel v-if="ui.nav === 'history'" @close="closePanel" />
  <PkPanel v-if="ui.nav === 'pk'" @close="closePanel" />
  <RankPanel v-if="ui.nav === 'rank'" @close="closePanel" />
  <SettingsPanel v-if="ui.nav === 'settings'" @close="closePanel" />

  <div v-if="sim.phase === 'plan'" class="review" role="group" aria-label="设计版本评审切换">
    <span class="review-label mono">DESIGN REVIEW</span>
    <button
      v-for="v in VARIANTS"
      :key="v.id"
      type="button"
      class="review-btn"
      :class="{ 'is-active': current === v.id }"
      :title="`${v.name} — ${v.note}`"
      @click="current = v.id"
    >
      {{ v.id.toUpperCase() }}
    </button>
    <span class="review-note">{{ VARIANTS.find((v) => v.id === current)?.note }}</span>
  </div>
</template>

<style scoped>
.b-layer {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.review {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 5px 10px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, #04101b 88%, transparent);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-panel);
  opacity: 0.9;
  transition: opacity var(--dur-2) var(--ease);
}

.review:hover {
  opacity: 1;
}

.review-label {
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--text-dim);
}

.review-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  border: 1px solid var(--border-soft);
  transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease),
    border-color var(--dur-1) var(--ease);
}

.review-btn:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.review-btn.is-active {
  color: #04111d;
  background: var(--amber);
  border-color: var(--amber);
}

.review-note {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.04em;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
