<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RainType } from '@/types'

/**
 * 降雨可视化层（Canvas 2D）
 * ---------------------------------------------------------------
 * 雨滴的数量 / 速度 / 拖尾长度 / 倾角 / 溅落，全部由「雨型 + 强度」驱动：
 *   持续型      → 密、慢、短、近垂直
 *   短时强降雨  → 略疏但更快、更长、带倾角，并出现地面溅落
 * 粒子由固定种子的线性同余生成器初始化，同一尺寸下画面可复现。
 * 尊重 prefers-reduced-motion：开启时只画一帧静态雨幕。
 */
interface Props {
  /** 雨型：决定雨滴形态族 */
  mode: RainType
  /** 雨量强度 0–1：影响密度与速度 */
  intensity?: number
  /** 雨层开关 */
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), { intensity: 0.6, active: true })

interface Drop {
  x: number
  y: number
  len: number
  speed: number
  width: number
  alpha: number
}

interface Splash {
  x: number
  y: number
  r: number
  life: number
  max: number
}

const PRESET = {
  continuous: {
    count: 320,
    speed: [340, 560],
    len: [14, 26],
    width: 1.2,
    alpha: [0.2, 0.44],
    angle: 7,
    splash: 0,
    tint: '186, 222, 246',
  },
  burst: {
    count: 140,
    speed: [820, 1320],
    len: [26, 60],
    width: 1.6,
    alpha: [0.22, 0.52],
    angle: 16,
    splash: 18,
    tint: '205, 232, 250',
  },
} as const

const canvas = ref<HTMLCanvasElement | null>(null)
const preset = computed(() => PRESET[props.mode])

let ctx: CanvasRenderingContext2D | null = null
let drops: Drop[] = []
let splashes: Splash[] = []
let raf = 0
let io: ResizeObserver | null = null
let cssW = 0
let cssH = 0
let lastTs = 0
let seed = 20261119

function nextRandom(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}

function between(a: number, b: number): number {
  return a + nextRandom() * (b - a)
}

function buildDrops(): void {
  const p = preset.value
  const density = Math.round(p.count * (0.35 + props.intensity * 0.9))
  seed = 20261119
  drops = Array.from({ length: density }, () => ({
    x: nextRandom() * cssW,
    y: nextRandom() * cssH,
    len: between(p.len[0], p.len[1]),
    speed: between(p.speed[0], p.speed[1]) * (0.75 + props.intensity * 0.4),
    width: p.width,
    alpha: between(p.alpha[0], p.alpha[1]),
  }))
  splashes = []
}

function drawFrame(dt: number): void {
  if (!ctx) return
  const p = preset.value
  const rad = (p.angle * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = Math.cos(rad)

  ctx.clearRect(0, 0, cssW, cssH)
  ctx.lineCap = 'round'
  ctx.strokeStyle = `rgb(${p.tint})`

  for (const d of drops) {
    d.y += d.speed * dt
    d.x += d.speed * dt * dx * 0.35
    if (d.y - d.len > cssH) {
      d.y = -d.len
      d.x = nextRandom() * cssW
    }
    if (d.x > cssW + 24) d.x = -24
    ctx.globalAlpha = d.alpha
    ctx.lineWidth = d.width
    ctx.beginPath()
    ctx.moveTo(d.x, d.y)
    ctx.lineTo(d.x - d.len * dx, d.y - d.len * dy)
    ctx.stroke()
  }

  if (p.splash > 0) {
    if (splashes.length < p.splash && nextRandom() < 0.4 * (0.4 + props.intensity)) {
      splashes.push({
        x: nextRandom() * cssW,
        y: cssH - nextRandom() * cssH * 0.18,
        r: 1,
        life: 0,
        max: between(0.35, 0.7),
      })
    }
    ctx.lineWidth = 1
    for (const s of splashes) {
      s.life += dt
      s.r += dt * 26
      const k = 1 - s.life / s.max
      if (k <= 0) continue
      ctx.globalAlpha = 0.34 * k
      ctx.beginPath()
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.38, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    splashes = splashes.filter((s) => s.life < s.max)
  }

  ctx.globalAlpha = 1
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function stop(): void {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function tick(ts: number): void {
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016
  lastTs = ts
  drawFrame(dt)
  raf = requestAnimationFrame(tick)
}

function start(): void {
  stop()
  if (!props.active) {
    ctx?.clearRect(0, 0, cssW, cssH)
    return
  }
  if (prefersReducedMotion()) {
    drawFrame(0.016)
    return
  }
  lastTs = 0
  raf = requestAnimationFrame(tick)
}

function resize(): void {
  const el = canvas.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  cssW = Math.max(1, rect.width)
  cssH = Math.max(1, rect.height)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  el.width = Math.round(cssW * dpr)
  el.height = Math.round(cssH * dpr)
  ctx = el.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  buildDrops()
  start()
}

function onVisibility(): void {
  if (document.hidden) stop()
  else start()
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  resize()
  io = new ResizeObserver(resize)
  io.observe(el)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  stop()
  io?.disconnect()
  io = null
  document.removeEventListener('visibilitychange', onVisibility)
})

watch([() => props.mode, () => props.intensity], () => {
  buildDrops()
  start()
})

watch(
  () => props.active,
  () => start(),
)
</script>

<template>
  <canvas ref="canvas" class="rainfield" :data-mode="props.mode" aria-hidden="true" />
</template>

<style scoped>
.rainfield {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}
</style>
