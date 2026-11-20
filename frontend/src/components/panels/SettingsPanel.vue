<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Database, Trash2 } from 'lucide-vue-next'
import PanelFrame from './PanelFrame.vue'
import { RULES_VERSION } from '@/engine/ruleEngine'
import { clearLocalRecords, localHistoryItems, probeBackend } from '@/services/history'

const emit = defineEmits<{ (e: 'close'): void }>()

const online = ref<boolean | null>(null)
const backendRules = ref('')
const localCount = ref(0)
const cleared = ref(false)

const backendText = computed(() => {
  if (online.value === null) return '检测中…'
  return online.value ? `已连接 · 规则 ${backendRules.value}` : '未连接 · 使用本地预览引擎'
})

function refreshCount(): void {
  localCount.value = localHistoryItems().length
}

function clearLocal(): void {
  clearLocalRecords()
  cleared.value = true
  refreshCount()
}

onMounted(async () => {
  refreshCount()
  const health = await probeBackend()
  online.value = health.online
  backendRules.value = health.rulesVersion
})
</script>

<template>
  <PanelFrame title="设置与说明" subtitle="规则口径 / 数据存储 / 免责" @close="emit('close')">
    <section class="block">
      <h4>运行状态</h4>
      <dl class="kv">
        <dt>规则版本</dt>
        <dd class="mono">{{ RULES_VERSION }}</dd>
        <dt>后端引擎</dt>
        <dd :class="{ ok: online === true, warn: online === false }">{{ backendText }}</dd>
        <dt>前端计算</dt>
        <dd>engine/ruleEngine.ts（与后端同一份 rules.json）</dd>
      </dl>
    </section>

    <section class="block">
      <h4>评分口径</h4>
      <p>
        5 点资源分给 5 个场景，共 C(9,4) = 126 种分配；两种雨型各有独立的权重、输送损失与防护修正。
        城市水流固定为 学校→公园、集市→居民区，两路汇入车站。
      </p>
      <p>
        原始分 = Σ 各场景权重 × 净安全度 + 联动奖励，再经单调线性映射到 0–100 展示分
        （只影响可读性，不改变排序）。等级：S ≥ 85 / A ≥ 72 / B ≥ 58 / C ≥ 42 / D &lt; 42。
      </p>
      <p class="dim">
        所有数值为项目自定义的简化指标，用于比较策略取舍，不是真实水动力学或工程预测。
      </p>
    </section>

    <section class="block">
      <h4>数据存储</h4>
      <dl class="kv">
        <dt>后端</dt>
        <dd>本机 SQLite（backend/rainfall.db），仅保存推演记录，不上传</dd>
        <dt>浏览器</dt>
        <dd>localStorage 快照 {{ localCount }} 条，最多保留 20 条</dd>
      </dl>
      <div class="actions">
        <button type="button" class="danger" :disabled="localCount === 0" @click="clearLocal">
          <Trash2 :size="12" :stroke-width="2" />
          清除本机快照
        </button>
        <span v-if="cleared" class="ok-note">已清除</span>
      </div>
    </section>

    <section class="block">
      <h4>关于</h4>
      <p>
        《雨落街角 / Rainfall Corner》是城市内涝防护主题的策略推演 Demo：规则由确定性引擎计算，
        同一输入必得同一输出，无随机数，也不依赖时间或顺序。
      </p>
      <p class="dim">
        排行榜为本地示例数据，不联网；历史记录停留在本机，不做任何上传。
      </p>
    </section>

    <p class="stamp mono"><Database :size="10" :stroke-width="2" />local only · rules {{ RULES_VERSION }}</p>
  </PanelFrame>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line-hair);
}

.block:last-of-type {
  border-bottom: 0;
}

h4 {
  font-size: var(--fs-sm);
  letter-spacing: 0.06em;
  color: var(--text);
}

p {
  font-size: var(--fs-xs);
  line-height: 1.75;
  color: var(--text-muted);
}

p.dim {
  color: var(--text-dim);
  font-size: var(--fs-micro);
}

.kv {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 5px 10px;
  font-size: var(--fs-xs);
}

.kv dt {
  color: var(--text-dim);
}

.kv dd {
  color: var(--text-muted);
  word-break: break-all;
}

.kv dd.ok {
  color: var(--safe);
}

.kv dd.warn {
  color: var(--amber);
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.danger {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 5px 10px;
  font-size: var(--fs-micro);
  color: var(--risk);
  border: 1px solid color-mix(in srgb, var(--risk) 40%, transparent);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--risk) 10%, transparent);
}

.danger:disabled {
  color: var(--text-dim);
  border-color: var(--border-soft);
  background: transparent;
  cursor: not-allowed;
}

.ok-note {
  font-size: var(--fs-micro);
  color: var(--safe);
}

.stamp {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-top: 6px;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}
</style>
