import type { SceneId, VariantId } from '@/types'

/**
 * 场景节点坐标表（唯一真源，禁止在组件里散落魔法数字）
 * ---------------------------------------------------------------
 * 百分比相对中央舞台容器；x/y 为节点锚点（图标中心），标签向 anchor 侧展开。
 * 三套坐标分别对应三个设计版本的舞台比例，节点顺序始终固定为五个场景。
 */
export interface NodeAnchor {
  id: SceneId
  x: number
  y: number
  /** 标签展开方向：避免标签互相压盖 */
  label: 'left' | 'right' | 'top' | 'bottom'
}

/** A · 雨夜指挥台：三栏之间较窄的舞台，节点沿河网与道路分布 */
const LAYOUT_A: NodeAnchor[] = [
  { id: 'school', x: 27, y: 30, label: 'right' },
  { id: 'market', x: 22, y: 63, label: 'right' },
  { id: 'park', x: 66, y: 25, label: 'left' },
  { id: 'residential', x: 73, y: 55, label: 'left' },
  { id: 'station', x: 50, y: 81, label: 'top' },
]

/** B · 沉浸全景：全屏舞台，节点更分散，标签更靠外 */
const LAYOUT_B: NodeAnchor[] = [
  { id: 'school', x: 24, y: 27, label: 'right' },
  { id: 'market', x: 18, y: 60, label: 'right' },
  { id: 'park', x: 64, y: 21, label: 'left' },
  { id: 'residential', x: 78, y: 50, label: 'left' },
  { id: 'station', x: 49, y: 78, label: 'top' },
]

/** C · 水文仪：示意图坐标系（SVG viewBox 0 0 100 100），从上游到下游自左向右 */
const LAYOUT_C: NodeAnchor[] = [
  { id: 'school', x: 16, y: 24, label: 'bottom' },
  { id: 'market', x: 16, y: 66, label: 'right' },
  { id: 'park', x: 50, y: 26, label: 'bottom' },
  { id: 'residential', x: 50, y: 70, label: 'bottom' },
  { id: 'station', x: 84, y: 48, label: 'left' },
]

export const NODE_LAYOUTS: Record<VariantId, NodeAnchor[]> = {
  a: LAYOUT_A,
  b: LAYOUT_B,
  c: LAYOUT_C,
}
