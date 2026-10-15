import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Breadcrumbs } from '../components/ui/Section'
import { SiteProvider } from '../hooks/useSite'
import { Footer } from '../layouts/Footer'
import { readSsrData, SSR_DATA_ID } from '../lib/ssrData'
import { clearCache } from '../services/api'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const service = (slug: string, title: string) => ({ slug, title })

function renderFooter() {
  return render(
    <MemoryRouter>
      <SiteProvider>
        <Footer />
      </SiteProvider>
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  beforeEach(() => clearCache())
  afterEach(() => vi.unstubAllGlobals())

  it('links the first four featured services from the API', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((s) => service(s, `Service ${s.toUpperCase()}`))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => Promise.resolve(url.startsWith('/api/services?featured=true') ? json(200, { items, total: 5 }) : json(404, {}))),
    )
    renderFooter()
    const nav = screen.getByRole('navigation', { name: 'Consulting' })
    expect(await within(nav).findByRole('link', { name: 'Service A' })).toHaveAttribute('href', '/services/a')
    expect(within(nav).getAllByRole('link')).toHaveLength(5) // "All services" + 4
    expect(within(nav).queryByRole('link', { name: 'Service E' })).toBeNull()
  })

  it('falls back to "All services" alone when the API fails', async () => {
    const fetch = vi.fn(() => Promise.resolve(json(500, { error: { code: 'error', message: 'down' } })))
    vi.stubGlobal('fetch', fetch)
    renderFooter()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled())
    const nav = screen.getByRole('navigation', { name: 'Consulting' })
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/services'])
  })
})

describe('Breadcrumbs', () => {
  it('marks the last crumb as the current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: 'About' }]} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByText('About')).toHaveAttribute('aria-current', 'page')
  })
})

describe('readSsrData', () => {
  const docWith = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

  it('parses the prerendered JSON block', () => {
    const doc = docWith(`<script type="application/json" id="${SSR_DATA_ID}">{"/api/site":{"ok":true}}</script>`)
    expect(readSsrData(doc)).toEqual({ '/api/site': { ok: true } })
  })

  it('returns null for the app shell or malformed data', () => {
    expect(readSsrData(docWith('<div id="root"></div>'))).toBeNull()
    expect(readSsrData(docWith(`<script type="application/json" id="${SSR_DATA_ID}">{oops</script>`))).toBeNull()
  })
})
