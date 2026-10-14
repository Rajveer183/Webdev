import { ArrowUp, ExternalLink } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { brand } from '../config/brand'
import { Loading } from '../components/ui/States'
import { Footer } from './Footer'
import { Header } from './Header'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function UtilityBar() {
  return (
    <div className="hidden bg-[var(--topbar-bg)] text-[var(--topbar-text)] md:block border-b border-[var(--border)]/20">
      <div className="container-page flex h-9 items-center justify-between text-xs">
        <a href={brand.institution.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--topbar-text)] hover:text-white transition-colors duration-150">
          A service of {brand.institution.name} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        <nav aria-label="Quick links" className="flex items-center">
          <Link to="/contact" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-150">
            Contact Us
          </Link>
        </nav>
      </div>
    </div>
  )
}

function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-6 bottom-6 z-30 hidden h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-lg transition hover:bg-surface-2 lg:flex ${
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  )
}

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-brand-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <UtilityBar />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
