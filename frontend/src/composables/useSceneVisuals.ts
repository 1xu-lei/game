import type { Component } from 'vue'
import { Building2, GraduationCap, Store, TramFront, Trees } from 'lucide-vue-next'
import type { SceneId } from '@/types'

/**
 * 场景视觉映射：图标 / 专属色相 / 底栏环形指标名称。
 * 只做「同一场景在各处长得一样」的收敛，避免图标与颜色散落在各组件里。
 */
const ICON: Record<SceneId, Component> = {
  school: GraduationCap,
  market: Store,
  park: Trees,
  residential: Building2,
  station: TramFront,
}

const ACCENT: Record<SceneId, string> = {
  school: 'var(--scene-school)',
  market: 'var(--scene-market)',
  park: 'var(--scene-park)',
  residential: 'var(--scene-residential)',
  station: 'var(--scene-station)',
}

const RING_LABEL: Record<SceneId, string> = {
  school: '学校安全',
  market: '集市保障',
  park: '公园调蓄',
  residential: '居民区安全',
  station: '车站排水',
}

export function useSceneVisuals() {
  const iconOf = (id: SceneId): Component => ICON[id]
  const accentOf = (id: SceneId): string => ACCENT[id]
  const ringLabelOf = (id: SceneId): string => RING_LABEL[id]
  return { iconOf, accentOf, ringLabelOf }
}

/** 本地资产路径（frontend/public 下），禁止外链图片 */
export function assetUrl(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}
