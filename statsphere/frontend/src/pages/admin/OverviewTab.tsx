import { useEffect, useState } from 'react'
import { ErrorState, Loading } from '../../components/ui/States'
import type { ApiError } from '../../services/api'
import { adminRequest } from './adminApi'

interface Stats {
  enquiries_by_status: Record<string, number>
  enquiries_by_type: Record<string, number>
  catalogue_by_kind: Record<string, Record<string, number>>
  topics_by_status: Record<string, number>
}

function Tile({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="card p-5 text-left hover:border-line-strong">
      <p className="text-sm text-subtle">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink tabular-nums">{value}</p>
    </button>
  )
}

export function OverviewTab({ onNavigate }: { onNavigate: (tab: 'enquiries' | 'catalogue' | 'topics') => void }) {
  const [stats, setStats] = useState<Stats>()
  const [error, setError] = useState<ApiError>()
  useEffect(() => {
    adminRequest<Stats>('/stats').then(setStats).catch(setError)
  }, [])
  if (error) return <ErrorState error={error} />
  if (!stats) return <Loading />
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Overview</h1>
        <p className="text-sm text-muted">New enquiries and content awaiting review.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="New enquiries" value={stats.enquiries_by_status.new ?? 0} onClick={() => onNavigate('enquiries')} />
        <Tile label="In progress" value={stats.enquiries_by_status.in_progress ?? 0} onClick={() => onNavigate('enquiries')} />
        <Tile label="Total enquiries" value={sum(stats.enquiries_by_status)} onClick={() => onNavigate('enquiries')} />
        <Tile label="Topics pending review" value={stats.topics_by_status.pending_review ?? 0} onClick={() => onNavigate('topics')} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="px-5 pt-4 pb-2 text-left font-semibold text-ink">Catalogue</caption>
          <thead className="text-subtle">
            <tr>
              <th className="px-5 py-2 font-medium">Type</th>
              <th className="px-5 py-2 font-medium">Published</th>
              <th className="px-5 py-2 font-medium">Draft</th>
              <th className="px-5 py-2 font-medium">Archived</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink tabular-nums">
            {Object.entries(stats.catalogue_by_kind).map(([kind, s]) => (
              <tr key={kind}>
                <td className="px-5 py-2 capitalize">{kind}s</td>
                <td className="px-5 py-2">{s.published ?? 0}</td>
                <td className="px-5 py-2">{s.draft ?? 0}</td>
                <td className="px-5 py-2">{s.archived ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card p-5 text-sm text-muted">
        <p className="font-semibold text-ink">Enquiries by type</p>
        <p className="mt-2">
          {Object.entries(stats.enquiries_by_type)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · ') || 'No enquiries yet.'}
        </p>
      </div>
    </div>
  )
}
