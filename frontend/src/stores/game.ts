import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AllocationMap, RainType, SceneId, SimulationResult } from '@/types'
import { SCENARIOS } from '@/config/sites'
import { BASELINE_ALLOCATION, runPreview, totalAllocated, validateAllocation } from '@/engine/previewEngine'

/**
 * 唯一状态入口（规格书 §6.5：资源控件只调 action，不跨组件直改状态）
 * ---------------------------------------------------------------
 * 组件从这里拿「已经算好的结果对象」，不认识任何评分规则。
 */
export const useGameStore = defineStore('game', () => {
  const rainType = ref<RainType>('continuous')
  const allocation = ref<AllocationMap>({ ...BASELINE_ALLOCATION })
  const selectedScene = ref<SceneId | null>(null)
  const hoveredScene = ref<SceneId | null>(null)
  const rainLayerOn = ref(true)

  /** 当前配置的预览结果：随分配/雨型立即重算，纯确定性 */
  const preview = computed<SimulationResult>(() => runPreview(allocation.value, rainType.value))

  /** 雨量强度 0–1：只驱动降雨可视化层，不参与任何规则计算 */
  const rainIntensity = computed(() => (rainType.value === 'burst' ? 0.92 : 0.55))

  const total = computed(() => totalAllocated(allocation.value))
  const remaining = computed(() => 5 - total.value)
  const validationMessage = computed(() => validateAllocation(allocation.value))
  const canSimulate = computed(() => validationMessage.value === null)

  const selectedResult = computed(() =>
    preview.value.scenarioResults.find((r) => r.sceneId === selectedScene.value) ?? null,
  )

  function setRain(next: RainType) {
    rainType.value = next
  }

  function selectScene(id: SceneId | null) {
    selectedScene.value = selectedScene.value === id ? null : id
  }

  function setHover(id: SceneId | null) {
    hoveredScene.value = id
  }

  /** 加点：受「每场景 ≤5」与「总量 ≤5」双重约束，越界直接拒绝（不是静默失败） */
  function increase(id: SceneId) {
    if (allocation.value[id] >= 5) return
    if (totalAllocated(allocation.value) >= 5) return
    allocation.value = { ...allocation.value, [id]: allocation.value[id] + 1 }
  }

  function decrease(id: SceneId) {
    if (allocation.value[id] <= 0) return
    allocation.value = { ...allocation.value, [id]: allocation.value[id] - 1 }
  }

  function reset() {
    allocation.value = { school: 0, market: 0, park: 0, residential: 0, station: 0 }
  }

  function fillBalanced() {
    allocation.value = { ...BASELINE_ALLOCATION }
  }

  /** 某场景可否加点 / 减点：供 UI 显示「为什么不能」的文案 */
  function incBlockReason(id: SceneId): string | null {
    if (allocation.value[id] >= 5) return `${SCENARIOS.find((s) => s.id === id)!.name}已到 5 点上限`
    if (totalAllocated(allocation.value) >= 5) return '5 点已分完，请先从其他场景收回'
    return null
  }

  function decBlockReason(id: SceneId): string | null {
    return allocation.value[id] <= 0 ? '该场景已是无专项投入（0 点）' : null
  }

  return {
    rainType,
    allocation,
    selectedScene,
    hoveredScene,
    rainLayerOn,
    preview,
    rainIntensity,
    total,
    remaining,
    validationMessage,
    canSimulate,
    selectedResult,
    setRain,
    selectScene,
    setHover,
    increase,
    decrease,
    reset,
    fillBalanced,
    incBlockReason,
    decBlockReason,
  }
})
