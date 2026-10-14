import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ErrorState, Loading } from '../../components/ui/States'
import { useEscape } from '../../hooks/useEscape'
import type { ApiError } from '../../services/api'
import { adminRequest, type EnquiryRow } from './adminApi'

const STATUSES = ['new', 'in_progress', 'responded', 'closed', 'spam']
const TYPES = ['consulting', 'course', 'corporate', 'contact']
const select = 'h-9 rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-ink'

function Detail({ e, onClose, onSaved }: { e: EnquiryRow; onClose: () => void; onSaved: (e: EnquiryRow) => void }) {
  const [status, setStatus] = useState(e.status)
  const [notes, setNotes] = useState(e.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  useEscape(onClose)

  async function resend() {
    setSending(true)
    setMsg('')
    try {
      const updated = await adminRequest<EnquiryRow>(`/enquiries/${e.id}/notify`, { method: 'POST' })
      onSaved(updated)
      setMsg(updated.notification_status === 'sent' ? 'E-mail sent' : 'Sending failed; check the SMTP settings (python -m app.cli test-email)')
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const updated = await adminRequest<EnquiryRow>(`/enquiries/${e.id}`, { method: 'PATCH', body: { status, admin_notes: notes } })
      onSaved(updated)
      setMsg('Saved')
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Enquiry ${e.reference}`} className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-surface p-6 shadow-xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-subtle">{e.reference}</p>
            <h2 className="text-lg font-semibold text-ink">{e.subject ?? 'Enquiry'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-surface-2">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-subtle">Received</dt>
          <dd className="text-ink">{new Date(e.created_at).toLocaleString()}</dd>
          <dt className="text-subtle">Name</dt>
          <dd className="text-ink">{e.name}</dd>
          <dt className="text-subtle">Email</dt>
          <dd>
            <a className="link" href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: your enquiry ${e.reference}`)}`}>
              {e.email}
            </a>
          </dd>
          {e.phone && (
            <>
              <dt className="text-subtle">Phone</dt>
              <dd className="text-ink">{e.phone}</dd>
            </>
          )}
          {e.organisation && (
            <>
              <dt className="text-subtle">Organisation</dt>
              <dd className="text-ink">{e.organisation}</dd>
            </>
          )}
          <dt className="text-subtle">Contact via</dt>
          <dd className="text-ink">{e.preferred_contact.replace('_', ' ')}</dd>
          {Object.entries(e.details).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-subtle">{k.replace(/_/g, ' ')}</dt>
              <dd className="text-ink">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
            </div>
          ))}
          <dt className="text-subtle">E-mail</dt>
          <dd className="flex flex-wrap items-center gap-2 text-ink">
            {e.notification_status === 'sent' ? 'Sent to the enquiries inbox' : e.notification_status === 'skipped' ? 'Not sent (e-mail not configured)' : e.notification_status}
            {e.notification_status !== 'sent' && (
              <button type="button" onClick={resend} disabled={sending} className="text-sm font-medium text-link hover:underline disabled:opacity-60">
                {sending ? 'Sending…' : 'Send e-mail now'}
              </button>
            )}
          </dd>
        </dl>
        {e.message && <p className="mt-5 rounded-xl bg-surface-2 p-4 text-sm leading-6 whitespace-pre-wrap text-ink">{e.message}</p>}
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-ink">
            Status
            <select value={status} onChange={(ev) => setStatus(ev.target.value)} className={`${select} mt-1 block w-full`}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Internal notes
            <textarea
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-line-strong bg-surface p-2.5 text-sm text-ink"
            />
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving} size="sm">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {msg && (
              <span role="status" className="text-sm text-muted">
                {msg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EnquiriesTab() {
  const [rows, setRows] = useState<EnquiryRow[]>()
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState<ApiError>()
  const [open, setOpen] = useState<EnquiryRow | null>(null)
  const pageSize = 25

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (type) p.set('type', type)
    if (status) p.set('status', status)
    if (q) p.set('q', q)
    setError(undefined)
    adminRequest<{ items: EnquiryRow[]; total: number }>(`/enquiries?${p}`)
      .then((d) => {
        setRows(d.items)
        setTotal(d.total)
      })
      .catch(setError)
  }, [page, type, status, q])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Enquiries</h1>
        <p className="text-sm text-muted">Personal data: handle according to the privacy notice.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Type" value={type} onChange={(e) => { setPage(1); setType(e.target.value) }} className={select}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className={select}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <input
          aria-label="Search name, email or reference"
          placeholder="Search name, email, reference"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value) }}
          className={`${select} w-64`}
        />
      </div>
      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">No enquiries match.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-surface-2 text-subtle">
              <tr>
                <th className="px-4 py-2.5 font-medium">Received</th>
                <th className="px-4 py-2.5 font-medium">Reference</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">From</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-surface-2/60" onClick={() => setOpen(r)}>
                  <td className="px-4 py-2.5 text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <button type="button" className="font-mono text-link hover:underline" onClick={() => setOpen(r)}>
                      {r.reference}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-ink capitalize">{r.type}</td>
                  <td className="px-4 py-2.5 text-ink">
                    {r.name}
                    {r.organisation && <span className="text-subtle"> · {r.organisation}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.status === 'new' ? 'warning' : r.status === 'responded' || r.status === 'closed' ? 'success' : 'neutral'}>
                      {r.status.replace('_', ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
            <span>
              {total} enquir{total === 1 ? 'y' : 'ies'}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      {open && (
        <Detail
          e={open}
          onClose={() => setOpen(null)}
          onSaved={(u) => {
            setOpen(u)
            setRows((rs) => rs?.map((r) => (r.id === u.id ? u : r)))
          }}
        />
      )}
    </div>
  )
}
