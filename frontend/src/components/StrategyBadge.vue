<script setup lang="ts">
import { computed } from 'vue'
import { Layers } from 'lucide-vue-next'

interface Props {
  strategy: string
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

/** 策略类型 → 色相（只做展示映射，识别规则在引擎里） */
const TONE: Record<string, string> = {
  专精型: 'is-amber',
  双核型: 'is-cyan',
  均衡型: 'is-safe',
  偏科型: 'is-risk',
  多元型: 'is-teal',
}

const tone = computed(() => TONE[props.strategy] ?? 'is-cyan')
</script>

<template>
  <span class="strategy-badge" :class="[tone, `is-${props.size}`]">
    <Layers :size="props.size === 'sm' ? 10 : 12" />
    <span>{{ props.strategy }}</span>
  </span>
</template>

<style scoped>
.strategy-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--cyan);
  background: var(--cyan-soft);
  border: 1px solid var(--cyan-line);
  border-radius: var(--r-pill);
  white-space: nowrap;
}

.strategy-badge.is-sm {
  padding: 1px 8px;
  font-size: var(--fs-micro);
}

.strategy-badge.is-amber {
  color: var(--amber);
  background: var(--amber-soft);
  border-color: color-mix(in srgb, var(--amber) 38%, transparent);
}

.strategy-badge.is-safe {
  color: var(--safe);
  background: var(--safe-soft);
  border-color: color-mix(in srgb, var(--safe) 38%, transparent);
}

.strategy-badge.is-risk {
  color: var(--risk);
  background: var(--risk-soft);
  border-color: color-mix(in srgb, var(--risk) 38%, transparent);
}

.strategy-badge.is-teal {
  color: var(--teal);
  background: color-mix(in srgb, var(--teal) 14%, transparent);
  border-color: color-mix(in srgb, var(--teal) 38%, transparent);
}
</style>
