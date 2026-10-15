// Checks the prerendered build in dist/ (run after `npm run build`).
//
// Every public page must carry its title, description and prerender data, pages with
// structured data must still emit it, and no HTML file may contain an inline executable
// script: the CSP in security-headers.conf allows scripts from 'self' only.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, process.env.PRERENDER_DIST || 'dist')

// Route prefixes whose pages emit JSON-LD (Home, services, courses and articles).
const JSON_LD = [/^\/$/, /^\/services\/[^/]+$/, /^\/courses\/[^/]+$/, /^\/knowledge\/[^/]+$/]
const DATA_TYPES = new Set(['application/json', 'application/ld+json'])

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'assets') yield* htmlFiles(p)
    } else if (entry.name.endsWith('.html')) yield p
  }
}

function inlineScripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>/g)].filter(([, attrs]) => {
    if (/\bsrc=/.test(attrs)) return false
    const type = attrs.match(/\btype="([^"]+)"/)?.[1]
    return !type || !DATA_TYPES.has(type)
  })
}

const errors = []
let pages = 0
if (!existsSync(resolve(dist, 'theme-init.js'))) errors.push('theme-init.js: missing')

for (const file of htmlFiles(dist)) {
  const name = relative(dist, file).split(sep).join('/')
  const html = readFileSync(file, 'utf-8')
  const fail = (msg) => errors.push(`${name}: ${msg}`)
  if (inlineScripts(html).length) fail('inline executable <script> (blocked by the CSP)')
  if (!html.includes('<script src="/theme-init.js"></script>')) fail('theme-init.js is not loaded')
  if (name === 'spa.html') continue

  pages++
  const route = name === 'index.html' ? '/' : `/${name.replace(/\/index\.html$/, '')}`
  if (!/<title>[^<]+<\/title>/.test(html)) fail('missing <title>')
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail('missing description')
  if (!html.includes('<script type="application/json" id="ssr-data">')) fail('missing prerender data (#ssr-data)')
  if (JSON_LD.some((re) => re.test(route)) && !html.includes('type="application/ld+json"')) fail('missing JSON-LD')
}

if (pages === 0) errors.push('no prerendered pages found: run `npm run build` first')
if (errors.length) {
  console.error(`[check-dist] ${errors.length} problem(s):\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log(`[check-dist] ${pages} prerendered pages OK`)
