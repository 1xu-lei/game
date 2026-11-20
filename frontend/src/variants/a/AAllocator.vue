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
 * 非法操作给出「为什么不能」的文案；0 点场景保留在列表中，只是标注「无专项投入」。
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
  <section class="panel alloc">
    <header class="panel-head">
      <span class="ico-chip"><SlidersHorizontal :size="13" :stroke-width="1.9" /></span>
      <span class="panel-label">资源分配</span>
      <span class="panel-meta">共 5 点 · 每场景 0–5</span>
    </header>

    <ul class="rows">
      <li
        v-for="{ scene, result, incReason } in rows"
        :key="scene.id"
        class="row"
        :class="{ 'is-selected': store.selectedScene === scene.id, 'is-zero': result.invested === 0 }"
        :style="{ '--accent': accentOf(scene.id) }"
        :title="`${scene.name} · 点击查看场景详情`"
        @mouseenter="store.setHover(scene.id)"
        @mouseleave="store.setHover(null)"
        @click="store.selectScene(scene.id)"
      >
        <SceneThumb :scene-id="scene.id" />

        <div class="meta">
          <div class="meta-row">
            <span class="name">{{ scene.name }}</span>
            <span class="dir">{{ scene.direction }}</span>
          </div>
          <div class="meta-row">
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
          <span class="value num">{{ result.invested }}</span>
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

    <footer class="foot">
      <div class="budget">
        <span class="budget-label">已分配</span>
        <span class="budget-value num" :class="{ 'is-ok': store.total === 5 }">{{ store.total }} / 5</span>
        <span class="remain num" :class="{ 'is-warn': store.remaining > 0 }">剩余 {{ store.remaining }}</span>
      </div>
      <p class="reason" :class="{ 'is-ok': store.canSimulate }">
        <TriangleAlert v-if="!store.canSimulate" :size="11" :stroke-width="2.2" />
        {{ store.canSimulate ? '5 点已全部分配，可以推演' : store.validationMessage }}
      </p>
      <div class="macro">
        <button type="button" class="link" @click="store.fillBalanced()">均衡方案</button>
        <i class="dot" />
        <button type="button" class="link" @click="store.reset()">清空</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.alloc {
  min-height: 0;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 9px;
  overflow-y: auto;
  min-height: 0;
}

.row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
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
  border-color: color-mix(in srgb, var(--accent) 62%, var(--border));
  background: color-mix(in srgb, var(--accent) 9%, var(--surface-1));
}

.row.is-zero {
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
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

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.name {
  font-size: var(--fs-sm);
  font-weight: 600;
}

.dir {
  padding: 0 4px;
  font-size: 9px;
  line-height: 13px;
  border-radius: 3px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  white-space: nowrap;
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
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--bg) 48%, transparent);
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
  color: var(--cyan);
  background: var(--cyan-soft);
}

.step:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--text-dim) 72%, transparent);
}

.value {
  min-width: 18px;
  text-align: center;
  font-size: var(--fs-md);
  font-weight: 700;
}

.foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 10px;
  border-top: 1px solid var(--line-hair);
}

.budget {
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

.dot {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--border);
}
</style>
