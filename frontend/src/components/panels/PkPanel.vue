<script setup lang="ts">
import { computed } from 'vue'
import { Swords, Trophy, Users } from 'lucide-vue-next'
import PanelFrame from './PanelFrame.vue'
import { SCENARIOS } from '@/config/sites'
import { useGameStore } from '@/stores/game'
import { usePkStore } from '@/stores/pk'
import { useSimulationStore } from '@/stores/simulation'
import { useUiStore } from '@/stores/ui'

/**
 * 双人 PK 侧栏（同设备轮流，规格书 §10.2 P2）
 * ---------------------------------------------------------------
 * 判定口径与《rain-corner-main》一致：**严格更高才胜，同分归先手**，
 * 只是把「车站峰值越低越好」换成本项目的「韧性分越高越好」。
 * 锁定后不公开玩家一的加点，避免玩家二照着抄。
 */
const emit = defineEmits<{ (e: 'close'): void }>()

const pk = usePkStore()
const game = useGameStore()
const sim = useSimulationStore()
const ui = useUiStore()

const rows = computed(() =>
  SCENARIOS.map((scene) => ({
    id: scene.id,
    name: scene.name,
    p1: pk.p1 ? (pk.p1.allocation[scene.id] ?? 0) : null,
    p2: pk.p2 ? (pk.p2.allocation[scene.id] ?? 0) : null,
    d1: pk.p1?.scenarioResults.find((r) => r.sceneId === scene.id)?.effective ?? null,
    d2: pk.p2?.scenarioResults.find((r) => r.sceneId === scene.id)?.effective ?? null,
  })),
)

function startFresh(): void {
  pk.restart()
  game.reset()
  sim.backToPlan()
  ui.close()
  emit('close')
}

function quitPk(): void {
  pk.quit()
  ui.close()
  emit('close')
}

function replaceP1(): void {
  pk.restart()
  game.reset()
  sim.backToPlan()
  ui.close()
  emit('close')
}
</script>

<template>
  <PanelFrame title="双人 PK" subtitle="同设备轮流 · 无联网 · 同分归先手" @close="emit('close')">
    <section class="block intro">
      <p>
        <Users :size="11" :stroke-width="2" />
        两位玩家依次在同设备上分配 <b>5 点</b>并执行推演；<b>韧性分严格更高者胜</b>，
        同分归先手（玩家一）。锁定先手后只公开分数与等级，不公开加点。
      </p>
    </section>

    <section class="block">
      <h4>本局状态</h4>
      <div class="scoreboard">
        <div class="side" :class="{ 'is-turn': pk.active && pk.turn === 1, 'is-won': pk.verdict?.winner === 'p1' }">
          <span class="tag">玩家一 · 先手</span>
          <b class="num">{{ pk.p1 ? pk.p1.overallScore : '—' }}</b>
          <em>{{ pk.p1 ? `${pk.p1.grade} 级 · ${pk.p1.strategyType}` : '未锁定' }}</em>
        </div>
        <span class="vs"><Swords :size="14" :stroke-width="2" /></span>
        <div class="side" :class="{ 'is-turn': pk.active && pk.turn === 2, 'is-won': pk.verdict?.winner === 'p2' }">
          <span class="tag">玩家二 · 挑战者</span>
          <b class="num">{{ pk.p2 ? pk.p2.overallScore : '—' }}</b>
          <em>{{ pk.p2 ? `${pk.p2.grade} 级 · ${pk.p2.strategyType}` : '待推演' }}</em>
        </div>
      </div>
      <p class="turn">
        <template v-if="!pk.active && !pk.p1">未开始 · 点下方「开始一局 PK」</template>
        <template v-else-if="pk.verdict">已判定：{{ pk.verdict.title }}</template>
        <template v-else-if="pk.locked">轮到玩家二：重新分配 5 点后点「开始推演」</template>
        <template v-else>轮到玩家一：分配 5 点后点「开始推演」</template>
      </p>
    </section>

    <section v-if="pk.verdict" class="block">
      <h4>
        判定
        <em>严格更高才胜 · 同分归玩家一</em>
      </h4>
      <div class="verdict" :class="pk.verdict.tie ? 'is-tie' : 'is-win'">
        <span class="v-title"><Trophy :size="12" :stroke-width="2" />{{ pk.verdict.title }}</span>
        <span class="v-detail">{{ pk.verdict.detail }}</span>
      </div>
    </section>

    <section v-if="pk.p1 || pk.p2" class="block">
      <h4>
        五点摊牌
        <em>左：玩家一投入 / 右：玩家二投入</em>
      </h4>
      <table class="table">
        <thead>
          <tr>
            <th>场景</th>
            <th class="num">玩家一</th>
            <th class="num">玩家二</th>
            <th class="num">净安全 Δ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.name }}</td>
            <td class="num">{{ row.p1 ?? '—' }}</td>
            <td class="num">{{ row.p2 ?? '—' }}</td>
            <td
              class="num"
              :class="row.d1 !== null && row.d2 !== null ? (row.d2 - row.d1 > 0 ? 'up' : row.d2 - row.d1 < 0 ? 'down' : '') : ''"
            >
              {{ row.d1 !== null && row.d2 !== null ? (row.d2 - row.d1 > 0 ? `+${row.d2 - row.d1}` : row.d2 - row.d1) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
      <p class="note">
        投入点数是公开信息：锁定后玩家二可以看到玩家一的分数，但看不到加点，摊牌在判定后揭晓。
      </p>
    </section>

    <div class="actions">
      <button type="button" class="primary" @click="startFresh">
        <Swords :size="13" :stroke-width="2" />
        {{ pk.p1 || pk.p2 ? '再开一局 PK' : '开始一局 PK' }}
      </button>
      <button v-if="pk.locked" type="button" class="ghost" @click="replaceP1">重设玩家一</button>
      <button v-if="pk.active || pk.p1" type="button" class="ghost" @click="quitPk">退出 PK</button>
    </div>
  </PanelFrame>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-bottom: 13px;
  margin-bottom: 13px;
  border-bottom: 1px solid var(--line-hair);
}

.block:last-of-type {
  border-bottom: 0;
}

h4 {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: var(--fs-sm);
  letter-spacing: 0.05em;
  color: var(--text);
}

h4 em {
  margin-left: auto;
  font-size: var(--fs-micro);
  font-style: normal;
  font-weight: 400;
  color: var(--text-dim);
}

.intro p {
  display: flex;
  gap: 6px;
  font-size: var(--fs-xs);
  line-height: 1.75;
  color: var(--text-muted);
}

.intro b {
  color: var(--amber);
}

.scoreboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: stretch;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
}

