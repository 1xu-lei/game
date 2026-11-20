<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  title: string
  subtitle?: string
  /** 抽屉宽度（CSS 长度），默认 468px；场景详情用更窄的一档 */
  width?: string
}

const props = withDefaults(defineProps<Props>(), { subtitle: '', width: 'min(468px, 100%)' })
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <div class="panel-mask">
    <section
      class="panel-frame"
      role="dialog"
      aria-modal="true"
      :aria-label="props.title"
      :style="{ width: props.width }"
    >
      <header class="frame-head">
        <div class="head-text">
          <strong>{{ props.title }}</strong>
          <em v-if="props.subtitle">{{ props.subtitle }}</em>
        </div>
        <button type="button" class="close" aria-label="关闭" @click="emit('close')">
          <X :size="15" :stroke-width="2" />
        </button>
      </header>
      <div class="frame-body scroll-y">
        <slot />
      </div>
    </section>
  </div>
</template>

<style scoped>
.panel-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  justify-content: flex-end;
  /* 遮罩不吃点击：顶部导航仍可切换面板；关闭走 X 或 Esc */
  pointer-events: none;
  background: color-mix(in srgb, var(--bg) 66%, transparent);
  backdrop-filter: blur(2px);
}

.panel-frame {
  display: flex;
  flex-direction: column;
  height: 100%;
  pointer-events: auto;
  background: linear-gradient(180deg, var(--surface-2), var(--bg) 72%);
  border-left: 1px solid var(--border-strong);
  box-shadow: var(--shadow-lift);
}

.frame-head {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-hair);
}

.head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.head-text strong {
  font-size: var(--fs-md);
  letter-spacing: 0.06em;
}

.head-text em {
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-dim);
}

.close {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-left: auto;
  color: var(--text-muted);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  transition: color var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease);
}

.close:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.frame-body {
  flex: 1;
  min-height: 0;
  padding: 14px 16px 20px;
}
</style>
