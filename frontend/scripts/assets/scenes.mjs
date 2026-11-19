/**
 * 六个场景资产 + 两张雨型缩略图
 * ---------------------------------------------------------------
 * 统一要素（每张都必须具备，保证像同一套美术）：
 *   1. 同一个 2:1 等距投影、底板厚度、投影方向
 *   2. 同一套「顶面亮 / 左侧中 / 右侧暗」光照与窗光配比
 *   3. 同一个环境光晕 + 12° 雨丝 + 汗青/琥珀双色地面反射
 *   4. 每个场景一个可辨识的轮廓剪影（缩略图 44px 也要认得出）
 *   5. 无文字、无 emoji、不外链任何资源
 */
import { createIso, mulberry32, rgba, shade, svgDoc } from './iso.mjs'

const W = 520
const H = 400
const S = 26

const BASE = '#12263A'
const WALL = '#24405C'
const WALL_2 = '#1D3550'
const WALL_3 = '#17293D'
const ROAD = '#1A2E44'
const GREEN = '#2F7A5E'

function shell({ seed, accent, body, rainCount = 40 }) {
  const iso = createIso({ scale: S, originX: 260, originY: 228 })
  const bg = `<rect width="${W}" height="${H}" fill="#08151F"/><rect width="${W}" height="${H}" fill="url(#ambient)"/>`
  return svgDoc(W, H, iso.defs({ accent }) + bg + body(iso) + iso.rain({ count: rainCount, w: W, h: H, seed }))
}

/* ---------------------------------------------------------------- 学校 */
export const school = () =>
  shell({
    seed: 11,
    accent: '#38BDF8',
    rainCount: 34,
    body: ({ plate, patch, box, windows, tree, lamp, puddle, road, p }) => {
      const rng = mulberry32(3)
      const out = [plate({ x: 0, y: 0, w: 10, d: 10, color: BASE, rng })]

      // 透水操场（右前场）：青底 + 透水缝
      out.push(patch({ x: 4.2, y: 5.4, w: 5.2, d: 4.2, z: 0.04, fill: '#1C3A4E', stroke: rgba('#38BDF8', 0.28) }))
      for (let i = 0; i < 5; i++) {
        out.push(patch({ x: 4.4 + i, y: 5.6, w: 0.06, d: 3.8, z: 0.05, fill: rgba('#38BDF8', 0.16) }))
      }

      // 塑胶跑道：环路 + 内场草坪 + 分道线（同心椭圆，圆心必须一致）
      const c = p(6.4, 7.4, 0.06)
      const ell = (R, fill, extra = '') =>
        `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(R * 1.2247 * S).toFixed(1)}" ry="${(R * 0.7071 * S).toFixed(1)}" fill="${fill}" ${extra}/>`
      out.push(ell(2.0, '#3A5C74'))
      out.push(ell(1.88, '#27435C'))
      out.push(ell(1.52, '#2B7355'))
      out.push(ell(1.34, '#2F8060'))
      for (const R of [1.58, 1.7, 1.82]) {
        out.push(ell(R, 'none', `stroke="${rgba('#8FC7E8', 0.2)}" stroke-width="1.1"`))
      }
      out.push(
        `<path d="M${(c[0] - 1.34 * 1.2247 * S).toFixed(1)} ${c[1].toFixed(1)} h${(2.68 * 1.2247 * S).toFixed(1)}" stroke="${rgba('#E7F0F7', 0.18)}" stroke-width="1.2"/>`,
      )

      // 教学楼（L 形）+ 屋顶设备
      out.push(box({ x: 1.5, y: 1.5, w: 3.6, d: 1.5, h: 4.5, color: WALL, shadow: true }))
      out.push(windows({ face: 'right', x: 1.5, y: 1.5, w: 3.6, d: 1.5, h: 4.5, rows: 5, cols: 5, rng, litChance: 0.3, cyanChance: 0.08 }))
      out.push(windows({ face: 'left', x: 1.5, y: 1.5, w: 3.6, d: 1.5, h: 4.5, rows: 5, cols: 11, rng, litChance: 0.16, cyanChance: 0.06, winW: 0.1 }))
      out.push(box({ x: 1.5, y: 3.0, w: 1.6, d: 1.7, h: 3.1, color: WALL_2 }))
      out.push(windows({ face: 'right', x: 1.5, y: 3.0, w: 1.6, d: 1.7, h: 3.1, rows: 3, cols: 3, rng, litChance: 0.34 }))
      out.push(box({ x: 2.4, y: 2.0, z: 4.5, w: 1.1, d: 0.7, h: 0.5, color: '#2B4763', rim: false }))

      // 校门 + 避险通道（虚线指向校园内部疏散点）
      out.push(box({ x: 8.2, y: 2.4, w: 0.5, d: 1.4, h: 1.5, color: WALL_3 }))
      out.push(
        `<path d="M${p(7.9, 3.1, 0.08)[0]} ${p(7.9, 3.1, 0.08)[1]} L${p(5.4, 3.1, 0.08)[0]} ${p(5.4, 3.1, 0.08)[1]} L${p(5.4, 5.0, 0.08)[0]} ${p(5.4, 5.0, 0.08)[1]}" fill="none" stroke="${rgba('#38BDF8', 0.75)}" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"/>`,
      )

      out.push(road({ x: 0, y: 4.5, len: 10, width: 1.0, color: ROAD }))
      ;[
        [7.9, 1.6],
        [8.8, 2.6],
        [7.4, 2.2],
      ].forEach(([x, y], i) => out.push(tree({ x, y, h: 1.7 + i * 0.2, r: 0.48, color: GREEN })))
      ;[
        [4.0, 4.6],
        [8.9, 4.6],
      ].forEach(([x, y]) => out.push(lamp({ x, y, h: 1.7 })))

      // 积水：操场边缘 + 校门口低洼
      out.push(puddle({ x: 4.6, y: 8.6, rx: 0.9, ry: 0.4, opacity: 0.3 }))
      out.push(puddle({ x: 8.4, y: 4.2, rx: 0.6, ry: 0.28, opacity: 0.34 }))
      out.push(puddle({ x: 3.2, y: 9.2, rx: 0.5, ry: 0.24, opacity: 0.22 }))
      return out.join('')
    },
  })

