<script setup lang="ts">
import { Lightbulb } from 'lucide-vue-next'
import type { Explanation } from '@/types'

interface Props {
  explanations: Explanation[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), { title: '为什么是这个结果' })
</script>

<template>
  <section class="panel explain">
    <header class="panel-head">
      <span class="ico-chip is-amber"><Lightbulb :size="13" /></span>
      <span class="panel-label">{{ props.title }}</span>
      <span class="panel-meta">{{ props.explanations.length }} 条因果解释</span>
    </header>

    <div class="explain-body">
      <article v-for="(item, index) in props.explanations" :key="item.title" class="explain-item">
        <span class="explain-index num">{{ index + 1 }}</span>
        <div class="explain-main">
          <h4>{{ item.title }}</h4>
          <p>{{ item.body }}</p>
          <code class="explain-evidence">{{ item.evidence }}</code>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.explain {
  min-height: 0;
}

.explain-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  overflow: auto;
}

.explain-item {
  display: flex;
  gap: 9px;
  padding: 8px 9px;
  background: color-mix(in srgb, var(--surface-elevated) 38%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
}

.explain-index {
  display: grid;
  flex: none;
  place-items: center;
  width: 18px;
  height: 18px;
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--amber);
  background: var(--amber-soft);
  border-radius: var(--r-pill);
}

.explain-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.explain-main h4 {
  font-size: var(--fs-xs);
  letter-spacing: 0.02em;
  color: var(--text);
}

.explain-main p {
  font-size: var(--fs-tiny);
  line-height: 1.55;
  color: var(--text-muted);
}

.explain-evidence {
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  color: var(--text-dim);
  word-break: break-all;
}
</style>
