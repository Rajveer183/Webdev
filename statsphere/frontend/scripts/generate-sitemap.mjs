// Generates public/sitemap.xml and public/robots.txt from the curated content files.
// Run automatically before `npm run build`. Set SITE_URL (or VITE_SITE_URL) to the public domain.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const contentDir = process.env.CONTENT_DIR ?? resolve(here, '../../data/content')
const publicDir = resolve(here, '../public')
const site = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').replace(/\/$/, '')

const load = (f) => JSON.parse(readFileSync(resolve(contentDir, f), 'utf-8')).filter((r) => r.status === 'published')
const staticPaths = ['/', '/services', '/courses', '/corporate-training', '/knowledge', '/projects', '/about', '/contact', '/privacy']
const dynamic = [
  ...load('services.json').map((r) => `/services/${r.slug}`),
  ...load('courses.json').map((r) => `/courses/${r.slug}`),
  ...load('articles.json').map((r) => `/knowledge/${r.slug}`),
  ...load('projects.json').map((r) => `/projects/${r.slug}`),
]

if (!site) {
  console.warn('[sitemap] SITE_URL not set: writing robots.txt without a sitemap reference and skipping sitemap.xml')
  writeFileSync(resolve(publicDir, 'robots.txt'), 'User-agent: *\nDisallow: /admin\n')
} else {
  const urls = [...staticPaths, ...dynamic].map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')
  writeFileSync(
    resolve(publicDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  writeFileSync(resolve(publicDir, 'robots.txt'), `User-agent: *\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n`)
  console.log(`[sitemap] ${staticPaths.length + dynamic.length} URLs for ${site}`)
}
