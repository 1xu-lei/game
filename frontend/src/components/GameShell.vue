<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { Component } from 'vue'
import { BarChart3, CloudRain, Cpu, History, LayoutDashboard, Settings } from 'lucide-vue-next'
import { NTooltip } from 'naive-ui'
import { NAV_ITEMS } from '@/config/sites'
import { useSimulationStore } from '@/stores/simulation'

interface Props {
  /** 当前激活的导航项：plan = 规划主界面，result = 结算页 */
  active?: 'plan' | 'result'
  statusText?: string
}

const props = withDefaults(defineProps<Props>(), {
  active: 'plan',
  statusText: '科学规划 · 从容应对每一场暴雨',
})

const slots = useSlots()
const sim = useSimulationStore()

const hasRails = computed(() => Boolean(slots.left || slots.right))

const ICONS: Record<string, Component> = {
  LayoutDashboard,
  History,
  BarChart3,
  Settings,
}

const navItems = computed(() =>
  NAV_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    icon: ICONS[item.icon] ?? LayoutDashboard,
    active: item.key === 'plan' && props.active === 'plan',
    enabled: item.key === 'plan',
  })),
)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark"><CloudRain :size="19" /></span>
        <span class="brand-text">
          <strong>雨落街角</strong>
          <em>Rainfall Corner</em>
        </span>
      </div>

      <nav class="nav">
        <NTooltip
          v-for="item in navItems"
          :key="item.key"
          placement="bottom"
          :disabled="item.enabled"
        >
          <template #trigger>
            <span class="nav-item" :class="{ 'is-active': item.active, 'is-muted': !item.enabled }">
              <component :is="item.icon" :size="14" />
              <span>{{ item.label }}</span>
            </span>
          </template>
          {{ item.label }}属于 P1/P2 阶段功能（历史记录 / 排行榜），当前版本只提供规划与结算闭环。
        </NTooltip>
      </nav>

      <div class="topbar-right">
        <span class="source-chip" :class="{ 'is-backend': sim.source === 'backend' }">
          <Cpu :size="12" />
          {{ sim.sourceLabel }}
        </span>
        <span class="status-text">{{ props.statusText }}</span>
      </div>
    </header>

    <div class="shell-body" :class="{ 'has-rails': hasRails }">
      <aside v-if="hasRails" class="rail">
        <slot name="left" />
      </aside>
      <main class="stage">
        <slot />
      </main>
      <aside v-if="hasRails" class="rail rail-right">
        <slot name="right" />
      </aside>
    </div>

    <footer v-if="slots.bottom" class="shell-foot">
      <slot name="bottom" />
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100vh;
  padding: 0 12px 12px;
}

/* —— 顶部状态栏 —— */
.topbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 20px;
  height: var(--rail-top);
  border-bottom: 1px solid var(--line-hair);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 210px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--amber);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--amber) 26%, transparent),
    transparent 70%
  );
  border: 1px solid color-mix(in srgb, var(--amber) 34%, transparent);
  border-radius: 9px;
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-text strong {
  font-size: var(--fs-lg);
  letter-spacing: 0.06em;
}

.brand-text em {
  font-family: var(--font-num);
  font-size: var(--fs-tiny);
  font-style: normal;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.nav {
  display: flex;
  align-items: center;
  gap: 26px;
  height: 100%;
}

.nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  transition: color var(--dur-1) var(--ease);
}

.nav-item.is-active {
  color: var(--text);
}

.nav-item.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  content: '';
  background: var(--amber);
  border-radius: 2px 2px 0 0;
  box-shadow: 0 0 12px -2px var(--amber);
}

.nav-item.is-muted {
  color: var(--text-dim);
  cursor: default;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.status-text {
  font-size: var(--fs-tiny);
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

/* —— 三栏 —— */
.shell-body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.shell-body.has-rails {
  grid-template-columns: var(--rail-left) minmax(0, 1fr) var(--rail-right);
}

.rail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  min-width: 0;
}

.rail-right {
  min-width: var(--rail-right);
}

.stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* —— 底栏 —— */
.shell-foot {
  display: flex;
  flex: none;
  gap: 10px;
  height: var(--rail-bottom);
  min-width: 0;
}
</style>
