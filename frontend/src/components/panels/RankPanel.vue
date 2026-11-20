<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BarChart3, RefreshCw, Trophy } from 'lucide-vue-next'
import PanelFrame from './PanelFrame.vue'
import { SCENARIOS } from '@/config/sites'
import { loadLeaderboard } from '@/services/history'
import type { AllocationMap, DataSource, LeaderboardItem } from '@/types'

const emit = defineEmits<{ (e: 'close'): void }>()

const items = ref<LeaderboardItem[]>([])
const note = ref('')
const origin = ref<DataSource>('preview')
const loading = ref(false)

function allocationText(allocation: AllocationMap): string {
  return SCENARIOS.map((scene) => `${scene.name.slice(0, 1)}${allocation[scene.id]}`).join(' ')
}

async function refresh(): Promise<void> {
  loading.value = true
  try {
    const outcome = await loadLeaderboard(10)
    items.value = outcome.items
    note.value = outcome.note
    origin.value = outcome.origin
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <PanelFrame title="排行榜" subtitle="本地示例数据 · 非联网榜单" @close="emit('close')">
    <div class="bar">
      <span class="mark"><Trophy :size="12" :stroke-width="2" />Top {{ items.length }}</span>
      <span class="origin" :class="{ 'is-backend': origin === 'backend' }">
        {{ origin === 'backend' ? '后端 SQLite' : '本机缓存' }}
      </span>
      <button type="button" class="refresh" :disabled="loading" @click="refresh">
        <RefreshCw :size="12" :stroke-width="2" :class="{ spin: loading }" />
        刷新
      </button>
    </div>

    <ol v-if="items.length" class="board">
      <li v-for="item in items" :key="item.simulationId" class="row" :class="{ 'is-top': item.rank <= 3 }">
        <span class="rank num">{{ item.rank }}</span>
        <span class="score num">{{ item.overallScore }}</span>
        <span class="main">
          <span class="top">
            <b>{{ item.grade }} 级</b>
            <em>{{ item.strategyType }}</em>
          </span>
          <span class="alloc mono">{{ allocationText(item.allocation) }}</span>
        </span>
        <span class="rain">{{ item.rainType === 'burst' ? '短时强降雨' : '持续型降雨' }}</span>
      </li>
    </ol>

    <div v-else-if="!loading" class="empty">
      <BarChart3 :size="22" :stroke-width="1.4" />
      <p>还没有可排序的记录。完成一次推演后这里会按分数生成榜单。</p>
    </div>

    <p class="note">{{ note || '榜单由本机推演记录生成，仅用于演示。' }}</p>
  </PanelFrame>
</template>

<style scoped>
.bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.mark {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: var(--fs-micro);
  color: var(--amber);
}

.origin {
  padding: 1px 7px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-pill);
}

.origin.is-backend {
  color: var(--teal);
  border-color: color-mix(in srgb, var(--teal) 38%, transparent);
}

.refresh {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-left: auto;
  padding: 3px 9px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}

.refresh:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--border-strong);
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.board {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.row {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--surface) 58%, transparent);
}

.row.is-top {
  border-color: color-mix(in srgb, var(--amber) 32%, var(--border));
  background: color-mix(in srgb, var(--amber) 6%, transparent);
}

.rank {
  width: 18px;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text-dim);
  text-align: center;
}

.row.is-top .rank {
  color: var(--amber);
}

.score {
  width: 44px;
  font-size: var(--fs-md);
  font-weight: 700;
  color: var(--text);
  text-align: right;
}

.main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.top {
  display: flex;
  gap: 7px;
  align-items: baseline;
  font-size: var(--fs-xs);
}

.top em {
  font-style: normal;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.alloc {
  font-size: var(--fs-micro);
  color: var(--cyan);
  letter-spacing: 0.04em;
}

.rain {
  flex: none;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 40px 12px;
  color: var(--text-dim);
  text-align: center;
}

.empty p {
  max-width: 250px;
  font-size: var(--fs-xs);
  line-height: 1.7;
}

.note {
  margin-top: 12px;
  padding-top: 10px;
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-dim);
  border-top: 1px dashed var(--line-hair);
}
</style>
