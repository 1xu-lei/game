/**
 * 城市全景底图（主界面中央舞台的背景）
 * ---------------------------------------------------------------
 * 构图规则（改图前先读）：
 *   1. 河网斜穿画面，车站落在临河低洼侧 —— 叙事上解释「最终压力承受点」
 *   2. 道路带之间必须留出街区净宽，禁止道路横穿建筑
 *   3. 五大街区位置与 nodeLayout.ts 中的节点坐标必须能对上号
 *   4. 全图无文字：所有标注由 HTML 浮层承担，避免缩放后失真
 */
import { createIso, mulberry32, rgba, svgDoc } from './iso.mjs'

const VW = 1200
const VH = 760
const S = 34
const GREEN = '#2F7A5E'

export const cityOverview = () => {
  const iso = createIso({ scale: S, originX: 600, originY: 250 })
  const rng = mulberry32(101)
  const { plate, patch, box, windows, tree, lamp, puddle, road, water, car, rain, defs, p } = iso
  const out = []

  out.push(plate({ x: 0, y: 0, w: 14, d: 11, color: '#101F30', thick: 0.8, shadow: true }))

  // —— 河网：主河道 + 一条支流，作为城市排水骨架
  out.push(water({ x: 0, y: 7.6, w: 14, d: 1.4, rng, base: '#0E3B4A' }))
  out.push(water({ x: 3.0, y: 3.6, w: 0.9, d: 4.0, rng, base: '#0E3B4A' }))

  // —— 道路骨架（横向两条 / 纵向两条，纵向那条跨河即为桥）
  out.push(road({ x: 0, y: 2.4, len: 14, width: 1.1, color: '#182B3F' }))
  out.push(road({ x: 0, y: 5.6, len: 14, width: 1.0, color: '#182B3F' }))
  out.push(road({ x: 4.6, y: 0, len: 2.4, width: 1.0, dir: 'y', color: '#182B3F' }))
  out.push(road({ x: 9.8, y: 0, len: 10.8, width: 1.0, dir: 'y', color: '#182B3F' }))

  // 桥面：跨河段的铺装 + 栏杆，读起来才像桥而不是路压在水上
  out.push(box({ x: 9.75, y: 7.4, w: 1.1, d: 1.6, h: 0.16, color: '#31506A', rim: true }))
  for (let k = 0; k < 2; k++) {
    out.push(box({ x: 9.75 + k * 1.0, y: 7.45, w: 0.1, d: 1.5, h: 0.42, color: '#3E5F7C', rim: false }))
  }

  // —— 学校街区（左上）：教学楼 + 跑道
  out.push(patch({ x: 0.4, y: 0.4, w: 3.6, d: 1.8, z: 0.04, fill: '#183044' }))
  out.push(box({ x: 0.7, y: 0.6, w: 1.9, d: 1.1, h: 3.4, color: '#24405C', shadow: true }))
  out.push(windows({ face: 'right', x: 0.7, y: 0.6, w: 1.9, d: 1.1, h: 3.4, rows: 4, cols: 3, rng, litChance: 0.3 }))
  out.push(windows({ face: 'left', x: 0.7, y: 0.6, w: 1.9, d: 1.1, h: 3.4, rows: 4, cols: 5, rng, litChance: 0.2, winW: 0.1 }))
  const track = p(2.85, 1.4, 0.05)
  const trackEll = (R, fill) =>
    `<ellipse cx="${track[0].toFixed(1)}" cy="${track[1].toFixed(1)}" rx="${(R * 1.2247 * S).toFixed(1)}" ry="${(R * 0.7071 * S).toFixed(1)}" fill="${fill}"/>`
  out.push(trackEll(0.72, '#27435C'))
  out.push(trackEll(0.55, '#2B7355'))

  // —— 公园（右上）：水面 + 树群
  out.push(patch({ x: 5.4, y: 0.4, w: 4.2, d: 1.8, z: 0.04, fill: '#1D3B33' }))
  out.push(water({ x: 6.4, y: 0.7, w: 2.2, d: 1.1, rng, base: '#0E3B4A' }))
  ;[
    [5.7, 0.8, 1.6],
    [5.9, 1.7, 1.3],
    [9.2, 0.9, 1.5],
    [9.3, 1.8, 1.2],
  ].forEach(([x, y, h]) => out.push(tree({ x, y, h, r: 0.46, color: GREEN })))

  // —— 集市（左中）：摊位棚顶是整张图的暖光节奏点
  out.push(patch({ x: 0.4, y: 3.6, w: 3.6, d: 1.9, z: 0.04, fill: '#26262B' }))
  out.push(box({ x: 0.6, y: 3.7, w: 1.1, d: 1.5, h: 2.1, color: '#1D3550', shadow: true }))
  out.push(windows({ face: 'right', x: 0.6, y: 3.7, w: 1.1, d: 1.5, h: 2.1, rows: 2, cols: 3, rng, litChance: 0.55 }))
  for (let i = 0; i < 4; i++) {
    const x = 2.0 + (i % 2) * 0.9
    const y = 3.85 + Math.floor(i / 2) * 0.85
    out.push(box({ x, y, w: 0.66, d: 0.66, h: 0.42, color: '#2B4763', rim: false }))
    out.push(box({ x: x - 0.05, y: y - 0.05, z: 0.92, w: 0.76, d: 0.76, h: 0.07, color: i % 2 ? '#2DD4BF' : '#F5B544', rim: false }))
  }

  // —— 居民区（右侧）：两排竖楼，窗格密度最高
  out.push(patch({ x: 10.9, y: 3.4, w: 2.9, d: 4.0, z: 0.04, fill: '#17293D' }))
  const towers = [
    { x: 11.0, y: 3.5, w: 1.1, d: 1.1, h: 4.8, c: '#24405C' },
    { x: 12.3, y: 3.6, w: 1.1, d: 1.1, h: 5.6, c: '#1D3550' },
    { x: 11.1, y: 4.9, w: 1.1, d: 1.1, h: 3.6, c: '#17293D' },
    { x: 12.3, y: 5.0, w: 1.1, d: 1.1, h: 4.2, c: '#24405C' },
    { x: 11.0, y: 6.9, w: 1.1, d: 1.1, h: 4.4, c: '#1D3550' },
    { x: 12.3, y: 6.9, w: 1.1, d: 1.1, h: 5.0, c: '#17293D' },
  ]
  towers.forEach((t) => {
    out.push(box({ ...t, color: t.c, shadow: true }))
    out.push(windows({ face: 'right', ...t, rows: Math.round(t.h / 0.7), cols: 3, rng, litChance: 0.26, cyanChance: 0.08 }))
    out.push(windows({ face: 'left', ...t, rows: Math.round(t.h / 0.7), cols: 3, rng, litChance: 0.18, cyanChance: 0.06, winW: 0.1 }))
  })

  // —— 车站（下方临河低洼）：站房 + 大跨雨棚 + 积水
  out.push(patch({ x: 3.2, y: 9.0, w: 5.2, d: 1.8, z: 0.04, fill: '#1B3247' }))
  out.push(box({ x: 3.4, y: 9.02, w: 5.0, d: 0.14, h: 0.2, color: '#2F4A5C', rim: false }))
  out.push(box({ x: 3.7, y: 9.5, w: 3.4, d: 1.0, h: 2.2, color: '#24405C', shadow: true }))
  out.push(windows({ face: 'right', x: 3.7, y: 9.5, w: 3.4, d: 1.0, h: 2.2, rows: 2, cols: 4, rng, litChance: 0.7, cyanChance: 0.16 }))
  out.push(box({ x: 3.65, y: 10.35, z: 2.2, w: 3.5, d: 0.55, h: 0.11, color: '#2C4459', rim: false }))
  out.push(box({ x: 7.6, y: 8.2, w: 1.0, d: 0.9, h: 1.2, color: '#17293D', shadow: true }))
  out.push(puddle({ x: 5.4, y: 10.6, rx: 1.7, ry: 0.55, color: '#F08B36', opacity: 0.2 }))
  out.push(puddle({ x: 8.4, y: 9.8, rx: 1.0, ry: 0.36, opacity: 0.22 }))

  // —— 灯点 / 车辆：给尺度感，也形成缩略图上的暖点节奏
  ;[
    [1.2, 2.5],
    [3.6, 2.5],
    [6.0, 2.5],
    [8.4, 2.5],
    [11.0, 2.5],
    [1.4, 5.7],
    [6.2, 5.7],
    [11.2, 5.7],
    [3.2, 9.0],
    [8.9, 9.0],
  ].forEach(([x, y]) => out.push(lamp({ x, y, h: 1.4 })))
  out.push(car({ x: 5.4, y: 2.7, dir: 'x' }))
  out.push(car({ x: 7.6, y: 5.9, dir: 'x', color: '#33526E' }))
  out.push(car({ x: 10.05, y: 4.2, dir: 'y', color: '#2B4763' }))

  const bg = `<rect width="${VW}" height="${VH}" fill="#071321"/><rect width="${VW}" height="${VH}" fill="url(#ambient)"/>`
  return svgDoc(VW, VH, defs({ accent: '#38BDF8' }) + bg + out.join('') + rain({ count: 90, w: VW, h: VH, seed: 5, maxLen: 26 }))
}
