import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5199,
    strictPort: false,
    // rules/rules.json 是规则唯一真源，位于 frontend 之外，需显式允许 dev server 读取
    fs: {
      allow: [
        fileURLToPath(new URL('.', import.meta.url)),
        fileURLToPath(new URL('..', import.meta.url)),
      ],
    },
  },
  build: {
    // 单个业务 chunk 已压到 200 kB 以下；三方库按用途拆开，便于浏览器缓存与首屏并行下载
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('echarts') || id.includes('zrender')) return 'charts'
          if (
            id.includes('naive-ui') ||
            id.includes('vueuc') ||
            id.includes('css-render') ||
            id.includes('vdirs') ||
            id.includes('seemly') ||
            id.includes('evtd') ||
            id.includes('treemate') ||
            id.includes('vooks') ||
            id.includes('date-fns')
          ) {
            return 'ui'
          }
          if (id.includes('lucide-vue-next')) return 'icons'
          return 'vendor'
        },
      },
    },
  },
})
