import { titleCase } from '../../lib/titleCase'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { RichText } from '../content/RichText'

export function CheckList({ items, columns = 1 }: { items: string[]; columns?: 1 | 2 }) {
  return (
    <ul className={`grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[0.95rem] leading-7 text-muted">
          <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <Check className="h-3.5 w-3.5" aria-hidden />
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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-sm font-semibold text-brand">
              {i + 1}
            </span>
            {i < steps.length - 1 && <span aria-hidden className="mt-2 w-px flex-1 bg-line" />}
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

export function TagList({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((t) => (
        <li key={t} className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-sm text-muted">
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
