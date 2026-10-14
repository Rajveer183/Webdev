import { ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, Loading } from '../../components/ui/States'
import { ApiError } from '../../services/api'
import { adminRequest, type CatalogueRow } from './adminApi'
import { ContentEditor } from './ContentEditor'

const KINDS = [
  { key: 'service', label: 'Services', path: '/services' },
  { key: 'course', label: 'Courses', path: '/courses' },
  { key: 'article', label: 'Articles', path: '/knowledge' },
  { key: 'project', label: 'Projects', path: '/projects' },
  { key: 'workshop', label: 'Workshops', path: '/corporate-training' },
] as const
const STATUSES = ['published', 'draft', 'archived']
const AVAILABILITY = ['proposed', 'enquiries_open', 'enrolling', 'closed']
const select = 'h-8 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink'

export function CatalogueTab() {
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('course')
  const [rows, setRows] = useState<CatalogueRow[]>()
  const [error, setError] = useState<ApiError>()
  const [editing, setEditing] = useState<string | null>(null)
  const [flash, setFlash] = useState('')

  const load = useCallback(() => {
    setRows(undefined)
    setError(undefined)
    adminRequest<CatalogueRow[]>(`/catalogue/${kind}`).then(setRows).catch(setError)
  }, [kind])
  useEffect(() => {
    load()
  }, [load])

  async function patch(slug: string, body: Record<string, unknown>) {
    try {
      const updated = await adminRequest<CatalogueRow>(`/catalogue/${kind}/${slug}`, { method: 'PATCH', body })
      setRows((rs) => rs?.map((r) => (r.slug === slug ? updated : r)))
      setFlash(`Updated ${slug}`)
    } catch (e) {
      setFlash(`Could not update ${slug}: ${(e as Error).message}`)
    }
  }

  const base = KINDS.find((k) => k.key === kind)!.path
  const hasAvailability = kind === 'course' || kind === 'service'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Catalogue</h1>
        <p className="text-sm text-muted">Only published records appear on the website. Changes apply immediately.</p>
      </div>
      <div role="tablist" aria-label="Content type" className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            role="tab"
            aria-selected={kind === k.key}
            onClick={() => setKind(k.key)}
            className={`rounded-full border px-3 py-1 text-sm ${kind === k.key ? 'border-brand bg-brand text-brand-fg' : 'border-line text-muted hover:text-ink'}`}
          >
            {k.label}
          </button>
        ))}
      </div>
      {flash && (
        <p role="status" className="text-sm text-muted">
          {flash}
        </p>
      )}
      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-surface-2 text-subtle">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                {hasAvailability && <th className="px-4 py-2.5 font-medium">Availability</th>}
                <th className="px-4 py-2.5 font-medium">Featured</th>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.slug}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">{r.title}</p>
                    <p className="text-xs text-subtle">
                      {[r.category, r.level].filter(Boolean).join(' · ')} · <span className="font-mono">{r.slug}</span>
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <select aria-label={`Status of ${r.title}`} value={r.status} onChange={(e) => patch(r.slug, { status: e.target.value })} className={select}>
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  {hasAvailability && (
                    <td className="px-4 py-2.5">
                      <select
                        aria-label={`Availability of ${r.title}`}
                        value={r.availability ?? 'proposed'}
                        onChange={(e) => patch(r.slug, { availability: e.target.value })}
                        className={select}
                      >
                        {AVAILABILITY.map((a) => (
                          <option key={a} value={a}>
                            {a.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Feature ${r.title}`}
                      checked={r.featured}
                      onChange={(e) => patch(r.slug, { featured: e.target.checked })}
                      className="h-4 w-4 accent-[var(--brand)]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      aria-label={`Order of ${r.title}`}
                      defaultValue={r.order}
                      onBlur={(e) => Number(e.target.value) !== r.order && patch(r.slug, { order: Number(e.target.value) })}
                      className={`${select} w-16`}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button type="button" onClick={() => setEditing(r.slug)} className="mr-3 text-sm font-medium text-link hover:underline">
                      Edit
                    </button>
                    {r.status === 'published' && kind !== 'workshop' && (
                      <Link to={`${base}/${r.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
                        View <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ContentEditor kind={kind} slug={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}
