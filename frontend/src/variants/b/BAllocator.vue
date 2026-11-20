<script setup lang="ts">
import { computed } from 'vue'
import { CloudRain, Minus, Plus } from 'lucide-vue-next'
import { SCENARIOS, RAIN_TYPES } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import SceneThumb from '@/components/shared/SceneThumb.vue'
import LevelPips from '@/components/shared/LevelPips.vue'
import type { SceneId } from '@/types'

/** B 版悬浮资源分配卡：紧凑五行，直接叠在城市上 */
const store = useGameStore()
const rows = computed(() =>
  SCENARIOS.map((scene) => ({
    scene,
    result: store.preview.scenarioResults.find((r) => r.sceneId === scene.id)!,
    incReason: store.incBlockReason(scene.id),
  })),
)
const accentOf = (id: SceneId) => `var(${SCENARIOS.find((s) => s.id === id)!.accentVar})`
</script>

<template>
  <section class="card">
    <header class="head">
      <CloudRain :size="13" :stroke-width="1.9" />
      <span class="title">资源分配</span>
      <span class="count num">{{ store.total }} / 5</span>
    </header>

    <div class="rain-switch">
      <button
        v-for="r in RAIN_TYPES"
        :key="r.id"
        type="button"
        class="pill"
        :class="{ 'is-on': store.rainType === r.id }"
        @click="store.setRain(r.id)"
      >
        {{ r.name }}
      </button>
    </div>

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
          <span class="name">{{ scene.name }}<i class="dir">{{ scene.direction }}</i></span>
          <LevelPips :value="result.invested" :accent="accentOf(scene.id)" size="xs" />
        </div>
        <div class="stepper" @click.stop>
          <button type="button" class="step" :disabled="result.invested <= 0" @click="store.decrease(scene.id)">
            <Minus :size="11" :stroke-width="2.6" />
          </button>
          <span class="value num">{{ result.invested }}</span>
          <button type="button" class="step" :disabled="!!incReason" @click="store.increase(scene.id)">
            <Plus :size="11" :stroke-width="2.6" />
          </button>
        </div>
      </li>
    </ul>

    <footer class="foot">
      <p class="reason" :class="{ 'is-ok': store.canSimulate }">
        {{ store.canSimulate ? '5 点已分完，可以推演' : store.validationMessage }}
      </p>
      <div class="macro">
        <button type="button" class="link" @click="store.fillBalanced()">均衡</button>
        <i class="dot" />
        <button type="button" class="link" @click="store.reset()">清空</button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 316px;
  padding: 10px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: color-mix(in srgb, #071523 94%, transparent);
  box-shadow: var(--shadow-lift);
}

.head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--cyan);
}

.title {
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text);
}

.count {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.rain-switch {
  display: flex;
  gap: 5px;
}

.pill {
  flex: 1;
  padding: 4px 6px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border-radius: var(--r-pill);
  border: 1px solid var(--border-soft);
  transition: all var(--dur-1) var(--ease);
}

.pill.is-on {
  color: var(--cyan);
  border-color: color-mix(in srgb, var(--cyan) 60%, var(--border));
  background: var(--cyan-soft);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 5px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  cursor: pointer;
}

.row :deep(img) {
  width: 38px;
  height: 38px;
}

.row:hover {
  border-color: var(--border-strong);
}

.row.is-selected {
  border-color: color-mix(in srgb, var(--accent) 62%, var(--border));
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: var(--fs-sm);
  font-weight: 600;
  white-space: nowrap;
}

.dir {
  font-style: normal;
  font-size: 9px;
  color: var(--accent);
}

.is-zero .name {
  color: var(--text-muted);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
}

.step {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  color: var(--text-muted);
}

.step:hover:not(:disabled) {
  color: var(--cyan);
  background: var(--cyan-soft);
}

.step:disabled {
  cursor: not-allowed;
  color: var(--text-dim);
}

.value {
  min-width: 16px;
  text-align: center;
  font-size: var(--fs-sm);
  font-weight: 700;
}

.foot {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 7px;
  border-top: 1px solid var(--line-hair);
}

.reason {
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
