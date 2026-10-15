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

/** Per-page accent for the breadcrumb, eyebrow, title bar, glow and illustration frame, so each main section has its own colour. */
export type HeaderAccent = 'gold' | 'sky' | 'violet' | 'emerald' | 'indigo' | 'fuchsia' | 'teal'

interface AccentStyle {
  text: string
  /** Pill box behind the breadcrumb and eyebrow. */
  box: string
  dot: string
  /** Gradient bar under the title and frame around the illustration. */
  gradient: string
  /** Hex for the large blurred glow. */
  glow: string
}

const ACCENT: Record<HeaderAccent, AccentStyle> = {
  gold: {
    text: 'text-accent-text',
    box: 'border-amber-300/70 bg-amber-50/80 dark:border-amber-400/30 dark:bg-amber-500/10',
    dot: 'bg-amber-500',
    gradient: 'from-amber-500 via-amber-400 to-yellow-300',
    glow: '#FCD34D',
  },
  sky: {
    text: 'text-sky-700 dark:text-sky-300',
    box: 'border-sky-300/70 bg-sky-50/80 dark:border-sky-400/30 dark:bg-sky-500/10',
    dot: 'bg-sky-500',
    gradient: 'from-sky-400 via-sky-500 to-violet-500',
    glow: '#7DD3FC',
  },
  violet: {
    text: 'text-violet-700 dark:text-violet-300',
    box: 'border-violet-300/70 bg-violet-50/80 dark:border-violet-400/30 dark:bg-violet-500/10',
    dot: 'bg-violet-500',
    gradient: 'from-violet-400 via-violet-500 to-fuchsia-500',
    glow: '#C4B5FD',
  },
  emerald: {
    text: 'text-emerald-700 dark:text-emerald-300',
    box: 'border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-400/30 dark:bg-emerald-500/10',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-400 via-emerald-500 to-teal-500',
    glow: '#6EE7B7',
  },
  indigo: {
    text: 'text-indigo-700 dark:text-indigo-300',
    box: 'border-indigo-300/70 bg-indigo-50/80 dark:border-indigo-400/30 dark:bg-indigo-500/10',
    dot: 'bg-indigo-500',
    gradient: 'from-indigo-500 via-indigo-400 to-sky-400',
    glow: '#A5B4FC',
  },
  fuchsia: {
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    box: 'border-fuchsia-300/70 bg-fuchsia-50/80 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/10',
    dot: 'bg-fuchsia-500',
    gradient: 'from-fuchsia-400 via-fuchsia-500 to-orange-400',
    glow: '#F0ABFC',
  },
  teal: {
    text: 'text-teal-700 dark:text-teal-300',
    box: 'border-teal-300/70 bg-teal-50/80 dark:border-teal-400/30 dark:bg-teal-500/10',
    dot: 'bg-teal-500',
    gradient: 'from-teal-400 via-teal-500 to-sky-500',
    glow: '#5EEAD4',
  },
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
        style={{ background: ACCENT[accent].glow }}
        className="pointer-events-none absolute -top-24 -right-24 h-[460px] w-[460px] rounded-full opacity-40 blur-[80px] dark:opacity-15"
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
          {eyebrow && (
            <p className={`eyebrow mb-4 inline-flex items-center gap-2 rounded-full border-[1.5px] px-3.5 py-1.5 shadow-sm backdrop-blur ${ACCENT[accent].box} ${ACCENT[accent].text}`}>
              <span aria-hidden className={`h-2 w-2 rounded-full ${ACCENT[accent].dot}`} />
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-tight">{tc(title)}</h1>
          <span aria-hidden className={`mt-5 block h-1.5 w-24 rounded-full bg-gradient-to-r ${ACCENT[accent].gradient}`} />
          {intro && <div className="mt-5 max-w-3xl text-lg leading-8 text-muted">{intro}</div>}
          {children}
        </div>
        {aside && (
          <div className="hidden lg:block">
            <div className={`rounded-[22px] bg-gradient-to-br p-[3px] shadow-xl shadow-slate-900/10 transition duration-300 hover:-translate-y-1 hover:rotate-[-0.5deg] ${ACCENT[accent].gradient}`}>
              <div className="rounded-[19px] bg-[var(--bg-card)] p-1">{aside}</div>
            </div>
          </div>
        )}
      </div>
      <WaveDivider color={nextColor} variant="wave-1" />
    </header>
  )
}

export function Breadcrumbs({ items, accent }: { items: Crumb[]; accent?: HeaderAccent }) {
  const a = accent ? ACCENT[accent] : undefined
  const current = a ? `font-semibold ${a.text}` : 'text-muted'
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol
        className={`inline-flex flex-wrap items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-sm text-subtle shadow-sm backdrop-blur ${
          a ? a.box : 'border-line-strong bg-surface/80'
        }`}
      >
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
