<script setup lang="ts">
/**
 * 占位实现：C 版（水文仪）由实现型子智能体落位后覆盖此文件。
 * 保留一个可运行的骨架，避免其他版本在构建时被拖累。
 */
import { useGameStore } from '@/stores/game'

const store = useGameStore()
</script>

<template>
  <div class="stub">
    <p class="title">C · 水文仪</p>
    <p class="note">正在实现：流域示意图 + 仪表化读数。当前预览分 {{ store.preview.overallScore }}</p>
  </div>
</template>

<style scoped>
.stub {
  display: grid;
  place-content: center;
  gap: 6px;
  height: 100vh;
  text-align: center;
  color: var(--text-muted);
}

.title {
  font-size: var(--fs-lg);
  color: var(--text);
  letter-spacing: 0.12em;
}

.note {
  font-size: var(--fs-xs);
  color: var(--text-dim);
}
</style>