/* ---------------------------------------------------------------- 集市 */
export const market = () =>
  shell({
    seed: 23,
    accent: '#F5B544',
    rainCount: 44,
    body: ({ plate, patch, box, windows, tree, lamp, puddle, road, p }) => {
      const rng = mulberry32(9)
      const out = [plate({ x: 0, y: 0, w: 10, d: 10, color: BASE, rng })]

      // 商业骑楼
      out.push(box({ x: 6.3, y: 1.6, w: 2.9, d: 2.2, h: 3.7, color: WALL, shadow: true }))
      out.push(windows({ face: 'right', x: 6.3, y: 1.6, w: 2.9, d: 2.2, h: 3.7, rows: 3, cols: 4, rng, litChance: 0.42, cyanChance: 0.06 }))
      out.push(windows({ face: 'left', x: 6.3, y: 1.6, w: 2.9, d: 2.2, h: 3.7, rows: 3, cols: 8, rng, litChance: 0.3, cyanChance: 0.05, winW: 0.12 }))
      // 底层雨棚
      out.push(box({ x: 6.2, y: 3.7, z: 0.9, w: 3.1, d: 0.9, h: 0.12, color: '#8A5A22', rim: false }))

      // 摊位群：条纹雨棚 + 台面
      const stalls = [
        [1.7, 5.4, '#F5B544'],
        [3.2, 5.9, '#2DD4BF'],
        [4.7, 5.4, '#F5B544'],
        [1.9, 7.1, '#2DD4BF'],
        [3.5, 7.6, '#F5B544'],
      ]
      stalls.forEach(([x, y, awning], i) => {
        out.push(box({ x, y, w: 1.15, d: 0.95, h: 0.55, color: WALL_2, rim: false }))
        out.push(patch({ x: x + 0.06, y: y + 0.06, w: 1.03, d: 0.83, z: 0.56, fill: rgba('#E7F0F7', 0.1) }))
        out.push(patch({ x: x + 0.05, y: y + 0.05, w: 0.06, d: 0.06, z: 0.56, fill: rgba('#91A9BC', 0.5) }))
        // 雨棚（薄板 + 三道条纹）
        out.push(box({ x: x - 0.08, y: y - 0.08, z: 1.32, w: 1.31, d: 1.11, h: 0.1, color: awning, rim: true }))
        for (let k = 0; k < 3; k++) {
          out.push(patch({ x: x + 0.1 + k * 0.38, y: y - 0.06, w: 0.16, d: 1.07, z: 1.43, fill: rgba(shade(awning, 0.55), 0.55) }))
        }
        out.push(patch({ x: x - 0.06, y: y + 0.9, w: 0.08, d: 0.08, z: 0.56, fill: rgba('#91A9BC', 0.42) }))
        if (i % 2 === 0) out.push(puddle({ x: x + 0.5, y: y + 1.15, rx: 0.5, ry: 0.22, color: awning, opacity: 0.2 }))
      })

      // 地下蓄水池检修口（集市的核心工程手段）
      const g = p(7.0, 5.6, 0.06)
      out.push(
        `<ellipse cx="${g[0].toFixed(1)}" cy="${g[1].toFixed(1)}" rx="${(0.95 * 1.2247 * S).toFixed(1)}" ry="${(0.95 * 0.7071 * S).toFixed(1)}" fill="#16324A" stroke="${rgba('#2DD4BF', 0.5)}" stroke-width="1.4"/>`,
      )
      out.push(
        `<ellipse cx="${g[0].toFixed(1)}" cy="${g[1].toFixed(1)}" rx="${(0.62 * 1.2247 * S).toFixed(1)}" ry="${(0.62 * 0.7071 * S).toFixed(1)}" fill="none" stroke="${rgba('#2DD4BF', 0.28)}" stroke-width="1"/>`,
      )
      for (let k = -2; k <= 2; k++) {
        out.push(
          `<path d="M${(g[0] - 0.9 * S * 0.87).toFixed(1)} ${(g[1] + k * 6).toFixed(1)} h${(1.55 * S * 0.87).toFixed(1)}" stroke="${rgba('#91A9BC', 0.3)}" stroke-width="1"/>`,
        )
      }

      // 货箱
      ;[
        [5.5, 6.9, '#3C5A76'],
        [5.9, 6.6, '#2B4763'],
      ].forEach(([x, y, col]) => out.push(box({ x, y, w: 0.42, d: 0.42, h: 0.36, color: col, rim: false })))

      out.push(road({ x: 0, y: 4.2, len: 10, width: 1.05, color: ROAD }))
      out.push(road({ x: 5.9, y: 0, len: 10, width: 0.9, dir: 'y', color: ROAD }))
      out.push(tree({ x: 0.9, y: 1.7, h: 1.6, r: 0.46, color: GREEN }))
      out.push(tree({ x: 9.1, y: 8.4, h: 1.5, r: 0.44, color: GREEN }))
      out.push(lamp({ x: 1.2, y: 4.5, h: 1.8 }))
      out.push(lamp({ x: 8.9, y: 4.5, h: 1.8 }))

      // 湿滑地面反射（琥珀，呼应雨夜摊灯）
      out.push(patch({ x: 1.4, y: 5.3, w: 4.2, d: 3.1, z: 0.045, fill: rgba('#F5B544', 0.05) }))
      out.push(puddle({ x: 6.9, y: 4.6, rx: 0.8, ry: 0.34, color: '#F5B544', opacity: 0.18 }))
      out.push(puddle({ x: 2.4, y: 8.8, rx: 1.0, ry: 0.42, opacity: 0.3 }))
      return out.join('')
    },
  })

