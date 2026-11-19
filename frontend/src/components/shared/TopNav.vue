<script setup lang="ts">
import { BarChart3, History, LayoutDashboard, Settings } from 'lucide-vue-next'
import { NAV_ITEMS } from '@/config/sites'

/**
 * 顶部导航：4 项 + 当前项琥珀下划线。
 * 刻意做成「文字导航 + 下划线」而不是四块按钮——按钮排会立刻变成后台模板观感。
 */
withDefaults(defineProps<{ active?: string; density?: 'full' | 'icons' | 'minimal' }>(), {
  active: 'plan',
  density: 'full',
})

const emit = defineEmits<{ (e: 'select', key: string): void }>()

const ICONS = { LayoutDashboard, History, BarChart3, Settings } as const
type IconName = keyof typeof ICONS
</script>

<template>
  <nav class="nav" :class="`nav--${density}`" aria-label="主导航">
    <button
      v-for="item in NAV_ITEMS"
      :key="item.key"
      class="item"
      :class="{ 'is-active': item.key === active }"
      type="button"
      @click="emit('select', item.key)"
    >
      <component :is="ICONS[item.icon as IconName]" :size="density === 'icons' ? 17 : 15" :stroke-width="1.7" />
      <span v-if="density !== 'icons'" class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 10px;
  color: var(--text-muted);
  font-size: var(--fs-sm);
  letter-spacing: 0.04em;
  transition: color var(--dur-1) var(--ease);
}

.item:hover {
  color: var(--text);
}

.item.is-active {
  color: var(--amber);
}

.item.is-active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 2px;
  height: 2px;
  border-radius: 2px;
  background: var(--amber);
  box-shadow: 0 0 10px -1px color-mix(in srgb, var(--amber) 70%, transparent);
}

.nav--icons .item {
  padding: 8px 9px;
  border-radius: var(--r-sm);
}

.nav--icons .item.is-active::after {
  left: 9px;
  right: 9px;
}

.nav--minimal .label {
  display: none;
}
</style>
