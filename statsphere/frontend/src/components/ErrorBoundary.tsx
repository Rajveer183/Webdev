import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Catches rendering errors (including failed lazy-loaded chunks) and shows a recoverable error page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <ErrorFallback error={this.state.error} />
  }
}

export function ErrorFallback({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const chunk = /Loading chunk|dynamically imported module|Failed to fetch/i.test(message)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-accent">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">This Page Could Not Be Displayed</h1>
      <p className="mt-3 max-w-md text-muted">
        {chunk
          ? 'A newer version of the site may have been released. Reloading the page should fix this.'
          : 'An unexpected error occurred. Please reload the page or return to the homepage.'}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
        >
          Reload page
        </button>
        <a href="/" className="flex h-11 items-center rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink hover:bg-surface-2">
          Go to homepage
        </a>
      </div>
    </div>
  )
}