/* ---------------------------------------------------------------- 公园 */
export const park = () =>
  shell({
    seed: 31,
    accent: '#4CCB86',
    rainCount: 30,
    body: ({ plate, patch, box, water, tree, lamp, puddle, field, p }) => {
      const rng = mulberry32(17)
      const out = [plate({ x: 0, y: 0, w: 10, d: 10, color: BASE, rng })]

      out.push(patch({ x: 0.6, y: 0.6, w: 8.8, d: 8.8, z: 0.04, fill: '#1D3B33' }))

      // 主环路（折线步道）
      const walk = [
        [1.2, 8.4],
        [3.4, 7.2],
        [4.6, 5.2],
        [4.4, 2.8],
        [2.6, 1.4],
      ]
      for (let i = 0; i < walk.length - 1; i++) {
        const [x0, y0] = walk[i]
        const [x1, y1] = walk[i + 1]
        out.push(
          `<path d="M${p(x0, y0, 0.06)[0]} ${p(x0, y0, 0.06)[1]} L${p(x1, y1, 0.06)[0]} ${p(x1, y1, 0.06)[1]}" stroke="${rgba('#91A9BC', 0.32)}" stroke-width="${(0.34 * S).toFixed(1)}" stroke-linecap="round"/>`,
        )
      }

      // 下凹绿地：三层退台，剖面能读出「下沉调蓄」
      const sunken = [
        [2.4, 4.2, 3.9, 3.0, '#24564A', 0.05],
        [2.75, 4.55, 3.2, 2.3, '#1F6650', 0.03],
        [3.15, 4.95, 2.4, 1.5, '#17614B', 0.0],
      ]
      sunken.forEach(([x, y, w, d, fill, z]) => {
        out.push(patch({ x, y, w, d, z, fill, stroke: rgba('#4CCB86', 0.22) }))
      })
      // 洼地内雨水花园丛
      for (let i = 0; i < 16; i++) {
        const x = 2.6 + rng() * 3.2
        const y = 4.3 + rng() * 2.4
        const h = 0.26 + rng() * 0.22
        const base = p(x, y, 0.02)
        const top = p(x, y, h)
        out.push(
          `<path d="M${base[0]} ${base[1]} L${top[0]} ${top[1]}" stroke="${rgba('#4CCB86', 0.42)}" stroke-width="1.1" stroke-linecap="round"/>`,
        )
      }

      // 中心水面 + 木栈道
      out.push(patch({ x: 6.0, y: 5.4, w: 3.6, d: 3.0, z: 0.05, fill: '#14414F' }))
      out.push(water({ x: 6.1, y: 5.5, w: 3.4, d: 2.8, rng, base: '#0E3B4A' }))
      out.push(patch({ x: 5.9, y: 6.4, w: 1.5, d: 0.5, z: 0.09, fill: '#3E5A72' }))
      for (let k = 0; k < 5; k++) {
        out.push(patch({ x: 6.0 + k * 0.28, y: 6.42, w: 0.05, d: 0.46, z: 0.1, fill: rgba('#0F2436', 0.6) }))
      }

      // 树群：疏密对比，避免平均分布
      ;[
        [1.5, 1.9, 1.9, 0.58],
        [2.6, 1.4, 1.5, 0.46],
        [1.3, 3.3, 1.4, 0.44],
        [0.9, 6.2, 1.7, 0.5],
        [7.4, 1.8, 1.8, 0.54],
        [8.4, 2.9, 1.4, 0.44],
        [8.7, 6.7, 1.6, 0.5],
        [7.2, 8.7, 1.9, 0.56],
        [5.2, 9.0, 1.4, 0.44],
        [9.3, 9.0, 1.3, 0.4],
      ].forEach(([x, y, h, r]) => out.push(tree({ x, y, h, r, color: GREEN })))

      out.push(box({ x: 5.0, y: 8.1, w: 0.7, d: 0.22, h: 0.14, color: '#3C5A76', rim: false }))
      out.push(lamp({ x: 4.6, y: 2.2, h: 1.7 }))
      out.push(lamp({ x: 6.0, y: 8.9, h: 1.7 }))

      // 洼地与步道渍水
      out.push(puddle({ x: 4.4, y: 5.7, rx: 1.0, ry: 0.42, opacity: 0.24, color: '#2DD4BF' }))
      out.push(puddle({ x: 2.2, y: 8.8, rx: 0.7, ry: 0.3, opacity: 0.2 }))
      void field
      return out.join('')
    },
  })

