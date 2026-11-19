<script setup lang="ts">
/** 品牌标识：等距雨夜街角剪影 + 中英文字标。三套版本共用，仅尺寸不同。 */
withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })
</script>

<template>
  <div class="brand" :class="`brand--${size}`">
    <svg class="mark" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M4 26 L20 18 L36 26 L20 34 Z" fill="var(--surface-elevated)" />
      <path d="M9 23.4 L14 20.8 L14 12 L9 14.6 Z" fill="var(--border-strong)" />
      <path d="M14.6 20.5 L20 17.8 L20 6.8 L14.6 9.4 Z" fill="var(--cyan)" opacity="0.55" />
      <path d="M20.6 17.8 L26 20.5 L26 11.4 L20.6 8.8 Z" fill="var(--border)" />
      <path d="M26.6 20.9 L31.6 23.5 L31.6 16 L26.6 13.4 Z" fill="var(--amber)" opacity="0.5" />
      <g stroke="var(--cyan)" stroke-width="1" stroke-linecap="round" opacity="0.75">
        <path d="M11 6 l-1.2 4" />
        <path d="M22 4 l-1.2 3.4" />
        <path d="M30 8 l-1.2 3.6" />
      </g>
    </svg>
    <span class="text">
      <span class="cn">雨落街角</span>
      <span class="en">RAINFALL CORNER</span>
    </span>
  </div>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mark {
  flex: none;
  width: 30px;
  height: 30px;
}

.text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}

.cn {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--text);
}

.en {
  font-family: var(--font-num);
  font-size: 9px;
  letter-spacing: 0.24em;
  color: var(--text-muted);
  margin-top: 2px;
}

.brand--sm .mark {
  width: 22px;
  height: 22px;
}

.brand--sm .cn {
  font-size: 14px;
  letter-spacing: 0.12em;
}

.brand--sm .en {
  font-size: 8px;
}
</style>
