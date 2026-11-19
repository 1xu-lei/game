<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Check, RotateCcw } from 'lucide-vue-next'

interface Props {
  used: number
  total: number
  valid: boolean
  message: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ reset: [] }>()

const remaining = computed(() => props.total - props.used)
const ticks = computed(() => Array.from({ length: props.total }, (_v, i) => i + 1))
</script>

<template>
  <div class="budget">
    <div class="budget-top">
      <span class="budget-count num">
        {{ props.used }}<em>/{{ props.total }}</em>
      </span>
      <span class="budget-state" :class="props.valid ? 'is-ok' : 'is-warn'">
        {{ props.valid ? '已分配完成' : `剩余 ${remaining} 点` }}
      </span>
      <button type="button" class="budget-reset" @click="emit('reset')">
        <RotateCcw :size="11" />
        重置
      </button>
    </div>

    <div class="budget-ticks">
      <i v-for="tick in ticks" :key="tick" :class="{ 'is-on': tick <= props.used }" />
    </div>

    <p class="budget-msg" :class="props.valid ? 'is-ok' : 'is-warn'">
      <component :is="props.valid ? Check : AlertTriangle" :size="11" />
      <span>{{ props.valid ? '资源恰好 5 点，可以开始推演' : props.message }}</span>
    </p>
  </div>
</template>

<style scoped>
.budget {
  flex: none;
  padding: 9px 12px 10px;
  border-top: 1px solid var(--line-hair);
  background: linear-gradient(
    0deg,
    color-mix(in srgb, var(--surface-elevated) 42%, transparent),
    transparent
  );
}

.budget-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.budget-count {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  color: var(--text);
}

.budget-count em {
  font-size: var(--fs-xs);
  font-style: normal;
  color: var(--text-dim);
}

.budget-state {
  font-size: var(--fs-tiny);
}

.budget-state.is-ok {
  color: var(--safe);
}

.budget-state.is-warn {
  color: var(--amber);
}

.budget-reset {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  padding: 2px 7px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border: 1px solid var(--line-hair);
  border-radius: var(--r-pill);
  transition:
    color var(--dur-1) var(--ease),
    border-color var(--dur-1) var(--ease);
}

.budget-reset:hover {
  color: var(--text);
  border-color: var(--border);
}

.budget-ticks {
  display: flex;
  gap: 3px;
  margin: 7px 0 6px;
}

.budget-ticks i {
  flex: 1;
  height: 4px;
  background: color-mix(in srgb, var(--text) 10%, transparent);
  border-radius: var(--r-pill);
  transition: background var(--dur-2) var(--ease);
}

.budget-ticks i.is-on {
  background: var(--amber);
  box-shadow: 0 0 8px -2px var(--amber);
}

.budget-msg {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: var(--fs-micro);
  line-height: 1.4;
}

.budget-msg.is-ok {
  color: var(--safe);
}

.budget-msg.is-warn {
  color: var(--risk);
}
</style>