/* ------------------------------------------------------------- 居民区 */
export const residential = () =>
  shell({
    seed: 41,
    accent: '#2DD4BF',
    rainCount: 38,
    body: ({ plate, patch, box, windows, tree, lamp, puddle, road, car, p }) => {
      const rng = mulberry32(29)
      const out = [plate({ x: 0, y: 0, w: 10, d: 10, color: BASE, rng })]

      const towers = [
        { x: 0.9, y: 0.9, w: 2.0, d: 1.9, h: 5.4, c: WALL },
        { x: 3.4, y: 1.3, w: 1.8, d: 1.7, h: 4.6, c: WALL_2 },
        { x: 6.0, y: 0.9, w: 2.1, d: 1.8, h: 5.9, c: WALL_3 },
        { x: 1.6, y: 4.4, w: 1.7, d: 1.6, h: 3.6, c: WALL_2 },
        { x: 7.2, y: 4.3, w: 1.8, d: 1.7, h: 4.2, c: WALL },
      ]
      towers.forEach((t, i) => {
        out.push(box({ ...t, color: t.c, shadow: true }))
        out.push(windows({ face: 'right', ...t, rows: Math.round(t.h / 0.8), cols: Math.round(t.d / 0.34), rng, litChance: 0.26, cyanChance: 0.09 }))
        out.push(windows({ face: 'left', ...t, rows: Math.round(t.h / 0.8), cols: Math.round(t.w / 0.46), rng, litChance: 0.17, cyanChance: 0.06, winW: 0.11 }))
        // 阳台横线：缩略图下形成竖向纹理
        for (let k = 1; k < Math.round(t.h / 0.9); k++) {
          out.push(
            `<path d="M${p(t.x + t.w, t.y, k * 0.9)[0]} ${p(t.x + t.w, t.y, k * 0.9)[1]} L${p(t.x + t.w, t.y + t.d, k * 0.9)[0]} ${p(t.x + t.w, t.y + t.d, k * 0.9)[1]}" stroke="${rgba('#0B1A28', 0.55)}" stroke-width="1"/>`,
          )
        }
        if (i === 2) out.push(box({ x: t.x + 0.5, y: t.y + 0.5, z: t.h, w: 1.0, d: 0.7, h: 0.45, color: '#2B4763', rim: false }))
      })

      // 植草沟：沿道路连续绿带 + 渗排点（绿带必须落在路面之外，不能压楼）
      out.push(road({ x: 0, y: 2.8, len: 10, width: 1.15, color: ROAD }))
      out.push(patch({ x: 0.4, y: 3.98, w: 9.2, d: 0.26, z: 0.06, fill: '#24614C' }))
      for (let k = 0; k < 9; k++) {
        out.push(patch({ x: 0.7 + k * 1.0, y: 4.04, w: 0.12, d: 0.14, z: 0.07, fill: rgba('#4CCB86', 0.6) }))
      }
      // 社区内院
      out.push(patch({ x: 3.6, y: 6.2, w: 3.4, d: 2.8, z: 0.05, fill: '#1C3A33', stroke: rgba('#4CCB86', 0.2) }))
      out.push(patch({ x: 4.2, y: 6.8, w: 2.2, d: 1.6, z: 0.06, fill: '#22424F' }))

      out.push(car({ x: 2.2, y: 2.94, dir: 'x', color: '#33526E' }))
      out.push(car({ x: 6.4, y: 2.94, dir: 'x', color: '#2B4763' }))
      out.push(tree({ x: 8.9, y: 7.2, h: 1.7, r: 0.5, color: GREEN }))
      out.push(tree({ x: 4.6, y: 9.2, h: 1.4, r: 0.44, color: GREEN }))
      out.push(tree({ x: 0.7, y: 8.6, h: 1.6, r: 0.48, color: GREEN }))
      out.push(lamp({ x: 1.0, y: 2.9, h: 1.8 }))
      out.push(lamp({ x: 8.2, y: 2.9, h: 1.8 }))

      out.push(puddle({ x: 5.2, y: 9.0, rx: 1.1, ry: 0.44, opacity: 0.3 }))
      out.push(puddle({ x: 2.0, y: 7.6, rx: 0.7, ry: 0.3, opacity: 0.24 }))
      out.push(puddle({ x: 8.6, y: 4.6, rx: 0.55, ry: 0.24, opacity: 0.2 }))
      return out.join('')
    },
  })

