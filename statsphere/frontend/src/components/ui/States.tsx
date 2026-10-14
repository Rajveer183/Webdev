import { CircleAlert, LoaderCircle, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ApiError } from '../../services/api'
import { Button } from './Button'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-16 text-muted">
      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card h-56 animate-pulse p-6">
          <div className="h-10 w-10 rounded-xl bg-surface-3" />
          <div className="mt-5 h-4 w-2/3 rounded bg-surface-3" />
          <div className="mt-3 h-3 w-full rounded bg-surface-2" />
          <div className="mt-2 h-3 w-5/6 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ error, onRetry, title = 'This content could not be loaded' }: { error?: ApiError; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="card mx-auto flex max-w-xl flex-col items-center gap-3 p-8 text-center">
      <CircleAlert className="h-8 w-8 text-danger" aria-hidden />
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-muted">{error?.message ?? 'Please try again in a moment.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <SearchX className="h-7 w-7 text-subtle" aria-hidden />
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  )
}
