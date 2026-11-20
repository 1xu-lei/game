<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { History, RefreshCw, TriangleAlert } from 'lucide-vue-next'
import PanelFrame from './PanelFrame.vue'
import { SCENARIOS } from '@/config/sites'
import { loadHistory, loadSnapshot } from '@/services/history'
import { useSimulationStore } from '@/stores/simulation'
import { useUiStore } from '@/stores/ui'
import type { AllocationMap, DataSource, HistoryItem } from '@/types'

const emit = defineEmits<{ (e: 'close'): void }>()

const sim = useSimulationStore()
const ui = useUiStore()

const items = ref<HistoryItem[]>([])
const total = ref(0)
const origin = ref<DataSource>('preview')
const loading = ref(false)
const openingId = ref<string | null>(null)
const error = ref<string | null>(null)

/** 分配摘要：学1 集0 园3 居0 车1 */
function allocationText(allocation: AllocationMap): string {
  return SCENARIOS.map((scene) => `${scene.name.slice(0, 1)}${allocation[scene.id]}`).join(' ')
}

function timeText(item: HistoryItem): string {
  if (!item.createdAt) return '—'
  const stamp = new Date(item.createdAt)
  if (Number.isNaN(stamp.getTime())) return '—'
  return `${stamp.getMonth() + 1}/${stamp.getDate()} ${String(stamp.getHours()).padStart(2, '0')}:${String(
    stamp.getMinutes(),
  ).padStart(2, '0')}`
}

async function refresh(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const outcome = await loadHistory(20)
    items.value = outcome.items
    total.value = outcome.total
    origin.value = outcome.origin
  } finally {
    loading.value = false
  }
}

/** 打开一条记录：本机快照优先，其次后端详情；只回放，不重算 */
async function open(item: HistoryItem): Promise<void> {
  if (openingId.value) return
  openingId.value = item.simulationId
  error.value = null
  try {
    const snapshot = await loadSnapshot(item.simulationId)
    if (!snapshot) {
      error.value = '这条记录的结果快照不在本机，且后端未响应，无法回看'
      return
    }
    sim.showSnapshot(snapshot.result, snapshot.source)
    ui.close()
    emit('close')
  } finally {
    openingId.value = null
  }
}

onMounted(refresh)
</script>

<template>
  <PanelFrame
    title="历史记录"
    :subtitle="origin === 'backend' ? '本机 SQLite 推演记录 + 浏览器快照' : '后端未连接 · 仅浏览器快照'"
    @close="emit('close')"
  >
    <div class="bar">
      <span class="count mono">共 {{ total }} 条</span>
      <span class="origin" :class="{ 'is-backend': origin === 'backend' }">
        {{ origin === 'backend' ? '后端记录' : '本机缓存' }}
      </span>
      <button type="button" class="refresh" :disabled="loading" @click="refresh">
        <RefreshCw :size="12" :stroke-width="2" :class="{ spin: loading }" />
        刷新
      </button>
    </div>

    <p v-if="error" class="error"><TriangleAlert :size="12" :stroke-width="2.2" />{{ error }}</p>

    <ul v-if="items.length" class="records">
      <li v-for="item in items" :key="item.simulationId">
        <button type="button" class="record" :disabled="openingId !== null" @click="open(item)">
          <span class="record-score num">{{ item.overallScore }}</span>
          <span class="record-main">
            <span class="record-top">
              <b>{{ item.grade }} 级</b>
              <em>{{ item.rainType === 'burst' ? '短时强降雨' : '持续型降雨' }}</em>
              <span class="record-time mono">{{ timeText(item) }}</span>
            </span>
            <span class="record-alloc mono">{{ allocationText(item.allocation) }}</span>
            <span class="record-strategy">{{ item.strategyType }}</span>
          </span>
          <span class="record-enter">{{ openingId === item.simulationId ? '读取中…' : '查看' }}</span>
        </button>
      </li>
    </ul>

    <div v-else-if="!loading" class="empty">
      <History :size="22" :stroke-width="1.4" />
      <p>还没有推演记录。回到城市规划，分配 5 点资源后点「开始推演」。</p>
    </div>
  </PanelFrame>
</template>

<style scoped>
.bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.count {
  font-size: var(--fs-micro);
  color: var(--text-muted);
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

.error {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: var(--fs-micro);
  color: var(--risk);
}

.records {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 9px 10px;
  text-align: left;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  transition: border-color var(--dur-1) var(--ease), background var(--dur-1) var(--ease);
}

.record:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: color-mix(in srgb, var(--surface-elevated) 54%, transparent);
}

.record-score {
  flex: none;
  width: 42px;
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--amber);
  text-align: right;
}

.record-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.record-top {
  display: flex;
  gap: 7px;
  align-items: baseline;
  font-size: var(--fs-xs);
}

.record-top b {
  color: var(--text);
}

.record-top em {
  font-style: normal;
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.record-time {
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.record-alloc {
  font-size: var(--fs-micro);
  color: var(--cyan);
  letter-spacing: 0.04em;
}

.record-strategy {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.record-enter {
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
  max-width: 260px;
  font-size: var(--fs-xs);
  line-height: 1.7;
}
</style>
