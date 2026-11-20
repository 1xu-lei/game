/**
 * 引擎一致性校验：前端 ruleEngine 与后端 engine 同输入同输出。
 *
 * 做法：
 *   1. 用 Python 跑 backend/scripts/dump_engine_results.py，得到 126×2 = 252 组后端结果；
 *   2. 用 esbuild 把 src/engine/ruleEngine.ts 打成临时 ESM，在 Node 里跑同样 252 组；
 *   3. 除 simulationId（前后端前缀不同：preview- / sim-）外逐字段比对。
 *
 * 用法（仓库根目录）：node frontend/scripts/check-engine-parity.mjs
 * 退出码 0 = 完全一致；非 0 = 有差异，并打印第一条差异路径。
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const pythonExe = join(repoRoot, 'backend', '.venv', 'Scripts', 'python.exe')
const dumpScript = join(repoRoot, 'backend', 'scripts', 'dump_engine_results.py')
const engineEntry = join(repoRoot, 'frontend', 'src', 'engine', 'ruleEngine.ts')

const SCENE_ORDER = ['school', 'market', 'park', 'residential', 'station']
const RAIN_TYPES = ['continuous', 'burst']

function compositions(total, parts) {
  if (parts === 1) return [[total]]
  const rows = []
  for (let first = 0; first <= total; first += 1) {
    for (const rest of compositions(total - first, parts - 1)) rows.push([first, ...rest])
  }
  return rows
}

function allocationOf(combo) {
  return Object.fromEntries(SCENE_ORDER.map((sceneId, index) => [sceneId, combo[index]]))
}

/** 逐字段比对，忽略 simulationId；返回第一条差异描述 */
function firstDifference(a, b, path = '') {
  if (typeof a === 'number' && typeof b === 'number') {
    return Object.is(a, b) ? null : `${path}: 后端 ${a} ≠ 前端 ${b}`
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path}: 数组长度 ${a.length} ≠ ${b.length}`
    for (let i = 0; i < a.length; i += 1) {
      const diff = firstDifference(a[i], b[i], `${path}[${i}]`)
      if (diff) return diff
    }
    return null
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      if (key === 'simulationId') continue
      const diff = firstDifference(a[key], b[key], `${path}.${key}`)
      if (diff) return diff
    }
    return null
  }
  return a === b ? null : `${path}: 后端 ${JSON.stringify(a)} ≠ 前端 ${JSON.stringify(b)}`
}

async function main() {
  const rawBackend = execFileSync(pythonExe, [dumpScript], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    timeout: 600_000,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  })
  const backendRows = JSON.parse(rawBackend)

  const tempDir = mkdtempSync(join(tmpdir(), 'rc-parity-'))
  const bundled = join(tempDir, 'engine.mjs')
  writeFileSync(join(tempDir, 'entry.ts'), `export { simulate } from ${JSON.stringify(engineEntry)}\n`)
  await build({
    entryPoints: [join(tempDir, 'entry.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    outfile: bundled,
    logLevel: 'silent',
  })
  const { simulate } = await import(pathToFileURL(bundled).href)

  try {
    const combos = compositions(5, SCENE_ORDER.length)
    let checked = 0
    let mismatched = 0
    for (const combo of combos) {
      const allocation = allocationOf(combo)
      for (const rainType of RAIN_TYPES) {
        const backend = backendRows.find(
          (row) =>
            row.rainType === rainType &&
            SCENE_ORDER.every((sceneId) => row.allocation[sceneId] === allocation[sceneId]),
        )
        if (!backend) throw new Error(`后端结果缺少 ${rainType} ${JSON.stringify(allocation)}`)
        const frontend = simulate(allocation, rainType)
        checked += 1
        const diff = firstDifference(backend, JSON.parse(JSON.stringify(frontend)))
        if (diff) {
          mismatched += 1
          if (mismatched === 1) {
            console.error(`✗ ${rainType} ${JSON.stringify(allocation)} → ${diff}`)
          }
        }
      }
    }

    console.log(`parity rows=${checked} mismatched=${mismatched} backendRows=${backendRows.length}`)
    if (mismatched > 0) process.exitCode = 1
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
