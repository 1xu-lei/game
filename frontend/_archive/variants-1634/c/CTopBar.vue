<script setup lang="ts">
import { computed, ref } from 'vue'
import { CloudRain } from 'lucide-vue-next'
import { RAIN_TYPES } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'

/**
 * C 版顶栏：品牌 + 雨型胶囊 + 图标导航 + 规则版本（mono）
 * 高度压到 52px，纵向空间全部让给流域图与仪表读数。
 */
const store = useGameStore()
const activeNav = ref('plan')
const rains = computed(() => RAIN_TYPES)
</script>

<template>
  <header class="top">
    <BrandMark size="sm" />

    <div class="switcher" role="group" aria-label="雨型切换">
      <button
        v-for="rain in rains"
        :key="rain.id"
        type="button"
        class="pill"
        :class="{ 'is-active': store.rainType === rain.id }"
        :title="rain.summary"
        @click="store.setRain(rain.id)"
      >
        <CloudRain :size="11" :stroke-width="2" />
        <span>{{ rain.name }}</span>
      </button>
    </div>

    <TopNav :active="activeNav" density="icons" @select="activeNav = $event" />

    <div class="right">
      <span class="dot" />
      <span class="rules-label">规则版本</span>
      <span class="rules mono">{{ store.preview.rulesVersion }}</span>
    </div>
  </header>
</template>

<style scoped>
.top {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  height: 100%;
  padding: 0 var(--sp-3);
  border-bottom: 1px solid var(--line-hair);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 62%, transparent), transparent);
}

.switcher {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--bg) 42%, transparent);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: var(--r-pill);
  font-size: var(--fs-micro);
  letter-spacing: 0.04em;
  color: var(--text-muted);
  white-space: nowrap;
  transition: color var(--dur-1) var(--ease), background var(--dur-1) var(--ease);
}

.pill:hover {
  color: var(--text);
}

.pill.is-active {
  color: var(--cyan);
  background: var(--cyan-soft);
  box-shadow: inset 0 0 0 1px var(--cyan-line);
}

.right {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  white-space: nowrap;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 7px -1px var(--teal);
}

.rules-label {
  font-size: var(--fs-micro);
  color: var(--text-dim);
  letter-spacing: 0.06em;
}

.rules {
  font-size: var(--fs-micro);
  color: var(--text-muted);
  padding: 1px 6px;
  border: 1px solid var(--border-soft);
  border-radius: 4px;
  background: color-mix(in srgb, var(--bg) 40%, transparent);
}
</style>
