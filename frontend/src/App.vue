<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { VariantId } from '@/types'
import DeckA from '@/variants/a/DeckA.vue'
import ImmersiveB from '@/variants/b/ImmersiveB.vue'
import InstrumentC from '@/variants/c/InstrumentC.vue'

/**
 * 设计评审外壳
 * ---------------------------------------------------------------
 * 三个版本共用同一套 token / store / 预览引擎，只更换信息架构与视觉组织方式：
 *   A · 雨夜指挥台 —— 三栏 HUD，最接近参考图，信息密度最高
 *   B · 沉浸全景   —— 城市铺满全屏，HUD 悬浮，最沉浸
 *   C · 水文仪     —— 平面流域示意图 + 仪表化读数，最专业可解释
 * 版本切换只用于评审，不计入游戏流程。URL 支持 ?v=a|b|c，键盘 1/2/3 可切。
 */
const VARIANTS: { id: VariantId; name: string; note: string }[] = [
  { id: 'a', name: 'A 雨夜指挥台', note: '三栏 HUD · 信息密度最高' },
  { id: 'b', name: 'B 沉浸全景', note: '城市铺满全屏 · 最沉浸' },
  { id: 'c', name: 'C 水文仪', note: '流域示意 · 最专业可解释' },
]

const readInitial = (): VariantId => {
  const fromQuery = new URLSearchParams(location.search).get('v')
  if (fromQuery === 'a' || fromQuery === 'b' || fromQuery === 'c') return fromQuery
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

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) return
  if (e.key === '1') current.value = 'a'
  if (e.key === '2') current.value = 'b'
  if (e.key === '3') current.value = 'c'
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <DeckA v-if="current === 'a'" />
  <ImmersiveB v-else-if="current === 'b'" />
  <InstrumentC v-else />

  <div class="review" role="group" aria-label="设计版本评审切换">
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
.review {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 5px 10px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, #04101b 82%, transparent);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(6px);
  opacity: 0.42;
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
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1px solid var(--border-soft);
  transition: all var(--dur-1) var(--ease);
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
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
