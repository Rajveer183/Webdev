// Prerenders every public route to static HTML after `vite build`.
//
// Data comes from an API snapshot produced by the backend (`python -m app.cli export-api`),
// so the HTML contains exactly what the live API would return at build time. Each page
// embeds only the responses it used; the browser hydrates with that data and then refreshes
// it from the live API.
//
// Output: dist/index.html (home), dist/<route>/index.html for every other public page, and
// dist/spa.html (the unrendered app shell) used as the fallback for /admin and unknown URLs.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const dist = resolve(root, process.env.PRERENDER_DIST || 'dist')
const ssrDir = resolve(root, 'dist-ssr')
const snapshotPath = process.env.SNAPSHOT_PATH ? resolve(process.env.SNAPSHOT_PATH) : resolve(root, '../data/api-snapshot.json')

function ensureSnapshot() {
  if (existsSync(snapshotPath)) return true
  // Try the local backend virtualenv (development convenience).
  const backend = resolve(root, '../backend')
  const candidates = [resolve(backend, '.venv/Scripts/python.exe'), resolve(backend, '.venv/bin/python')]
  const python = candidates.find((p) => existsSync(p))
  if (!python) return false
  console.log('[prerender] No API snapshot found; exporting one from data/content …')
  const r = spawnSync(python, ['-m', 'app.cli', 'export-api', '--from-content', '--out', snapshotPath], { cwd: backend, stdio: 'inherit' })
  return r.status === 0 && existsSync(snapshotPath)
}

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const safeJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 's')
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function applyHead(template, head) {
  let html = template
  if (!head) return html
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeText(head.title)}</title>`)
  html = setMeta(html, 'name', 'description', head.description)
  html = setMeta(html, 'property', 'og:title', head.title)
  html = setMeta(html, 'property', 'og:description', head.description)
  html = setMeta(html, 'property', 'og:type', head.type)
  html = setMeta(html, 'name', 'twitter:title', head.title)
  html = setMeta(html, 'name', 'twitter:description', head.description)
  html = setMeta(html, 'name', 'robots', head.noindex ? 'noindex, nofollow' : 'index, follow')
  const extra = []
  if (head.canonical) {
    extra.push(`<link rel="canonical" href="${escapeAttr(head.canonical)}" />`)
    html = setMeta(html, 'property', 'og:url', head.canonical)
  }
  if (head.jsonLd) extra.push(`<script type="application/ld+json" id="page-jsonld">${head.jsonLd.replace(/</g, '\\u003c')}</script>`)
  return extra.length ? html.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`) : html
}

async function main() {
  const templatePath = resolve(dist, 'index.html')
  if (!existsSync(templatePath) || !existsSync(resolve(ssrDir, 'entry-server.js'))) {
    console.error('[prerender] Run `vite build` and the SSR build first.')
    process.exit(1)
  }
  const template = readFileSync(templatePath, 'utf-8')
  writeFileSync(resolve(dist, 'spa.html'), template)

  if (!ensureSnapshot()) {
    console.warn('[prerender] No API snapshot available: pages will render in the browser only.')
    console.warn('[prerender] Generate one with: cd backend && python -m app.cli export-api')
    rmSync(ssrDir, { recursive: true, force: true })
    return
  }
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'))
  const { render, loadSnapshot } = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href)
  loadSnapshot(snapshot)

  const staticRoutes = ['/', '/services', '/courses', '/corporate-training', '/knowledge', '/projects', '/about', '/contact', '/privacy']
  const detail = [
    ['/api/services', '/services'],
    ['/api/courses', '/courses'],
    ['/api/articles', '/knowledge'],
    ['/api/projects', '/projects'],
  ].flatMap(([api, base]) => (snapshot[api]?.items ?? []).map((i) => `${base}/${i.slug}`))
  const routes = [...staticRoutes, ...detail]

  let count = 0
  for (const route of routes) {
    const { html, head, data } = await render(route)
    let page = applyHead(template, head)
    page = page.replace(
      '<div id="root"></div>',
      // A JSON block, not an inline script: it is never executed, so the CSP can forbid inline scripts.
      `<div id="root">${html}</div>\n    <script type="application/json" id="ssr-data">${safeJson(data)}</script>`,
    )
    const out = route === '/' ? templatePath : resolve(dist, `.${route}`, 'index.html')
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, page)
    count++
  }
  rmSync(ssrDir, { recursive: true, force: true })
  console.log(`[prerender] ${count} pages prerendered from ${snapshotPath}`)
}

main().catch((err) => {
  console.error('[prerender] failed:', err)
  process.exit(1)
})
