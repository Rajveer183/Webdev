import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { formatPages } from '../../components/ui/Lists'
import { ErrorState, Loading } from '../../components/ui/States'
import type { ApiError } from '../../services/api'
import { adminRequest, type TopicRow } from './adminApi'

const select = 'h-9 rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-ink'
const TONE: Record<string, 'success' | 'warning' | 'neutral'> = { approved: 'success', pending_review: 'warning', excluded: 'neutral' }

export function TopicsTab() {
  const [rows, setRows] = useState<TopicRow[]>()
  const [status, setStatus] = useState('pending_review')
  const [origin, setOrigin] = useState('')
  const [error, setError] = useState<ApiError>()

  const load = useCallback(() => {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (origin) p.set('origin', origin)
    setRows(undefined)
    adminRequest<TopicRow[]>(`/topics?${p}`).then(setRows).catch(setError)
  }, [status, origin])
  useEffect(() => {
    load()
  }, [load])

  async function decide(t: TopicRow, next: string) {
    const note = window.prompt(`Review note for "${t.name}" (optional)`, t.review_note ?? '')
    if (note === null) return
    try {
      const updated = await adminRequest<TopicRow>(`/topics/${encodeURIComponent(t.id)}`, { method: 'PATCH', body: { status: next, review_note: note } })
      setRows((rs) => (status && updated.status !== status ? rs?.filter((r) => r.id !== t.id) : rs?.map((r) => (r.id === t.id ? updated : r))))
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">PDF-derived topics</h1>
        <p className="max-w-3xl text-sm text-muted">
          The content catalogue built from the source syllabus. Curated topics are linked to services, courses and articles; topics created by
          PDF ingestion start as <em>pending review</em> and are never published automatically. Approved topics appear in the Knowledge Hub
          subject map.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
          <option value="">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="excluded">Excluded</option>
        </select>
        <select aria-label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} className={select}>
          <option value="">All origins</option>
          <option value="curated">Curated catalogue</option>
          <option value="pdf-ingestion">PDF ingestion</option>
        </select>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {t.origin} · {t.data.syllabus_code ?? 'no code'} · semester {t.data.semester ?? '?'} · pp.{' '}
                    {formatPages((t.data.source_pages as number[]) ?? [])}
                  </p>
                  {t.review_note && <p className="mt-2 text-sm text-muted">{t.review_note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={TONE[t.status]}>{t.status.replace('_', ' ')}</Badge>
                  {t.status !== 'approved' && (
                    <button type="button" onClick={() => decide(t, 'approved')} className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-success hover:bg-success-soft">
                      Approve
                    </button>
                  )}
                  {t.status !== 'excluded' && (
                    <button type="button" onClick={() => decide(t, 'excluded')} className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2">
                      Exclude
                    </button>
                  )}
                  {t.status !== 'pending_review' && (
                    <button type="button" onClick={() => decide(t, 'pending_review')} className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2">
                      Back to review
                    </button>
                  )}
                </div>
              </div>
              <details className="group mt-3">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-link [&::-webkit-details-marker]:hidden">
                  Show extracted data <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden />
                </summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-surface-2 p-3 text-xs leading-5 text-ink">{JSON.stringify(t.data, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
