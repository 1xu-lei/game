import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { RAIN_TYPES, SCENARIO_MAP, SCENARIOS } from '@/config/sites'
import { getRainTypeConfig, getScenarioConfig } from '@/services/api'
import type { DataSource, RainType, RainTypeConfig, ScenarioConfig, SceneId } from '@/types'

/**
 * 情境与场景配置（GET /api/config/*）
 * ---------------------------------------------------------------
 * 显示用配置（本地资产、色相）始终使用前端本地值：assets 是本地 SVG，
 * 不允许因接口缺字段而破图。数值与规则字段优先采用接口返回。
 */
export const useScenarioStore = defineStore('scenario', () => {
  const rainType = ref<RainType>('continuous')
  const selectedScene = ref<SceneId | null>(null)
  const scenarios = ref<ScenarioConfig[]>(SCENARIOS.map((s) => ({ ...s })))
  const rainTypes = ref<RainTypeConfig[]>(RAIN_TYPES.map((r) => ({ ...r })))
  const configSource = ref<DataSource>('preview')
  const configLoading = ref(false)

  const currentRain = computed(
    () => rainTypes.value.find((r) => r.id === rainType.value) ?? RAIN_TYPES[0],
  )

  const selectedConfig = computed(() =>
    selectedScene.value ? (scenarios.value.find((s) => s.id === selectedScene.value) ?? null) : null,
  )

  function setRainType(next: RainType): void {
    rainType.value = next
  }

  function selectScene(id: SceneId | null): void {
    selectedScene.value = id
  }

  function sceneOf(id: SceneId): ScenarioConfig {
    return scenarios.value.find((s) => s.id === id) ?? SCENARIO_MAP[id]
  }

  async function loadConfig(): Promise<void> {
    configLoading.value = true
    try {
      const [remoteScenes, remoteRains] = await Promise.all([
        getScenarioConfig(),
        getRainTypeConfig(),
      ])
      if (Array.isArray(remoteScenes) && remoteScenes.length > 0) {
        scenarios.value = remoteScenes.map((s) => {
          const local = SCENARIO_MAP[s.id]
          return local ? { ...local, ...s, asset: local.asset, accentVar: local.accentVar } : s
        })
      }
      if (Array.isArray(remoteRains) && remoteRains.length > 0) {
        rainTypes.value = remoteRains.map((r) => {
          const local = RAIN_TYPES.find((item) => item.id === r.id)
          return local ? { ...local, ...r, asset: local.asset } : r
        })
      }
      configSource.value = 'backend'
    } catch {
      configSource.value = 'preview'
    } finally {
      configLoading.value = false
    }
  }

  return {
    rainType,
    rainTypes,
    currentRain,
    scenarios,
    selectedScene,
    selectedConfig,
    configSource,
    configLoading,
    setRainType,
    selectScene,
    sceneOf,
    loadConfig,
  }
})
