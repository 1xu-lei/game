<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-vue-next'
import { useSceneVisuals } from '@/composables/useSceneVisuals'
import type { ScenarioResult } from '@/types'

interface Props {
  /** 五场景分项结果：0 点场景同样返回，禁止隐藏 */
  results: ScenarioResult[]
}

const props = defineProps<Props>()
const { iconOf, accentOf } = useSceneVisuals()

const rows = computed(() =>
  props.results.map((item) => ({
    ...item,
    icon: iconOf(item.sceneId),
    accent: accentOf(item.sceneId),
    arrow: item.deltaValue > 0 ? ArrowUpRight : item.deltaValue < 0 ? ArrowDownRight : Minus,
    deltaTone: item.deltaValue > 0 ? 'is-up' : item.deltaValue < 0 ? 'is-down' : 'is-flat',
  })),
)
</script>

<template>
  <section class="panel breakdown">
    <header class="panel-head">
      <span class="panel-label">五场景分项</span>
      <span class="panel-meta">有效安全度 / 上下游汇流</span>
    </header>

    <div class="breakdown-body scroll-y">
      <article
        v-for="row in rows"
        :key="row.sceneId"
        class="row"
        :class="{ 'is-zero': row.invested === 0 }"
        :style="{ '--accent': row.accent }"
      >
        <div class="row-head">
          <span class="row-icon"><component :is="row.icon" :size="12" /></span>
          <strong class="row-name">{{ row.sceneName }}</strong>
          <span class="tag">{{ row.invested === 0 ? '无专项投入' : `${row.invested} 点 · ${row.stageLabel}` }}</span>
          <span class="row-delta" :class="row.deltaTone">
            <component :is="row.arrow" :size="10" />
            {{ row.deltaText }}
          </span>
        </div>

        <div class="row-metric">
          <span class="metric-key">有效安全度</span>
          <span class="metric-bar mini-bar">
            <i :style="{ width: `${row.effective}%` }" />
          </span>
          <span class="metric-val num">{{ row.effective }}</span>
        </div>

        <div class="row-foot">
          <span class="mono">本地防护 {{ row.coverage }}</span>
          <span class="mono">上游来水 {{ row.inflow }}</span>
          <span class="mono">排往下游 {{ row.outflow }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.breakdown {
  flex: 1;
  min-height: 0;
}

.breakdown-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px 12px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 9px;
  background: color-mix(in srgb, var(--surface-elevated) 30%, transparent);
  border: 1px solid var(--border-soft);
  border-left: 2px solid var(--accent);
  border-radius: var(--r-sm);
}

.row.is-zero {
  border-left-color: color-mix(in srgb, var(--border) 80%, transparent);
}

.row-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.row-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 5px;
}

.row-name {
  font-size: var(--fs-xs);
  color: var(--text);
}

.row-delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  font-size: var(--fs-micro);
}

.row-delta.is-up {
  color: var(--safe);
}

.row-delta.is-down {
  color: var(--risk);
}

.row-delta.is-flat {
  color: var(--text-dim);
}

.row-metric {
  display: flex;
  align-items: center;
  gap: 7px;
}

.metric-key {
  flex: none;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.metric-bar {
  flex: 1;
  --bar-color: var(--accent);
}

.metric-val {
  flex: none;
  width: 24px;
  font-size: var(--fs-xs);
  text-align: right;
  color: var(--text);
}

.row-foot {
  display: flex;
  gap: 10px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}
</style>
