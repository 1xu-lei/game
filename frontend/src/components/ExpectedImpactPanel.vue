<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart3, Gauge } from 'lucide-vue-next'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSceneVisuals } from '@/composables/useSceneVisuals'
import type { SimulationResult } from '@/types'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  /** 结果对象来自 store（预览引擎输出或接口响应），组件只渲染不计算 */
  result: SimulationResult
}

const props = defineProps<Props>()
const { accentOf, ringLabelOf } = useSceneVisuals()

const RADIUS = 26
const CIRCUM = 2 * Math.PI * RADIUS

const rings = computed(() =>
  props.result.scenarioResults.map((item) => ({
    id: item.sceneId,
    label: ringLabelOf(item.sceneId),
    value: item.effective,
    invested: item.invested,
    accent: accentOf(item.sceneId),
    dash: `${(Math.max(0, Math.min(100, item.effective)) / 100) * CIRCUM} ${CIRCUM}`,
  })),
)

/* ---------------- 城市状态预测双线图（ECharts，真实数据） ---------------- */
type ChartInstance = ReturnType<typeof echarts.init>
type ChartOption = Parameters<ChartInstance['setOption']>[0]

const chartEl = ref<HTMLDivElement | null>(null)
let chart: ChartInstance | null = null
let observer: ResizeObserver | null = null

const AXIS = 'rgba(145,169,188,0.55)'
const SPLIT = 'rgba(36,67,93,0.45)'

function buildOption(result: SimulationResult): Record<string, unknown> {
  return {
    animationDuration: 420,
    grid: { left: 2, right: 8, top: 8, bottom: 2, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16,34,53,0.96)',
      borderColor: 'rgba(36,67,93,0.9)',
      padding: 8,
      textStyle: { color: '#E7F0F7', fontSize: 11 },
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(145,169,188,0.35)' } },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: result.forecast.map((point) => point.step),
      axisLine: { lineStyle: { color: SPLIT } },
      axisTick: { show: false },
      axisLabel: { color: AXIS, fontSize: 10, margin: 8 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitNumber: 2,
      axisLabel: { color: AXIS, fontSize: 10 },
      splitLine: { lineStyle: { color: SPLIT } },
    },
    series: [
      {
        name: '积水风险',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: result.forecast.map((point) => point.waterlog),
        lineStyle: { width: 2, color: '#38BDF8' },
        itemStyle: { color: '#38BDF8' },
      },
      {
        name: '损失概率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: result.forecast.map((point) => point.loss),
        lineStyle: { width: 2, color: '#F08B36' },
        itemStyle: { color: '#F08B36' },
      },
    ],
  }
}

onMounted(() => {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value, undefined, { renderer: 'canvas' })
  chart.setOption(buildOption(props.result) as ChartOption)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(chartEl.value)
})

watch(
  () => props.result,
  (next) => {
    chart?.setOption(buildOption(next) as ChartOption, true)
  },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart?.dispose()
  chart = null
})
</script>

<template>
  <section class="panel effect">
    <header class="panel-head">
      <span class="ico-chip"><Gauge :size="13" /></span>
      <span class="panel-label">预期效果预览</span>
      <span class="panel-meta">随分配即时更新</span>
    </header>

    <div class="effect-body">
      <div class="rings">
        <div
          v-for="ring in rings"
          :key="ring.id"
          class="ring"
          :class="{ 'is-zero': ring.invested === 0 }"
          :style="{ '--accent': ring.accent }"
        >
          <svg viewBox="0 0 64 64" class="ring-svg">
            <circle cx="32" cy="32" :r="RADIUS" class="ring-track" />
            <circle
              cx="32"
              cy="32"
              :r="RADIUS"
              class="ring-value"
              :stroke-dasharray="ring.dash"
              transform="rotate(-90 32 32)"
            />
          </svg>
          <span class="ring-num num">{{ ring.value }}</span>
          <span class="ring-label">{{ ring.label }}</span>
        </div>
      </div>

      <div class="forecast">
        <div class="forecast-head">
          <span class="forecast-title"><BarChart3 :size="12" />城市状态预测</span>
          <span class="forecast-legend">
            <em class="dot is-cyan" />积水风险
            <em class="dot is-risk" />损失概率
          </span>
        </div>
        <div ref="chartEl" class="chart" />
        <span class="forecast-note">简化指标 0–100 · 本地预览引擎</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.effect {
  flex: 1;
  min-width: 0;
}

.effect-body {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
  padding: 8px 12px 10px;
}

.rings {
  display: flex;
  flex: 1;
  gap: 4px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.ring {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.ring-svg {
  width: 62px;
  height: 62px;
}

.ring-track {
  fill: none;
  stroke: color-mix(in srgb, var(--text) 9%, transparent);
  stroke-width: 5;
}

.ring-value {
  fill: none;
  stroke: var(--accent);
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dasharray var(--dur-3) var(--ease);
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--accent) 60%, transparent));
}

.ring.is-zero .ring-value {
  stroke: color-mix(in srgb, var(--accent) 42%, transparent);
  filter: none;
}

.ring-num {
  position: absolute;
  top: 20px;
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
}

.ring-label {
  font-size: var(--fs-micro);
  color: var(--text-muted);
  white-space: nowrap;
}

.forecast {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 44%;
  min-width: 280px;
  padding-left: 12px;
  border-left: 1px solid var(--line-hair);
}

.forecast-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.forecast-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-tiny);
  color: var(--text-muted);
}

.forecast-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}

.dot {
  width: 6px;
  height: 6px;
  margin-left: 5px;
  border-radius: var(--r-pill);
}

.dot.is-cyan {
  background: var(--cyan);
}

.dot.is-risk {
  background: var(--risk);
}

.chart {
  flex: 1;
  min-height: 78px;
}

.forecast-note {
  flex: none;
  font-size: var(--fs-micro);
  color: var(--text-dim);
}
</style>
