import { tc } from '../../lib/titleCase'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useReveal } from '../../hooks/useReveal'

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = '',
  tone = 'default',
  action,
}: {
  id?: string
  eyebrow?: string
  title?: ReactNode
  intro?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'default' | 'muted'
  action?: ReactNode
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id={id} className={`py-14 sm:py-20 ${tone === 'muted' ? 'bg-[var(--bg-section-alt)] border-y border-[var(--border)]' : 'bg-[var(--bg-page)]'} ${className}`}>
      <div ref={ref} className="container-page">
        {(title || eyebrow) && (
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
              {title && <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{tc(title)}</h2>}
              {intro && <p className="mt-3 text-base leading-7 text-muted">{intro}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export interface Crumb {
  label: string
  to?: string
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
  aside,
}: {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  crumbs?: Crumb[]
  children?: ReactNode
  /** Visual shown beside the heading on large screens (e.g. a subject illustration). */
  aside?: ReactNode
}) {
  return (
    <header className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--bg-hero)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_20rem_at_85%_-10%,var(--accent-soft),transparent)]" />
      <div className={`container-page relative py-12 sm:py-16 ${aside ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-12' : ''}`}>
        <div>
          {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-tight">{tc(title)}</h1>
          {intro && <div className="mt-4 max-w-3xl text-lg leading-8 text-muted">{intro}</div>}
          {children}
        </div>
        {aside && <div className="hidden lg:block">{aside}</div>}
      </div>
    </header>
  )
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-subtle">
        <li>
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
        </li>
        {items.map((c) => (
          <li key={c.label} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            {c.to ? (
              <Link to={c.to} className="hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-muted">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
