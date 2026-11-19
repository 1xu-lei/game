<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ForecastPoint } from '@/types'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

/**
 * 城市状态预测双线（积水风险 / 损失概率）。
 * series 全部来自 result.forecast，组件内不做任何插值或估算。
 */
const props = withDefaults(
  defineProps<{ points: ForecastPoint[]; height?: number; legend?: boolean; compact?: boolean }>(),
  { height: 132, legend: true, compact: false },
)

const host = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function buildOption() {
  const labels = props.points.map((p) => p.step)
  return {
    animationDuration: 320,
    grid: {
      left: props.compact ? 30 : 38,
      right: 10,
      top: props.legend ? 26 : 10,
      bottom: props.compact ? 18 : 22,
    },
    legend: props.legend
      ? {
          right: 0,
          top: 0,
          itemWidth: 8,
          itemHeight: 8,
          itemGap: 12,
          textStyle: { color: '#91A9BC', fontSize: 10 },
          icon: 'roundRect',
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16,34,53,0.96)',
      borderColor: '#24435D',
      borderWidth: 1,
      textStyle: { color: '#E7F0F7', fontSize: 11 },
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(56,189,248,0.45)' } },
      valueFormatter: (v: number) => `${v}`,
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#24435D' } },
      axisTick: { show: false },
      axisLabel: { show: !props.compact, color: '#91A9BC', fontSize: 10, interval: 0 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 0,
      splitNumber: 2,
      axisLabel: { color: '#6F8AA1', fontSize: 10, formatter: '{value}' },
      splitLine: { lineStyle: { color: 'rgba(36,67,93,0.55)', type: 'dashed' } },
    },
    series: [
      {
        name: '积水风险',
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: !props.compact,
        data: props.points.map((p) => p.waterlog),
        lineStyle: { width: 1.9, color: '#38BDF8' },
        itemStyle: { color: '#38BDF8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56,189,248,0.26)' },
            { offset: 1, color: 'rgba(56,189,248,0)' },
          ]),
        },
      },
      {
        name: '损失概率',
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: !props.compact,
        data: props.points.map((p) => p.loss),
        lineStyle: { width: 1.9, color: '#F08B36' },
        itemStyle: { color: '#F08B36' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(240,139,54,0.2)' },
            { offset: 1, color: 'rgba(240,139,54,0)' },
          ]),
        },
      },
    ],
  } as echarts.EChartsCoreOption
}

onMounted(() => {
  if (!host.value) return
  chart = echarts.init(host.value, undefined, { renderer: 'canvas' })
  chart.setOption(buildOption())
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(host.value)
})

watch(
  () => props.points,
  () => chart?.setOption(buildOption(), { notMerge: false }),
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="host" class="chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.chart {
  width: 100%;
  min-width: 0;
}
</style>
