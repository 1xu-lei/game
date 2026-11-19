import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { EMPTY_ALLOCATION, totalAllocated, validateAllocation } from '@/engine/previewEngine'
import { TOTAL_POINTS } from '@/config/sites'
import type { AllocationMap, SceneId } from '@/types'

/**
 * 资源分配状态（规格书 §3.1）
 * ---------------------------------------------------------------
 * 唯一写入口：本 store 的 action。组件不得直接修改 allocation。
 * 规则校验交给 engine/previewEngine.validateAllocation，组件不复制规则。
 */
export const useAllocationStore = defineStore('allocation', () => {
  const allocation = ref<AllocationMap>({ ...EMPTY_ALLOCATION })

  const used = computed(() => totalAllocated(allocation.value))
  const remaining = computed(() => TOTAL_POINTS - used.value)
  const isFull = computed(() => used.value >= TOTAL_POINTS)
  const validationMessage = computed(() => validateAllocation(allocation.value))
  const isValid = computed(() => validationMessage.value === null)

  /** 单场景设定 0–5 整数；资源用尽时只允许下调 */
  function setPoints(sceneId: SceneId, points: number): void {
    const next = Math.min(TOTAL_POINTS, Math.max(0, Math.trunc(points)))
    const current = allocation.value[sceneId]
    if (next === current) return
    if (next > current && isFull.value) return
    allocation.value = { ...allocation.value, [sceneId]: next }
  }

  const increment = (sceneId: SceneId): void => {
    setPoints(sceneId, allocation.value[sceneId] + 1)
  }

  const decrement = (sceneId: SceneId): void => {
    setPoints(sceneId, allocation.value[sceneId] - 1)
  }

  function reset(): void {
    allocation.value = { ...EMPTY_ALLOCATION }
  }

  return {
    allocation,
    used,
    remaining,
    isFull,
    isValid,
    validationMessage,
    setPoints,
    increment,
    decrement,
    reset,
  }
})
