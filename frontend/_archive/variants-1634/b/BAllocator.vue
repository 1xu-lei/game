<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus, SlidersHorizontal, TriangleAlert } from 'lucide-vue-next'
import { SCENARIOS } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import LevelPips from '@/components/shared/LevelPips.vue'
import SceneThumb from '@/components/shared/SceneThumb.vue'
import type { SceneId } from '@/types'

/**
 * B 版悬浮资源分配卡：五行紧凑分配器，贴右侧、垂直居中偏上。
 * 非法操作给出「为什么不能」的具体原因，不做静默禁用。
 */
const store = useGameStore()

const rows = computed(() =>
  SCENARIOS.map((scene) => {
    const result = store.preview.scenarioResults.find((r) => r.sceneId === scene.id)!
    return { scene, result, incReason: store.incBlockReason(scene.id) }
  }),
)

const accentOf = (id: SceneId) => `var(${SCENARIOS.find((s) => s.id === id)!.accentVar})`
</script>

<template>
  <aside class="alloc" aria-label="资源分配">
    <header class="head">
      <SlidersHorizontal :size="13" :stroke-width="1.9" />
      <h2>资源分配</h2>
      <span class="mono budget">共 5 点</span>
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
        <span class="thumb"><SceneThumb :scene-id="scene.id" /></span>

        <span class="meta">
          <span class="name">{{ scene.name }}</span>
          <span class="direction">{{ scene.direction }}</span>
        </span>

        <span class="stepper" @click.stop>
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
        </span>

        <LevelPips :value="result.invested" :accent="accentOf(scene.id)" size="xs" />
      </li>
    </ul>

    <footer class="foot">
      <div class="budget-line">
        <span class="lbl">已分配</span>
        <span class="total num" :class="{ 'is-ok': store.total === 5 }">{{ store.total }} / 5</span>
        <span class="rest">
          剩余
          <b class="num" :class="{ 'is-warn': store.remaining > 0 }">{{ store.remaining }}</b>
        </span>
      </div>
      <p class="reason" :class="{ 'is-ok': store.canSimulate }">
        <TriangleAlert v-if="!store.canSimulate" :size="11" :stroke-width="2.2" />
        <template v-if="store.canSimulate">5 点已全部分配，可以推演</template>
        <template v-else>{{ store.validationMessage }}</template>
      </p>
    </footer>
  </aside>
</template>

<style scoped>
.alloc {
  position: absolute;
  top: 50%;
  right: 12px;
  z-index: 3;
  width: 316px;
  transform: translateY(-54%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-panel);
}

.head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--cyan);
}

.head h2 {
  font-size: var(--fs-xs);
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
}

.row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
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
  border-color: color-mix(in srgb, var(--accent) 58%, var(--border));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface-1));
}

.row.is-zero {
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
}

.row.is-zero .name {
  color: var(--text-muted);
}

.thumb {
  display: block;
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
  overflow: hidden;
  border: 1px solid var(--border-soft);
}

.thumb :deep(img) {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 0;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.direction {
  font-size: 9px;
  line-height: 13px;
  padding: 0 4px;
  align-self: flex-start;
  border-radius: 3px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  white-space: nowrap;
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
  width: 20px;
  height: 20px;
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
  min-width: 14px;
  text-align: center;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text);
}

.value.is-empty {
  color: var(--text-dim);
}

.foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--line-hair);
}

.budget-line {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.lbl {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.total {
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text-muted);
}

.total.is-ok {
  color: var(--safe);
}

.rest {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  white-space: nowrap;
}

.rest .num {
  color: var(--text);
}

.rest .num.is-warn {
  color: var(--amber);
}

.reason {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: var(--fs-micro);
  line-height: 1.5;
  color: var(--amber);
}

.reason.is-ok {
  color: var(--safe);
}
</style>
