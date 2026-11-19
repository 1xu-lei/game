<script setup lang="ts">
/** 0–5 档位指示灯条：顶栏/节点/分配行共用，避免各处画不同样式的进度条 */
withDefaults(defineProps<{ value: number; accent?: string; size?: 'xs' | 'sm' | 'md' }>(), {
  value: 0,
  accent: 'var(--cyan)',
  size: 'sm',
})
</script>

<template>
  <span class="pips" :class="`pips--${size}`" :aria-label="`已投入 ${value} / 5`">
    <i v-for="i in 5" :key="i" :class="{ 'is-on': i <= value }" :style="{ '--pip': accent }" />
  </span>
</template>

<style scoped>
.pips {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.pips i {
  display: block;
  width: 12px;
  height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--border) 82%, transparent);
  transition: background var(--dur-1) var(--ease), box-shadow var(--dur-1) var(--ease);
}

.pips i.is-on {
  background: var(--pip);
  box-shadow: 0 0 8px -1px color-mix(in srgb, var(--pip) 75%, transparent);
}

.pips--xs i {
  width: 8px;
  height: 3px;
}

.pips--md i {
  width: 18px;
  height: 5px;
}
</style>
