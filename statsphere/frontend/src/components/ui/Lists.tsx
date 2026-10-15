import { titleCase } from '../../lib/titleCase'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { RichText } from '../content/RichText'
import { rotatingColor } from '../../lib/categoryColors'

export function CheckList({ items, columns = 1 }: { items: string[]; columns?: 1 | 2 }) {
  return (
    <ul className={`grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {items.map((item, i) => (
        <li key={item} className="flex gap-3 text-[0.95rem] leading-7 text-muted">
          <span className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full !shadow-sm ${rotatingColor(i).icon}`}>
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          </span>
          <span>
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Steps({ steps }: { steps: { title: string; detail: ReactNode }[] }) {
  return (
    <ol className="relative grid gap-6">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-[var(--bg-card)] ${rotatingColor(i).icon}`}>
              {i + 1}
            </span>
            {i < steps.length - 1 && <span aria-hidden className="mt-2 w-0.5 flex-1 rounded-full bg-gradient-to-b from-line-strong to-transparent" />}
          </div>
          <div className="pb-2">
            <h3 className="font-semibold text-ink">{titleCase(s.title)}</h3>
            <p className="mt-1 text-[0.95rem] leading-7 text-muted">{s.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function TagList({ items, label, offset = 0 }: { items: string[]; label?: string; offset?: number }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((t, i) => (
        <li key={t} className={`rounded-lg border px-2.5 py-1 text-sm font-medium ${rotatingColor(i + offset).badge}`}>
          {t}
        </li>
      ))}
    </ul>
  )
}

export function SourcePages({ pages, className = '' }: { pages: number[]; className?: string }) {
  if (!pages.length) return null
  return (
    <p className={`text-xs text-subtle ${className}`}>
      Subject basis: source syllabus {pages.length > 1 ? 'pages' : 'page'} {formatPages(pages)}
    </p>
  )
}

export function formatPages(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (const p of sorted.slice(1).concat([Number.NaN])) {
    if (p === prev + 1) {
      prev = p
      continue
    }
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`)
    start = p
    prev = p
  }
  return ranges.join(', ')
}
