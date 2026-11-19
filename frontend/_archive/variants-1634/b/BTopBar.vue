<script setup lang="ts">
import { CloudRain, Waves } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { RAIN_TYPES } from '@/config/sites'
import BrandMark from '@/components/shared/BrandMark.vue'
import TopNav from '@/components/shared/TopNav.vue'

/**
 * B 版悬浮顶栏：左（品牌 + 雨型胶囊）/ 中（图标导航）/ 右（状态 + 规则版本 + 雨层开关）。
 * 整条为 --surface 实底 + 细描边，不做大面积玻璃模糊。
 */
withDefaults(defineProps<{ active?: string }>(), { active: 'plan' })

const emit = defineEmits<{ (e: 'nav', key: string): void }>()

const store = useGameStore()
</script>

<template>
  <header class="bar">
    <div class="left">
      <BrandMark size="sm" />
      <span class="sep" />
      <div class="rain-types" role="group" aria-label="雨型切换">
        <button
          v-for="rain in RAIN_TYPES"
          :key="rain.id"
          type="button"
          class="pill"
          :class="{ 'is-active': store.rainType === rain.id }"
          :title="rain.summary"
          @click="store.setRain(rain.id)"
        >
          <CloudRain :size="12" :stroke-width="1.9" />
          <span class="pill-text">{{ rain.name }}</span>
        </button>
      </div>
    </div>

    <div class="center">
      <TopNav :active="active" density="icons" @select="emit('nav', $event)" />
    </div>

    <div class="right">
      <span class="status">
        <i class="pulse" />
        科学规划 · 从容应对暴雨
      </span>
      <span class="ver mono">{{ store.preview.rulesVersion }}</span>
      <button
        type="button"
        class="layer"
        :class="{ 'is-on': store.rainLayerOn }"
        :aria-pressed="store.rainLayerOn"
        title="雨层显隐"
        @click="store.rainLayerOn = !store.rainLayerOn"
      >
        <Waves :size="13" :stroke-width="1.9" />
        <span>雨层</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.bar {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 48px;
  padding: 0 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-panel);
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
  min-width: 0;
}

.center {
  margin-left: auto;
  margin-right: auto;
  flex: none;
}

.sep {
  width: 1px;
  height: 18px;
  background: var(--line-hair);
}

.rain-types {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--r-pill);
  color: var(--text-muted);
  font-size: var(--fs-micro);
  letter-spacing: 0.04em;
  background: var(--surface-1);
  border: 1px solid var(--border-soft);
  white-space: nowrap;
  transition: color var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease),
    background var(--dur-1) var(--ease);
}

.pill:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.pill.is-active {
  color: var(--cyan);
  background: var(--cyan-soft);
  border-color: var(--cyan-line);
}

.pill-text {
  transform: translateY(0.5px);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--fs-micro);
  letter-spacing: 0.08em;
  color: var(--text-muted);
  white-space: nowrap;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--safe);
  animation: pulse 2.4s ease-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--safe) 55%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.ver {
  font-size: var(--fs-micro);
  color: var(--text-dim);
  padding-left: 10px;
  border-left: 1px solid var(--line-hair);
  white-space: nowrap;
}

.layer {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border-radius: var(--r-pill);
  font-size: var(--fs-micro);
  color: var(--text-dim);
  background: var(--surface-1);
  border: 1px solid var(--border-soft);
  white-space: nowrap;
  transition: color var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease);
}

.layer.is-on {
  color: var(--cyan);
  border-color: var(--cyan-line);
  background: var(--cyan-soft);
}
</style>
