<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus, SlidersHorizontal, TriangleAlert } from 'lucide-vue-next'
import { SCENARIOS } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import LevelPips from '@/components/shared/LevelPips.vue'
import SceneThumb from '@/components/shared/SceneThumb.vue'
import type { SceneId } from '@/types'

/**
 * A 版右栏分配器：五行（缩略图 / 名称 / 投资方向 / − 点数 + / 档位灯条）
 * 非法操作一律给出「为什么不能」的文案，不做静默禁用。
 */
const store = useGameStore()

const rows = computed(() =>
  SCENARIOS.map((scene) => {
    const result = store.preview.scenarioResults.find((r) => r.sceneId === scene.id)!
    return {
      scene,
      result,
      incReason: store.incBlockReason(scene.id),
      decReason: store.decBlockReason(scene.id),
    }
  }),
)

const accentOf = (id: SceneId) => `var(${SCENARIOS.find((s) => s.id === id)!.accentVar})`
const reason = computed(() => store.validationMessage)
</script>

<template>
  <div class="rail rail--right">
    <section class="alloc">
      <header class="alloc-head">
        <SlidersHorizontal :size="14" :stroke-width="1.9" />
        <h2>资源分配</h2>
        <span class="budget mono">共 5 点</span>
      </header>

      <ul class="rows">
        <li
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
              <span class="direction">{{ scene.direction }}</span>
            </div>
            <div class="meta-bottom">
              <LevelPips :value="result.invested" :accent="accentOf(scene.id)" size="xs" />
              <span class="stage">{{ result.stageLabel }}</span>
            </div>
          </div>

          <div class="stepper" @click.stop>
            <button
              type="button"
              class="step"
              :disabled="result.invested <= 0"
              :title="store.decBlockReason(scene.id) ?? '减少 1 点'"
              @click="store.decrease(scene.id)"
            >
              <Minus :size="12" :stroke-width="2.4" />
            </button>
            <span class="value num" :class="{ 'is-empty': result.invested === 0 }">{{ result.invested }}</span>
            <button
              type="button"
              class="step"
              :disabled="!!incReason"
              :title="incReason ?? '增加 1 点'"
              @click="store.increase(scene.id)"
            >
              <Plus :size="12" :stroke-width="2.4" />
            </button>
          </div>
        </li>
      </ul>

      <footer class="alloc-foot">
        <div class="budget-line">
          <span class="budget-label">已分配</span>
          <span class="budget-value num" :class="{ 'is-ok': store.total === 5 }">{{ store.total }} / 5</span>
          <span class="remain num" :class="{ 'is-warn': store.remaining > 0 }">
            剩余 {{ store.remaining }}
          </span>
        </div>
        <p class="reason" :class="{ 'is-ok': store.canSimulate }">
          <TriangleAlert v-if="!store.canSimulate" :size="11" :stroke-width="2.2" />
          <template v-if="store.canSimulate">5 点已全部分配，可以推演</template>
          <template v-else>{{ reason }}</template>
        </p>
        <div class="macro">
          <button type="button" class="link" @click="store.fillBalanced()">均衡方案</button>
          <span class="dot-sep" />
          <button type="button" class="link" @click="store.reset()">清空</button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.rail--right {
  display: flex;
  min-height: 0;
}

.alloc {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-panel);
}

.alloc-head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--cyan);
}

.alloc-head h2 {
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text);
}

.budget {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  background: var(--surface-1);
  cursor: pointer;
  transition: border-color var(--dur-1) var(--ease), background var(--dur-1) var(--ease);
}

.row:hover {
  border-color: var(--border-strong);
}

.row.is-selected {
  border-color: color-mix(in srgb, var(--accent) 60%, var(--border));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface-1));
}

.row.is-zero {
  background: color-mix(in srgb, var(--surface) 92%, var(--bg));
}

.row.is-zero .name {
  color: var(--text-muted);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.meta-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.name {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
}

.direction {
  font-size: 9px;
  color: var(--accent);
  opacity: 0.9;
  padding: 0 4px;
  line-height: 13px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  white-space: nowrap;
}

.meta-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stage {
  font-size: var(--fs-micro);
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--r-sm);
  background: color-mix(in srgb, var(--bg) 46%, transparent);
  border: 1px solid var(--border-soft);
}

.step {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  color: var(--text-muted);
  transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
}

.step:hover:not(:disabled) {
  background: var(--cyan-soft);
  color: var(--cyan);
}

.step:disabled {
  color: color-mix(in srgb, var(--text-dim) 70%, transparent);
  cursor: not-allowed;
}

.value {
  min-width: 18px;
  text-align: center;
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text);
}

.value.is-empty {
  color: var(--text-dim);
}

.alloc-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--line-hair);
}

.budget-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.budget-label {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.budget-value {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--text-muted);
}

.budget-value.is-ok {
  color: var(--safe);
}

.remain {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.remain.is-warn {
  color: var(--amber);
}

.reason {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-micro);
  line-height: 1.5;
  color: var(--amber);
}

.reason.is-ok {
  color: var(--safe);
}

.macro {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link {
  font-size: var(--fs-micro);
  color: var(--text-muted);
  transition: color var(--dur-1) var(--ease);
}

.link:hover {
  color: var(--cyan);
}

.dot-sep {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--border);
}
</style>
