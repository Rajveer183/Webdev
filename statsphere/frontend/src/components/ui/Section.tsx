import { tc } from '../../lib/titleCase'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useReveal } from '../../hooks/useReveal'
import { WaveDivider } from './WaveDivider'

type SectionTone = 'default' | 'muted' | 'blue' | 'cream' | 'lavender' | 'mint'

const TONE_BG: Record<SectionTone, string> = {
  default: 'bg-[var(--bg-page)]',
  muted: 'bg-[var(--bg-section-alt)]',
  blue: 'bg-[var(--bg-blue)]',
  cream: 'bg-[var(--bg-cream)]',
  lavender: 'bg-[var(--bg-lavender)]',
  mint: 'bg-[var(--bg-mint)]',
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = '',
  tone = 'default',
  action,
  dividerColor,
  dividerVariant = 'wave-1',
  isBandDivider = false,
}: {
  id?: string
  eyebrow?: string
  title?: ReactNode
  intro?: ReactNode
  children: ReactNode
  className?: string
  tone?: SectionTone
  action?: ReactNode
  dividerColor?: string
  dividerVariant?: 'wave-1' | 'wave-2'
  isBandDivider?: boolean
}) {
  const ref = useReveal<HTMLDivElement>()
  const hasDivider = Boolean(dividerColor || isBandDivider)

  return (
    <section id={id} className={`relative pt-14 sm:pt-20 ${TONE_BG[tone]} ${className}`}>
      <div ref={ref} className={`container-page ${hasDivider ? 'pb-14 sm:pb-20' : 'pb-14 sm:pb-20'}`}>
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
      {hasDivider && (
        <WaveDivider color={dividerColor} variant={dividerVariant} isBand={isBandDivider} />
      )}
    </section>
  )
}

/** Per-page accent for the breadcrumb and eyebrow, so each main section has its own colour. */
export type HeaderAccent = 'gold' | 'sky' | 'violet' | 'emerald' | 'indigo' | 'rose' | 'teal'

const ACCENT_TEXT: Record<HeaderAccent, string> = {
  gold: 'text-accent',
  sky: 'text-sky-700 dark:text-sky-300',
  violet: 'text-violet-700 dark:text-violet-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  rose: 'text-rose-700 dark:text-rose-300',
  teal: 'text-teal-700 dark:text-teal-300',
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
  nextColor = 'var(--bg-blue)',
  accent = 'gold',
}: {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  crumbs?: Crumb[]
  children?: ReactNode
  /** Visual shown beside the heading on large screens (e.g. a subject illustration). */
  aside?: ReactNode
  nextColor?: string
  accent?: HeaderAccent
}) {
  return (
    <header style={{ background: 'var(--bg-hero)' }} className="relative overflow-hidden bg-hero">
      {/* Soft blurred glow circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-[460px] w-[460px] rounded-full bg-[#9CC4FF] opacity-35 blur-[80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-[460px] w-[460px] rounded-full bg-[#FFE2A3] opacity-40 blur-[80px]"
      />

      {/* Hero subtle dotted pattern (primary at 6% opacity) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(var(--primary)_1.5px,transparent_1.5px)] [background-size:24px_24px]"
      />

      <div className={`container-page relative py-12 sm:py-16 ${aside ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-12' : ''}`}>
        <div>
          {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} accent={accent} />}
          {eyebrow && <p className={`eyebrow mb-3 ${ACCENT_TEXT[accent]}`}>{eyebrow}</p>}
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-tight">{tc(title)}</h1>
          {intro && <div className="mt-4 max-w-3xl text-lg leading-8 text-muted">{intro}</div>}
          {children}
        </div>
        {aside && <div className="hidden lg:block">{aside}</div>}
      </div>
      <WaveDivider color={nextColor} variant="wave-1" />
    </header>
  )
}

export function Breadcrumbs({ items, accent }: { items: Crumb[]; accent?: HeaderAccent }) {
  const current = accent ? `font-medium ${ACCENT_TEXT[accent]}` : 'text-muted'
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
              <span aria-current="page" className={current}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
