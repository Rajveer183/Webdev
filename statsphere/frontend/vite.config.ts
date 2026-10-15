/// <reference types="vitest/config" />
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `vite preview` behaves like the production nginx config: prerendered pages are served from
 * dist/<route>/index.html; /admin gets the app shell (spa.html), and unknown URLs get it with a 404 status.
 */
function prerenderedFallback(): Plugin {
  return {
    name: 'statsphere-prerendered-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // req.url can arrive as an absolute URL, so take the pathname.
        const url = new URL(req.url ?? '/', 'http://preview.local').pathname
        if (url.startsWith('/api/') || url.includes('.')) return next()
        const dist = resolve(server.config.root, server.config.build.outDir)
        const page = url === '/' ? 'index.html' : `${url.replace(/^\/|\/$/g, '')}/index.html`
        // Rewrite explicitly: the static server would otherwise answer extension-less URLs with dist/index.html.
        if (existsSync(resolve(dist, page))) req.url = `/${page}`
        else if (/^\/admin\/?$/.test(url)) req.url = '/spa.html'
        else {
          // Like nginx: unknown URLs get the app shell with a real 404 status (sirv would always send 200).
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(readFileSync(resolve(dist, 'spa.html')))
          return
        }
        next()
      })
    },
  }
}

/** The production response headers (CSP etc.) from security-headers.conf, so `vite preview` enforces them too. */
function nginxSecurityHeaders(): Record<string, string> {
  const conf = readFileSync(new URL('./security-headers.conf', import.meta.url), 'utf-8')
  return Object.fromEntries([...conf.matchAll(/^add_header\s+(\S+)\s+"([^"]*)"/gm)].map(([, name, value]) => [name, value]))
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), prerenderedFallback()],
    preview: {
      port: 4173,
      headers: nginxSecurityHeaders(),
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
