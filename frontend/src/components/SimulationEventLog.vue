<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Radio } from 'lucide-vue-next'
import type { SimulationEvent } from '@/types'

interface Props {
  /** 事件来自结果快照，由后端/引擎生成，组件只按 step 顺序渲染 */
  events: SimulationEvent[]
  /** 播放中才显示实时指示灯 */
  live?: boolean
}

const props = withDefaults(defineProps<Props>(), { live: false })

const listEl = ref<HTMLDivElement | null>(null)

watch(
  () => props.events.length,
  async () => {
    await nextTick()
    listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <section class="panel event-log">
    <header class="panel-head">
      <span class="ico-chip" :class="{ 'is-amber': props.live }"><Radio :size="13" /></span>
      <span class="panel-label">事件日志</span>
      <span class="panel-meta">{{ props.events.length }} 条</span>
    </header>

    <div ref="listEl" class="log-body scroll-y">
      <p v-if="props.events.length === 0" class="hint log-empty">
        推演开始后，这里按步骤记录每一个实际触发的环节。
      </p>

      <article
        v-for="item in props.events"
        :key="item.index"
        class="log-item"
        :class="`is-${item.tone}`"
      >
        <span class="log-step">{{ item.stepLabel }}</span>
        <span class="log-text">{{ item.text }}</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.event-log {
  min-height: 0;
}

.log-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px 12px;
}

.log-empty {
  padding: 6px 2px;
}

.log-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 6px 8px;
  background: color-mix(in srgb, var(--surface-elevated) 28%, transparent);
  border-left: 2px solid var(--border);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}

.log-step {
  flex: none;
  width: 52px;
  font-size: var(--fs-micro);
  letter-spacing: 0.04em;
  color: var(--text-dim);
}

.log-text {
  font-size: var(--fs-xs);
  line-height: 1.45;
  color: var(--text-muted);
}

.is-good {
  border-left-color: var(--safe);
}

.is-good .log-text {
  color: color-mix(in srgb, var(--safe) 62%, var(--text));
}

.is-warn {
  border-left-color: var(--risk);
}

.is-warn .log-text {
  color: color-mix(in srgb, var(--risk) 58%, var(--text));
}

.is-bad {
  border-left-color: var(--danger);
}

.is-bad .log-text {
  color: color-mix(in srgb, var(--danger) 58%, var(--text));
}

.is-info {
  border-left-color: var(--cyan-line);
}
</style>