/* -------------------------------------------------------------- 车站 */
export const station = () =>
  shell({
    seed: 53,
    accent: '#F08B36',
    rainCount: 50,
    body: ({ plate, patch, box, windows, tree, lamp, puddle, road, water, p }) => {
      const rng = mulberry32(37)
      const out = [plate({ x: 0, y: 0, w: 10, d: 10, color: BASE, rng })]

      // 站前广场（湿）
      out.push(patch({ x: 0.5, y: 5.6, w: 9.0, d: 3.8, z: 0.04, fill: '#1B3247' }))

      // 站房主体
      out.push(box({ x: 1.4, y: 2.1, w: 4.6, d: 2.3, h: 3.0, color: WALL, shadow: true }))
      out.push(windows({ face: 'right', x: 1.4, y: 2.1, w: 4.6, d: 2.3, h: 3.0, rows: 2, cols: 6, rng, litChance: 0.5, cyanChance: 0.12 }))
      out.push(windows({ face: 'left', x: 1.4, y: 2.1, w: 4.6, d: 2.3, h: 3.0, rows: 2, cols: 10, rng, litChance: 0.34, cyanChance: 0.1, winW: 0.13 }))
      // 大跨雨棚（三层薄板 + 肋条）
      out.push(box({ x: 1.3, y: 4.35, z: 3.0, w: 4.9, d: 1.15, h: 0.14, color: '#274056', rim: true }))
      out.push(box({ x: 1.5, y: 4.55, z: 3.12, w: 4.5, d: 0.85, h: 0.1, color: '#2E4A63', rim: false }))
      for (let k = 0; k < 7; k++) {
        out.push(patch({ x: 1.5 + k * 0.75, y: 4.45, w: 0.1, d: 1.25, z: 3.17, fill: rgba('#0B1A28', 0.5) }))
      }

      // 站台 + 轨道 + 列车
      out.push(box({ x: 0.8, y: 6.0, w: 8.4, d: 0.85, h: 0.24, color: '#2A4356', rim: false }))
      out.push(patch({ x: 0.8, y: 7.0, w: 8.4, d: 0.16, z: 0.05, fill: '#0E1E2E' }))
      out.push(patch({ x: 0.8, y: 7.5, w: 8.4, d: 0.16, z: 0.05, fill: '#0E1E2E' }))
      for (let k = 0; k < 22; k++) {
        out.push(patch({ x: 1.0 + k * 0.38, y: 6.92, w: 0.1, d: 0.82, z: 0.055, fill: rgba('#3C5A76', 0.5) }))
      }
      out.push(box({ x: 1.2, y: 6.85, w: 5.6, d: 0.95, h: 1.15, color: '#33526E' }))
      out.push(windows({ face: 'right', x: 1.2, y: 6.85, w: 5.6, d: 0.95, h: 1.15, rows: 1, cols: 14, rng, litChance: 0.72, cyanChance: 0.2, winW: 0.12, insetZ: 0.3 }))
      out.push(patch({ x: 1.25, y: 6.88, w: 5.5, d: 0.06, z: 0.62, fill: rgba('#F5B544', 0.14) }))
      const head = p(6.85, 7.32, 0.72)
      out.push(`<circle cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="3" fill="${rgba('#F5B544', 0.95)}"/>`)
      out.push(
        `<ellipse cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" rx="14" ry="8" fill="${rgba('#F5B544', 0.16)}" filter="url(#soft2)"/>`,
      )

      // 泵站 + 排水管（站前低洼的最终出口）
      out.push(box({ x: 7.6, y: 2.4, w: 1.9, d: 1.6, h: 1.9, color: WALL_3 }))
      out.push(windows({ face: 'right', x: 7.6, y: 2.4, w: 1.9, d: 1.6, h: 1.9, rows: 1, cols: 2, rng, litChance: 0.6, cyanChance: 0.3 }))
      out.push(box({ x: 8.1, y: 2.9, z: 1.9, w: 0.8, d: 0.6, h: 0.5, color: '#2B4763', rim: false }))
      out.push(
        `<path d="M${p(7.6, 3.4, 1.1)[0]} ${p(7.6, 3.4, 1.1)[1]} L${p(6.5, 3.4, 1.1)[0]} ${p(6.5, 3.4, 1.1)[1]} L${p(6.5, 3.4, 0.2)[0]} ${p(6.5, 3.4, 0.2)[1]}" fill="none" stroke="${rgba('#2DD4BF', 0.7)}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
      )

      // 排水口 + 涡漩 + 大面积积水
      out.push(water({ x: 2.9, y: 8.45, w: 3.9, d: 1.35, rng, base: '#14404F', glow: '#F08B36' }))
      const g = p(5.0, 9.1, 0.09)
      for (let k = 0; k < 4; k++) {
        out.push(
          `<ellipse cx="${g[0].toFixed(1)}" cy="${g[1].toFixed(1)}" rx="${((0.25 + k * 0.28) * S * 0.87).toFixed(1)}" ry="${((0.25 + k * 0.28) * S * 0.42).toFixed(1)}" fill="none" stroke="${rgba('#F08B36', 0.34 - k * 0.06)}" stroke-width="1.2"/>`,
        )
      }
      out.push(puddle({ x: 1.6, y: 9.2, rx: 1.2, ry: 0.46, color: '#F08B36', opacity: 0.22 }))
      out.push(puddle({ x: 8.4, y: 8.4, rx: 0.8, ry: 0.34, opacity: 0.26 }))

      out.push(road({ x: 0, y: 5.15, len: 10, width: 0.9, color: ROAD }))
      out.push(tree({ x: 0.8, y: 0.9, h: 1.5, r: 0.44, color: GREEN }))
      out.push(tree({ x: 9.2, y: 5.4, h: 1.4, r: 0.42, color: GREEN }))
      out.push(lamp({ x: 2.6, y: 5.3, h: 1.8 }))
      out.push(lamp({ x: 7.0, y: 5.3, h: 1.8 }))
      return out.join('')
    },
  })

/* ------------------------------------------------------ 雨型缩略图 */
const skyline = (seed, warm) => {
  const rng = mulberry32(seed)
  const out = []
  const baseY = 190
  for (let i = 0; i < 16; i++) {
    const w = 46 + rng() * 54
    const h = 60 + rng() * 120
    const x = -20 + i * 34
    out.push(
      `<rect x="${x.toFixed(0)}" y="${(baseY - h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 60).toFixed(0)}" fill="${rgba('#0B1E2E', 0.92)}"/>`,
    )
    for (let k = 0; k < 12; k++) {
      if (rng() > warm) continue
      out.push(
        `<rect x="${(x + 6 + rng() * (w - 16)).toFixed(0)}" y="${(baseY - h + 8 + rng() * (h - 20)).toFixed(0)}" width="4" height="3" fill="${rgba(rng() > 0.7 ? '#38BDF8' : '#F5B544', 0.55 + rng() * 0.4)}"/>`,
      )
    }
  }
  return out.join('')
}

export const rainContinuous = () => {
  const iso = createIso({ scale: 22, originX: 260, originY: 214 })
  const bg = `<rect width="${W}" height="260" fill="#071321"/><rect width="${W}" height="260" fill="url(#ambient)"/>`
  const ground = `<rect x="0" y="190" width="${W}" height="70" fill="#17293C"/>`
  const reflect = Array.from({ length: 12 }, (_, i) => {
    const rng = mulberry32(200 + i)
    return `<rect x="${(rng() * W).toFixed(0)}" y="${(200 + rng() * 46).toFixed(0)}" width="${(10 + rng() * 40).toFixed(0)}" height="2" fill="${rgba(i % 3 ? '#F5B544' : '#38BDF8', 0.16)}"/>`
  }).join('')
  return svgDoc(
    W,
    260,
    iso.defs({ accent: '#38BDF8' }) +
      bg +
      skyline(71, 0.92) +
      ground +
      reflect +
      iso.rain({ count: 120, w: W, h: 260, seed: 13, maxLen: 26 }),
  )
}

export const rainBurst = () => {
  const iso = createIso({ scale: 22, originX: 260, originY: 214 })
  const bg = `<rect width="${W}" height="260" fill="#061019"/><rect width="${W}" height="260" fill="url(#ambient)"/>`
  const ground = `<rect x="0" y="190" width="${W}" height="70" fill="#132232"/>`
  const rng = mulberry32(303)
  const splash = Array.from({ length: 26 }, () => {
    const x = rng() * W
    const y = 200 + rng() * 50
    return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(3 + rng() * 7).toFixed(0)}" ry="${(1 + rng() * 2).toFixed(0)}" fill="none" stroke="${rgba('#9FD8F5', 0.16 + rng() * 0.2)}" stroke-width="1"/>`
  }).join('')
  const streaks = Array.from({ length: 26 }, () => {
    const x = rng() * (W + 80)
    return `<path d="M${x.toFixed(0)} -10 l${(-30 - rng() * 30).toFixed(0)} ${(120 + rng() * 90).toFixed(0)}" stroke="${rgba('#CFE9F8', 0.1 + rng() * 0.14)}" stroke-width="${(1 + rng() * 1.6).toFixed(1)}" stroke-linecap="round"/>`
  }).join('')
  const cloud = `<ellipse cx="300" cy="40" rx="260" ry="60" fill="${rgba('#5B8FB0', 0.16)}" filter="url(#soft)"/>`
  return svgDoc(
    W,
    260,
    iso.defs({ accent: '#2DD4BF' }) +
      bg +
      cloud +
      skyline(61, 0.7) +
      ground +
      streaks +
      splash +
      iso.rain({ count: 70, w: W, h: 260, seed: 19, maxLen: 30 }),
  )
}
