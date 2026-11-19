/**
 * 极简静态服务器（仅用于本机评审截图 / 演示预检，不参与产品运行逻辑）
 * 用法：node scripts/serve-dist.mjs 5399
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const port = Number(process.argv[2] ?? 5399)
const root = resolve(process.cwd(), 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
  let file = join(root, normalize(urlPath).replace(/^([/\\])+/, ''))
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  })
  createReadStream(file).pipe(res)
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}`))