.side.is-turn {
  border-color: color-mix(in srgb, var(--cyan) 52%, var(--border));
  background: color-mix(in srgb, var(--cyan) 9%, transparent);
}

.side.is-won {
  border-color: color-mix(in srgb, var(--amber) 56%, var(--border));
  background: var(--amber-soft);
}

.side .tag {
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.side b {
  font-size: var(--fs-xl);
  line-height: 1.1;
  color: var(--text);
}

.side em {
  font-size: var(--fs-micro);
  font-style: normal;
  color: var(--text-muted);
}

.vs {
  display: grid;
  place-items: center;
  color: var(--text-dim);
}

.turn {
  font-size: var(--fs-micro);
  color: var(--text-muted);
}

.verdict {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--amber) 44%, transparent);
  border-radius: var(--r-sm);
  background: var(--amber-soft);
}

.verdict.is-tie {
  border-color: var(--border-strong);
  background: var(--cyan-soft);
}

.v-title {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: var(--fs-sm);
  color: var(--amber);
}

.verdict.is-tie .v-title {
  color: var(--cyan);
}

.v-detail {
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-muted);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-micro);
}

.table th {
  padding: 3px 4px;
  font-weight: 500;
  color: var(--text-dim);
  text-align: left;
  border-bottom: 1px solid var(--line-hair);
}

.table td {
  padding: 4px;
  color: var(--text-muted);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 26%, transparent);
}

.table .num {
  text-align: right;
}

.table .up {
  color: var(--safe);
}

.table .down {
  color: var(--risk);
}

.note {
  font-size: var(--fs-micro);
  line-height: 1.6;
  color: var(--text-dim);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.primary {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 14px;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #1a1204;
  border-radius: var(--r-pill);
  background: linear-gradient(180deg, #f8c565, var(--amber) 60%, #d99a2c);
  box-shadow: var(--glow-amber);
}

.ghost {
  padding: 6px 12px;
  font-size: var(--fs-micro);
  color: var(--text-muted);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}

.ghost:hover {
  color: var(--text);
  border-color: var(--border-strong);
}
</style>
