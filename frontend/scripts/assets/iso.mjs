/**
 * 等距插画生成器 · 共享几何与材质词汇
 * ---------------------------------------------------------------
 * 统一约定（六个资产必须完全一致，否则缩略图会像两套美术）：
 *   投影：2:1 等距  sx = (x-y)·0.866·S   sy = ((x+y)/2 - z)·S
 *   坐标：+x 指向屏幕右下，+y 指向屏幕左下，+z 向上
 *   光照：主光来自左上方 → 顶面最亮，左侧面次之，右侧面最暗
 *   色板：只取 tokens.css 里的蓝青体系 + 琥珀窗光 + 克制的安全绿
 */

export const mulberry32 = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hex2rgb = (hex) => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export const rgb2hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

/**
 * f<1 变暗，f>1 变亮。始终做乘法以保留色相——向白色混合会把深蓝墙面
 * 冲成灰塑料，这是等距插画最常见的失真来源。
 */
export const shade = (hex, f) => {
  const [r, g, b] = hex2rgb(hex)
  return rgb2hex(r * f, g * f, b * f)
}

/** 向白混合：只用于极少量高光（树冠顶、水面反光），不做大面积色面 */
export const tint = (hex, t) => {
  const [r, g, b] = hex2rgb(hex)
  return rgb2hex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t)
}

