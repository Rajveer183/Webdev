/**
 * Build-time renderer used by scripts/prerender.mjs (never shipped to browsers).
 * Renders one URL to HTML from the API snapshot, waiting for lazy routes and lazy
 * components (KaTeX, charts) so the output is complete.
 */
import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HeadContext, type HeadData } from './hooks/headContext'
import { SiteProvider } from './hooks/useSite'
import { routes } from './routes'
import { peekCache, primeCache, recordReads } from './services/api'

const handler = createStaticHandler(routes)

export function loadSnapshot(snapshot: Record<string, unknown>) {
  primeCache(snapshot, { markStale: false })
}

export interface RenderResult {
  html: string
  head: HeadData | null
  data: Record<string, unknown>
}

export async function render(url: string): Promise<RenderResult> {
  const context = await handler.query(new Request(new URL(url, 'http://prerender.local')))
  if (context instanceof Response) throw new Error(`Unexpected redirect while prerendering ${url}`)
  const router = createStaticRouter(handler.dataRoutes, context)
  const headStore: { head: HeadData | null } = { head: null }

  const stop = recordReads()
  const { prelude } = await prerender(
    <StrictMode>
      <HeadContext.Provider value={headStore}>
        <ErrorBoundary>
          <SiteProvider>
            <StaticRouterProvider router={router} context={context} hydrate={false} />
          </SiteProvider>
        </ErrorBoundary>
      </HeadContext.Provider>
    </StrictMode>,
  )
  const html = await new Response(prelude).text()
  const paths = stop()

  // Embed only the API responses this page read, so hydration sees identical data.
  const data: Record<string, unknown> = {}
  for (const p of paths) {
    const v = peekCache(p)
    if (v !== undefined) data[p] = v
  }
  return { html, head: headStore.head, data }
}
