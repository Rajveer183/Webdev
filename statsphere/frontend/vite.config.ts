/// <reference types="vitest/config" />
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `vite preview` behaves like the production nginx config: prerendered pages are served from
 * dist/<route>/index.html; anything else (e.g. /admin, unknown URLs) gets the app shell (spa.html).
 */
function prerenderedFallback(): Plugin {
  return {
    name: 'statsphere-prerendered-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        if (url.startsWith('/api/') || url.includes('.')) return next()
        const dist = resolve(server.config.root, server.config.build.outDir)
        const page = url === '/' ? 'index.html' : `${url.replace(/^\/|\/$/g, '')}/index.html`
        // Rewrite explicitly: the static server would otherwise answer extension-less URLs with dist/index.html.
        req.url = existsSync(resolve(dist, page)) ? `/${page}` : '/spa.html'
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), prerenderedFallback()],
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: false },
      },
    },
    server: {
      port: 5173,
      proxy: {
        // In development the API runs separately (uvicorn on :8000).
        '/api': { target: env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: false },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-')) return 'charts'
              if (id.includes('katex')) return 'katex'
              if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'forms'
            }
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