export const mix = (a, b, t) => {
  const [r1, g1, b1] = hex2rgb(a)
  const [r2, g2, b2] = hex2rgb(b)
  return rgb2hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export const rgba = (hex, a) => {
  const [r, g, b] = hex2rgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

export const n = (v) => Math.round(v * 10) / 10

/** 创建一个投影器 + 图元工厂 */
export function createIso({ scale = 22, originX = 260, originY = 210 } = {}) {
  const p = (x, y, z = 0) => [
    originX + (x - y) * 0.866 * scale,
    originY + ((x + y) * 0.5 - z) * scale,
  ]

  const path = (pts, close = true) =>
    pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${n(pt[0])} ${n(pt[1])}`).join(' ') + (close ? ' Z' : '')

  const poly3 = (pts3, attrs = {}) =>
    `<path d="${path(pts3.map((q) => p(q[0], q[1], q[2])))}"${attrsToStr(attrs)}/>`

  /** 立方体/长方体：顶面亮、左侧面中、右侧面暗 */
  const box = (
    { x, y, z = 0, w, d, h, color, topColor, leftColor, rightColor, opacity = 1, stroke, strokeW = 0.7, rim = true, shadow = false },
  ) => {
    const top = topColor ?? shade(color, 1.2)
    const left = leftColor ?? shade(color, 0.7)
    const right = rightColor ?? shade(color, 0.48)
    const contact = shadow
      ? `<ellipse cx="${n(p(x + w / 2, y + d / 2)[0] + (w + d) * scale * 0.06)}" cy="${n(p(x + w / 2, y + d / 2)[1] + 3)}" rx="${n((w + d) * 0.36 * scale)}" ry="${n((w + d) * 0.13 * scale)}" fill="${rgba('#000000', 0.42)}" filter="url(#soft2)"/>`
      : ''
    const A = [x, y, z + h]
    const B = [x + w, y, z + h]
    const C = [x + w, y + d, z + h]
    const D = [x, y + d, z + h]
    const b0 = [x + w, y, z]
    const c0 = [x + w, y + d, z]
    const d0 = [x, y + d, z]
    const so = stroke ? ` stroke="${stroke}" stroke-width="${strokeW}"` : ''
    return (
      contact +
      [
        poly3([C, D, d0, c0], { fill: left, opacity, ...(stroke ? { 'stroke-linejoin': 'round' } : {}) }),
        poly3([B, C, c0, b0], { fill: right, opacity }),
        poly3([A, B, C, D], { fill: top, opacity, ...(stroke ? { 'stroke-linejoin': 'round' } : {}) }),
      ].join('') +
      (rim
        ? `<path d="${path([p(A[0], A[1], A[2]), p(B[0], B[1], B[2]), p(C[0], C[1], C[2])])}" fill="none" stroke="${rgba('#E7F0F7', 0.14)}" stroke-width="0.9" stroke-linecap="round"/>`
        : '')
    )
  }

  /**
   * 立面窗格
   * face 'right'：法线 +x，沿 +y 展开（屏幕上向右下）
   * face 'left' ：法线 +y，沿 +x 展开（屏幕上向左下）
   */
  const windows = (opts) => {
    const {
      face,
      rows = 4,
      cols = 6,
      rng,
      litChance = 0.26,
      cyanChance = 0.1,
      amber = '#F5B544',
      cyan = '#38BDF8',
      winW = 0.16,
      insetY = 0.12,
      insetZ = 0.12,
      opacity = 0.95,
    } = opts
    const { x, y, z = 0, w: bw, d, h } = opts
    const w = winW
    void face
    const out = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const roll = rng()
        if (roll > litChance + cyanChance) continue
        const isCyan = roll > litChance
        const fill = isCyan ? cyan : amber
        const z0 = z + insetZ + (r * (h - insetZ * 2)) / rows
        const z1 = z0 + (h - insetZ * 2) / rows - 0.1
        if (face === 'right') {
          const y0 = y + insetY + (c * (d - insetY * 2)) / cols
          const y1 = y0 + (d - insetY * 2) / cols - w
          out.push(poly3([[x + bw, y0, z0], [x + bw, y1, z0], [x + bw, y1, z1], [x + bw, y0, z1]], { fill, opacity: opacity * (isCyan ? 0.75 : 0.92) }))
        } else {
          const x0 = x + insetY + (c * (bw - insetY * 2)) / cols
          const x1 = x0 + (bw - insetY * 2) / cols - w
          out.push(poly3([[x0, y + d, z0], [x1, y + d, z0], [x1, y + d, z1], [x0, y + d, z1]], { fill, opacity: opacity * (isCyan ? 0.75 : 0.92) }))
        }
      }
    }
    return out.join('')
  }

  /** 地面平板（带厚度与投影） */
  const plate = ({ x = 0, y = 0, w, d, thick = 0.55, color = '#12263A', topColor, shadow = true, rng }) => {
    const top = topColor ?? shade(color, 1.25)
    const A = [x, y]
    const B = [x + w, y]
    const C = [x + w, y + d]
    const D = [x, y + d]
    const so = shadow
      ? `<ellipse cx="${n(p(x + w / 2, y + d / 2)[0])}" cy="${n(p(x + w / 2, y + d / 2)[1] + thick * scale + 10)}" rx="${n((w + d) * 0.36 * scale)}" ry="${n((w + d) * 0.1 * scale)}" fill="${rgba('#000000', 0.5)}" filter="url(#soft)"/>`
      : ''
    const grid = []
    if (rng) {
      for (let gx = x + 1; gx < x + w; gx += 1) {
        grid.push(poly3([[gx, y, 0.02], [gx, y + d, 0.02]], { stroke: rgba('#24435D', 0.5), 'stroke-width': 0.6, fill: 'none' }))
      }
      for (let gy = y + 1; gy < y + d; gy += 1) {
        grid.push(poly3([[x, gy, 0.02], [x + w, gy, 0.02]], { stroke: rgba('#24435D', 0.5), 'stroke-width': 0.6, fill: 'none' }))
      }
    }
    return (
      so +
      poly3([C, D, [x, y + d, -thick], [x + w, y + d, -thick]], { fill: shade(color, 0.5) }) +
      poly3([B, C, [x + w, y + d, -thick], [x + w, y, -thick]], { fill: shade(color, 0.34) }) +
      poly3([A, B, C, D], { fill: top }) +
      grid.join('') +
      `<path d="${path([p(A[0], A[1]), p(B[0], B[1]), p(C[0], C[1])])}" fill="none" stroke="${rgba('#38BDF8', 0.34)}" stroke-width="1.1" stroke-linecap="round"/>`
    )
  }

  /** 地面色块（铺装 / 绿地 / 水域底色），z 略高于地面 */
  const patch = ({ x, y, w, d, z = 0.03, fill, opacity = 1, stroke, dash }) =>
    poly3([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], {
      fill,
      opacity,
      ...(stroke ? { stroke, 'stroke-width': 0.8 } : {}),
      ...(dash ? { 'stroke-dasharray': dash } : {}),
    })

  /** 道路带：dir='x' 沿 x 从 x 铺 len；dir='y' 沿 y 从 y 铺 len */
  const road = ({ x, y, len, dir = 'x', z = 0.04, width = 1.1, lane = true, color = '#1B2F45' }) => {
    const out = []
    const geo = dir === 'x' ? { x, y, w: len, d: width } : { x, y, w: width, d: len }
    out.push(patch({ ...geo, z, fill: color }))
    if (lane) {
      const step = 1.1
      if (dir === 'x') {
        for (let cx = x + 0.4; cx < x + len - 0.4; cx += step) {
          out.push(patch({ x: cx, y: geo.y + width / 2 - 0.05, w: 0.55, d: 0.1, z: z + 0.01, fill: rgba('#91A9BC', 0.36) }))
        }
      } else {
        for (let cy = y + 0.4; cy < y + len - 0.4; cy += step) {
          out.push(patch({ x: geo.x + width / 2 - 0.05, y: cy, w: 0.1, d: 0.55, z: z + 0.01, fill: rgba('#91A9BC', 0.36) }))
        }
      }
    }
    return out.join('')
  }

  /** 水面：渐变 + 波纹 + 高光条 */
  const water = ({ x, y, w, d, z = 0.05, rng, base = '#0E3B4A', glow = '#2DD4BF' }) => {
    const out = [patch({ x, y, w, d, z, fill: base })]
    out.push(patch({ x, y, w, d, z: z + 0.005, fill: `url(#waterGrad)` }))
    const count = Math.max(2, Math.round((w + d) / 2.2))
    for (let i = 0; i < count; i++) {
      const cx = x + 0.3 + rng() * (w - 0.6)
      const cy = y + 0.3 + rng() * (d - 0.6)
      const rw = 0.35 + rng() * 0.7
      out.push(
        `<ellipse cx="${n(p(cx, cy, z + 0.01)[0])}" cy="${n(p(cx, cy, z + 0.01)[1])}" rx="${n(rw * scale * 0.87)}" ry="${n(rw * scale * 0.42)}" fill="none" stroke="${rgba(glow, 0.3 + rng() * 0.28)}" stroke-width="0.9"/>`,
      )
    }
    // 镜面高光：沿长边的一束
    out.push(poly3([[x + w * 0.18, y + d * 0.42, z + 0.01], [x + w * 0.62, y + d * 0.42, z + 0.01], [x + w * 0.62, y + d * 0.5, z + 0.01], [x + w * 0.18, y + d * 0.5, z + 0.01]], { fill: rgba(glow, 0.22) }))
    return out.join('')
  }

  /** 积水面（低洼渍水） */
  const puddle = ({ x, y, rx = 0.6, ry = 0.34, z = 0.06, color = '#38BDF8', opacity = 0.3 }) => {
    const c = p(x, y, z)
    return (
      `<ellipse cx="${n(c[0])}" cy="${n(c[1])}" rx="${n(rx * scale)}" ry="${n(ry * scale)}" fill="${rgba(color, opacity)}"/>` +
      `<ellipse cx="${n(c[0] - rx * scale * 0.15)}" cy="${n(c[1] - ry * scale * 0.2)}" rx="${n(rx * scale * 0.55)}" ry="${n(ry * scale * 0.4)}" fill="${rgba('#E7F0F7', opacity * 0.42)}"/>`
    )
  }

  /** 树：两种轮廓，缩略图下也要能认出是绿地 */
  const tree = ({ x, y, h = 1.5, r = 0.5, color = '#2F7A5E', rng }) => {
    const trunk = box({ x: x - 0.08, y: y - 0.08, z: 0, w: 0.16, d: 0.16, h: h * 0.45, color: '#243B4F', rim: false })
    const c = p(x, y, h * 0.55)
    const top = [
      `<ellipse cx="${n(c[0])}" cy="${n(c[1])}" rx="${n(r * scale)}" ry="${n(r * scale * 0.62)}" fill="${shade(color, 0.42)}"/>`,
      `<ellipse cx="${n(c[0] - r * scale * 0.12)}" cy="${n(c[1] - r * scale * 0.36)}" rx="${n(r * scale * 0.86)}" ry="${n(r * scale * 0.54)}" fill="${shade(color, 0.72)}"/>`,
      `<ellipse cx="${n(c[0] - r * scale * 0.24)}" cy="${n(c[1] - r * scale * 0.56)}" rx="${n(r * scale * 0.5)}" ry="${n(r * scale * 0.32)}" fill="${tint(color, 0.3)}" opacity="0.7"/>`,
    ]
    return `<ellipse cx="${n(p(x, y)[0])}" cy="${n(p(x, y)[1])}" rx="${n(r * scale * 0.9)}" ry="${n(r * scale * 0.4)}" fill="${rgba('#000000', 0.34)}"/>` + trunk + top.join('')
  }

  /** 路灯：细杆 + 琥珀光晕 */
  const lamp = ({ x, y, h = 1.6, color = '#F5B544' }) => {
    const base = p(x, y)
    const head = p(x, y, h)
    return (
      `<path d="${path([base, head])}" stroke="${rgba('#3C5A76', 1)}" stroke-width="1.6" stroke-linecap="round"/>` +
      `<circle cx="${n(head[0])}" cy="${n(head[1])}" r="${n(scale * 0.42)}" fill="${rgba(color, 0.28)}"/>` +
      `<circle cx="${n(head[0])}" cy="${n(head[1])}" r="${n(scale * 0.13)}" fill="${rgba(color, 0.95)}"/>` +
      `<ellipse cx="${n(base[0])}" cy="${n(base[1])}" rx="${n(scale * 0.42)}" ry="${n(scale * 0.2)}" fill="${rgba(color, 0.16)}"/>`
    )
  }

  /** 车辆：小方块 + 车灯，用来给街道尺度感 */
  const car = ({ x, y, dir = 'x', color = '#2B4763', head = '#F5B544' }) => {
    const w = dir === 'x' ? 0.72 : 0.4
    const d = dir === 'x' ? 0.4 : 0.72
    const body = box({ x, y, z: 0, w, d, h: 0.26, color, rim: false })
    const cab = box({ x: x + w * 0.22, y: y + d * 0.12, z: 0.26, w: w * 0.52, d: d * 0.76, h: 0.16, color: shade(color, 0.86), rim: false })
    const front = dir === 'x' ? p(x + w, y + d / 2, 0.14) : p(x + w / 2, y + d, 0.14)
    return body + cab + `<circle cx="${n(front[0])}" cy="${n(front[1])}" r="${n(scale * 0.11)}" fill="${rgba(head, 0.9)}"/>`
  }

  /** 雨丝：确定性随机，统一 12° 倾角 */
  const rain = ({ count = 46, w = 520, h = 400, seed = 7, color = '#9FD8F5', from = 0, to = 1, maxLen = 20 }) => {
    const rng = mulberry32(seed)
    const out = []
    for (let i = 0; i < count; i++) {
      const x0 = rng() * w
      const y0 = from * h + rng() * (to - from) * h
      const len = 7 + rng() * maxLen
      const op = 0.06 + rng() * 0.16
      out.push(
        `<path d="M${n(x0)} ${n(y0)} l${n(-len * 0.2)} ${n(len)}" stroke="${rgba(color, op)}" stroke-width="${n(0.6 + rng() * 0.7)}" stroke-linecap="round"/>`,
      )
    }
    return out.join('')
  }

  /** 通用定义：投影模糊 + 水面渐变 + 环境光 */
  const defs = ({ accent = '#38BDF8', sky = '#0A1A2A' } = {}) => `
  <defs>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
    <radialGradient id="ambient" cx="52%" cy="30%" r="72%">
      <stop offset="0%" stop-color="${rgba(accent, 0.2)}"/>
      <stop offset="52%" stop-color="${rgba('#1B3A55', 0.16)}"/>
      <stop offset="100%" stop-color="${rgba(sky, 0)}"/>
    </radialGradient>
    <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${rgba('#38BDF8', 0.2)}"/>
      <stop offset="55%" stop-color="${rgba('#2DD4BF', 0.12)}"/>
      <stop offset="100%" stop-color="${rgba('#071321', 0.34)}"/>
    </linearGradient>
  </defs>`
  return { p, path, poly3, box, windows, plate, patch, road, water, puddle, tree, lamp, car, rain, defs }
}

function attrsToStr(attrs) {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${typeof v === 'number' ? n(v) : v}"`)
    .join('')
}

export const svgDoc = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"${extra}>${body}</svg>`
