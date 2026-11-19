<script setup lang="ts">
import { computed } from 'vue'
import { Coins, Minus, Plus } from 'lucide-vue-next'
import ResourceBudgetBar from './ResourceBudgetBar.vue'
import { stageLabelOf } from '@/engine/previewEngine'
import { assetUrl, useSceneVisuals } from '@/composables/useSceneVisuals'
import { TOTAL_POINTS } from '@/config/sites'
import { useAllocationStore } from '@/stores/allocation'
import { useScenarioStore } from '@/stores/scenario'

const allocation = useAllocationStore()
const scenario = useScenarioStore()
const { iconOf, accentOf } = useSceneVisuals()

const rows = computed(() =>
  scenario.scenarios.map((scene) => ({
    scene,
    level: allocation.allocation[scene.id],
    accent: accentOf(scene.id),
  })),
)

const canIncrease = (level: number) => level < TOTAL_POINTS && !allocation.isFull
</script>

<template>
  <section class="panel allocator">
    <header class="panel-head">
      <span class="ico-chip is-amber"><Coins :size="13" /></span>
      <span class="panel-label">资源分配（共 {{ TOTAL_POINTS }} 点）</span>
      <span class="panel-meta">每场景 0–5 整数</span>
    </header>

    <div class="alloc-list scroll-y">
      <div
        v-for="row in rows"
        :key="row.scene.id"
        class="alloc-row"
        :class="{ 'is-active': scenario.selectedScene === row.scene.id, 'is-zero': row.level === 0 }"
        :style="{ '--accent': row.accent }"
      >
        <button
          type="button"
          class="row-thumb"
          :aria-label="`查看${row.scene.name}详情`"
          @click="scenario.selectScene(row.scene.id)"
        >
          <img :src="assetUrl(row.scene.asset)" :alt="row.scene.name" loading="lazy" />
        </button>

        <div class="row-main">
          <div class="row-title">
            <component :is="iconOf(row.scene.id)" :size="12" />
            <strong>{{ row.scene.name }}</strong>
            <span class="row-dir">{{ row.scene.direction }}</span>
          </div>
          <div class="mini-bar row-bar" :style="{ '--bar-color': row.accent }">
            <i :style="{ width: `${(row.level / TOTAL_POINTS) * 100}%` }" />
          </div>
          <div class="row-meta">
            <span class="row-stage" :class="{ 'is-zero': row.level === 0 }">
              {{ stageLabelOf(row.level) }}
            </span>
            <span class="row-project">{{ row.scene.project }}</span>
          </div>
        </div>

        <div class="stepper">
          <button
            type="button"
            :disabled="row.level === 0"
            :aria-label="`${row.scene.name}减少 1 点`"
            @click="allocation.decrement(row.scene.id)"
          >
            <Minus :size="12" />
          </button>
          <span class="stepper-value num">{{ row.level }}</span>
          <button
            type="button"
            :disabled="!canIncrease(row.level)"
            :aria-label="`${row.scene.name}增加 1 点`"
            @click="allocation.increment(row.scene.id)"
          >
            <Plus :size="12" />
          </button>
        </div>
      </div>
    </div>

    <ResourceBudgetBar
      :used="allocation.used"
      :total="TOTAL_POINTS"
      :valid="allocation.isValid"
      :message="allocation.validationMessage"
      @reset="allocation.reset()"
    />
  </section>
</template>

<style scoped>
.allocator {
  flex: 1;
  min-height: 0;
}

.alloc-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 8px;
}

.alloc-row {
  display: flex;
  flex: none;
  gap: 9px;
  align-items: center;
  padding: 7px 8px;
  background: color-mix(in srgb, var(--surface-elevated) 40%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  transition:
    border-color var(--dur-1) var(--ease),
    background var(--dur-1) var(--ease);
}

.alloc-row:hover {
  background: color-mix(in srgb, var(--surface-elevated) 66%, transparent);
  border-color: var(--border);
}

.alloc-row.is-active {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
}

.alloc-row.is-zero {
  border-style: dashed;
}

.row-thumb {
  flex: none;
  width: 44px;
  height: 38px;
  padding: 0;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-sm);
}

.row-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.94;
}

.row-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
}

.row-title strong {
  font-size: var(--fs-xs);
  letter-spacing: 0.02em;
  color: var(--text);
}

.row-dir {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.row-bar {
  height: 3px;
}

.row-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.row-stage {
  flex: none;
  font-size: var(--fs-micro);
  color: var(--accent);
}

.row-stage.is-zero {
  color: var(--text-dim);
}

.row-project {
  overflow: hidden;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stepper {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-sm);
}

.stepper button {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  border-radius: 4px;
  transition:
    color var(--dur-1) var(--ease),
    background var(--dur-1) var(--ease);
}

.stepper button:hover:not(:disabled) {
  color: var(--bg);
  background: var(--accent);
}

.stepper button:disabled {
  color: color-mix(in srgb, var(--text) 18%, transparent);
  cursor: not-allowed;
}

.stepper-value {
  width: 14px;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
  text-align: center;
}
</style>
