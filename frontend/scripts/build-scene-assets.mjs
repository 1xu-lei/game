/**
 * 生成 public/assets/scenes/ 下全部本地资产 + 一张评审用对照页
 * 运行：node scripts/build-scene-assets.mjs
 * 产出必须可复现：同一次运行生成的 SVG 完全一致（无随机时间戳）
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  school,
  market,
  park,
  residential,
  station,
  rainContinuous,
  rainBurst,
} from './assets/scenes.mjs'
import { cityOverview } from './assets/city.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../public/assets/scenes')
mkdirSync(outDir, { recursive: true })

const assets = {
  'school.svg': school(),
  'market.svg': market(),
  'park.svg': park(),
  'residential.svg': residential(),
  'station.svg': station(),
  'city-overview.svg': cityOverview(),
  'rain-continuous.svg': rainContinuous(),
  'rain-burst.svg': rainBurst(),
}

let total = 0
for (const [name, content] of Object.entries(assets)) {
  const file = join(outDir, name)
  writeFileSync(file, content, 'utf8')
  const kb = statSync(file).size / 1024
  total += kb
  console.log(`${name.padEnd(20)} ${kb.toFixed(1)} KB`)
}
console.log(`\n${Object.keys(assets).length} 个资产，合计 ${total.toFixed(1)} KB → ${outDir}`)

/* 评审对照页：同尺寸并排 + 44px 缩略图检查（缩略图必须仍可辨识） */
const sheet = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>场景资产对照</title>
<style>
  body{margin:0;background:#071321;color:#E7F0F7;font:13px/1.5 'Microsoft YaHei UI',sans-serif;padding:24px}
  h2{font-size:13px;color:#91A9BC;font-weight:600;letter-spacing:.08em;margin:0 0 10px}
  .row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
  .card{background:#102235;border:1px solid #24435D;border-radius:10px;overflow:hidden}
  .card img{display:block;width:100%;height:auto}
  .card .cap{padding:8px 10px;font-size:12px;color:#E7F0F7;border-top:1px solid #24435D}
  .thumbs{display:flex;gap:14px;align-items:center;background:#0D1C2B;padding:14px;border-radius:10px;border:1px solid #24435D}
  .thumbs img{width:44px;height:34px;object-fit:cover;border-radius:6px;border:1px solid #24435D}
  .thumbs img.big{width:120px;height:92px}
  .wide{grid-column:span 3}
</style></head><body>
<h2>场景资产 · 全尺寸对照</h2>
<div class="row">
${['school', 'market', 'park', 'residential', 'station']
  .map((k) => `<div class="card"><img src="assets/scenes/${k}.svg" alt="${k}"><div class="cap">${k}.svg</div></div>`)
  .join('\n')}
</div>
<h2>44px 缩略图 · 必须仍可辨识（右三张为 120px 参考）</h2>
<div class="thumbs">
${['school', 'market', 'park', 'residential', 'station'].map((k) => `<img src="assets/scenes/${k}.svg" alt="${k}">`).join('')}
${['school', 'park', 'station'].map((k) => `<img class="big" src="assets/scenes/${k}.svg" alt="${k}">`).join('')}
</div>
<h2>城市全景</h2>
<div class="row"><div class="card wide"><img src="assets/scenes/city-overview.svg" alt="city"><div class="cap">city-overview.svg</div></div></div>
<h2>雨型缩略图</h2>
<div class="row" style="grid-template-columns:repeat(2,1fr)">
  <div class="card"><img src="assets/scenes/rain-continuous.svg" alt="continuous"><div class="cap">rain-continuous.svg</div></div>
  <div class="card"><img src="assets/scenes/rain-burst.svg" alt="burst"><div class="cap">rain-burst.svg</div></div>
</div>
</body></html>`
writeFileSync(resolve(here, '../public/asset-sheet.html'), sheet, 'utf8')
console.log('评审对照页 → public/asset-sheet.html')
