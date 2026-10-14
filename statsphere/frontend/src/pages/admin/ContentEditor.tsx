import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { formatPages } from '../../components/ui/Lists'
import { useEscape } from '../../hooks/useEscape'
import { ApiError } from '../../services/api'
import { adminRequest, type CatalogueRow } from './adminApi'
import { FIELD_GROUPS, getPath, JSON_ONLY, parsePages, setPath, type FieldDef } from './contentFields'

type Record_ = Record<string, unknown>
type RefLists = Record<'service' | 'course' | 'article', CatalogueRow[]>

const input = 'block w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25'

function Label({ field, error, children }: { field: FieldDef; error?: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{field.label}</p>
      {children}
      {field.hint && !error && <p className="mt-1 text-xs text-subtle">{field.hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** One-item-per-line list editor. Keeps its own text so blank lines can be typed mid-edit. */
function ListField({ value, onChange, label }: { value: string[]; onChange: (v: string[]) => void; label: string }) {
  const [text, setText] = useState(value.join('\n'))
  return (
    <textarea
      aria-label={label}
      rows={Math.min(10, Math.max(3, value.length + 1))}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))
      }}
      className={`${input} font-normal leading-6`}
    />
  )
}

function PagesField({ value, onChange, onError, label }: { value: number[]; onChange: (v: number[]) => void; onError: (msg: string | null) => void; label: string }) {
  const [text, setText] = useState(formatPages(value).replace(/–/g, '-'))
  return (
    <input
      aria-label={label}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = parsePages(e.target.value)
        if (parsed && parsed.length && parsed.every((p) => p >= 1 && p <= 114)) {
          onChange(parsed)
          onError(null)
        } else onError('Enter page numbers between 1 and 114, e.g. 2, 3, 29-31')
      }}
      className={input}
    />
  )
}

function Rows<T>({ items, onChange, render, empty }: { items: T[]; onChange: (v: T[]) => void; render: (item: T, update: (v: T) => void, i: number) => ReactNode; empty: () => T }) {
  const move = (i: number, d: number) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-line bg-surface-2/50 p-3">
          <div className="min-w-0 flex-1">{render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}</div>
          <div className="flex flex-col gap-1">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-subtle hover:bg-surface-3 disabled:opacity-30">
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-subtle hover:bg-surface-3 disabled:opacity-30">
              <ArrowDown className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded p-1 text-danger hover:bg-danger-soft">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, empty()])} className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
        <Plus className="h-4 w-4" aria-hidden /> Add
      </button>
    </div>
  )
}

function FieldInput({
  field,
  record,
  setRecord,
  refs,
  error,
  setLocalError,
}: {
  field: FieldDef
  record: Record_
  setRecord: (r: Record_) => void
  refs: RefLists | undefined
  error?: string
  setLocalError: (key: string, msg: string | null) => void
}) {
  const value = getPath(record, field.key)
  const set = (v: unknown) => setRecord(setPath(record, field.key, v))

  switch (field.type) {
    case 'text':
      return (
        <Label field={field} error={error}>
          <input aria-label={field.label} value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} className={input} />
        </Label>
      )
    case 'nullable-text':
      return (
        <Label field={field} error={error}>
          <input aria-label={field.label} value={(value as string | null) ?? ''} onChange={(e) => set(e.target.value.trim() ? e.target.value : null)} className={input} />
        </Label>
      )
    case 'textarea':
      return (
        <Label field={field} error={error}>
          <textarea aria-label={field.label} rows={field.rows ?? 3} value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} className={`${input} leading-6`} />
        </Label>
      )
    case 'number':
      return (
        <Label field={field} error={error}>
          <input aria-label={field.label} type="number" min={1} value={(value as number) ?? ''} onChange={(e) => set(Number(e.target.value))} className={`${input} w-32`} />
        </Label>
      )
    case 'select':
      return (
        <Label field={field} error={error}>
          <select aria-label={field.label} value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} className={input}>
            {field.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Label>
      )
    case 'checkboxes': {
      const current = (value as string[]) ?? []
      return (
        <Label field={field} error={error}>
          <div className="flex flex-wrap gap-4">
            {field.options.map((o) => (
              <label key={o.value} className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={current.includes(o.value)}
                  onChange={(e) => set(e.target.checked ? [...current, o.value] : current.filter((v) => v !== o.value))}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                {o.label}
              </label>
            ))}
          </div>
        </Label>
      )
    }
    case 'list':
      return (
        <Label field={field} error={error}>
          <ListField label={field.label} value={(value as string[]) ?? []} onChange={set} />
          <p className="mt-1 text-xs text-subtle">One item per line.</p>
        </Label>
      )
    case 'pages':
      return (
        <Label field={field} error={error}>
          <PagesField label={field.label} value={(value as number[]) ?? []} onChange={set} onError={(m) => setLocalError(field.key, m)} />
        </Label>
      )
    case 'pairs': {
      const [a, b] = field.fields
      return (
        <Label field={field} error={error}>
          <Rows
            items={(value as Record<string, string>[]) ?? []}
            onChange={set}
            empty={() => ({ [a]: '', [b]: '' })}
            render={(item, update) => (
              <div className="grid gap-2">
                <input aria-label={field.labels[0]} placeholder={field.labels[0]} value={item[a] ?? ''} onChange={(e) => update({ ...item, [a]: e.target.value })} className={input} />
                <textarea aria-label={field.labels[1]} placeholder={field.labels[1]} rows={2} value={item[b] ?? ''} onChange={(e) => update({ ...item, [b]: e.target.value })} className={input} />
              </div>
            )}
          />
        </Label>
      )
    }
    case 'modules':
      return (
        <Label field={field} error={error}>
          <Rows
            items={(value as { title: string; topics: string[] }[]) ?? []}
            onChange={set}
            empty={() => ({ title: '', topics: [] })}
            render={(m, update) => (
              <div className="grid gap-2">
                <input aria-label="Module title" placeholder="Module title" value={m.title} onChange={(e) => update({ ...m, title: e.target.value })} className={input} />
                <ListField label="Topics (one per line)" value={m.topics} onChange={(topics) => update({ ...m, topics })} />
              </div>
            )}
          />
        </Label>
      )
    case 'refs': {
      const current = (value as string[]) ?? []
      const options = refs?.[field.target] ?? []
      return (
        <Label field={field} error={error}>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-line p-2">
            {options.map((o) => (
              <label key={o.slug} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-ink hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={current.includes(o.slug)}
                  onChange={(e) => set(e.target.checked ? [...current, o.slug] : current.filter((s) => s !== o.slug))}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                {o.title}
                {o.status !== 'published' && <span className="text-xs text-subtle">({o.status})</span>}
              </label>
            ))}
          </div>
        </Label>
      )
    }
  }
}

export function ContentEditor({ kind, slug, onClose, onSaved }: { kind: string; slug: string; onClose: () => void; onSaved: () => void }) {
  const [record, setRecord] = useState<Record_>()
  const [tab, setTab] = useState<'form' | 'json'>('form')
  const [jsonText, setJsonText] = useState('')
  const [refs, setRefs] = useState<RefLists>()
  const [serverErrors, setServerErrors] = useState<{ field: string; message: string }[]>([])
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  useEscape(onClose)

  useEffect(() => {
    adminRequest<Record_>(`/catalogue/${kind}/${slug}`).then((d) => {
      const copy = { ...d }
      delete copy.updated_at
      setRecord(copy)
    })
    Promise.all((['service', 'course', 'article'] as const).map((k) => adminRequest<CatalogueRow[]>(`/catalogue/${k}`))).then(([service, course, article]) =>
      setRefs({ service, course, article }),
    )
  }, [kind, slug])

  const errorByField = useMemo(() => {
    const m: Record<string, string> = Object.fromEntries(Object.entries(localErrors).filter(([, v]) => v))
    for (const e of serverErrors) {
      const top = e.field.replace(/^data\./, '').split('.').slice(0, 2).join('.')
      const key = top.startsWith('certificate') ? 'certificate.eligibility' : top.split('.')[0]
      m[key] ??= e.message
    }
    return m
  }, [serverErrors, localErrors])

  function switchTab(next: 'form' | 'json') {
    if (next === 'json' && record) setJsonText(JSON.stringify(record, null, 2))
    if (next === 'form') {
      try {
        setRecord(JSON.parse(jsonText))
      } catch (e) {
        setServerErrors([{ field: 'json', message: `Invalid JSON: ${(e as Error).message}` }])
        return
      }
    }
    setTab(next)
  }

  async function save() {
    setServerErrors([])
    let data = record
    if (tab === 'json') {
      try {
        data = JSON.parse(jsonText)
      } catch (e) {
        setServerErrors([{ field: 'json', message: `Invalid JSON: ${(e as Error).message}` }])
        return
      }
    }
    if (Object.values(localErrors).some(Boolean)) return
    setSaving(true)
    try {
      await adminRequest(`/catalogue/${kind}/${slug}`, { method: 'PATCH', body: { data } })
      onSaved()
      onClose()
    } catch (e) {
      if (e instanceof ApiError) setServerErrors(e.details.length ? e.details : [{ field: 'form', message: e.message }])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Edit ${slug}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">
              Edit {kind}: {(record?.title as string) ?? slug}
            </h2>
            <p className="font-mono text-xs text-subtle">{slug}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-surface-2">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div role="tablist" className="flex gap-1 border-b border-line px-5 pt-2">
          {(['form', 'json'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => switchTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {t === 'form' ? 'Form' : 'Advanced (JSON)'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!record ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : tab === 'json' ? (
            <textarea
              aria-label="Content JSON"
              spellCheck={false}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="min-h-[55vh] w-full rounded-lg border border-line-strong bg-surface-2 p-3 font-mono text-xs leading-5 text-ink"
            />
          ) : (
            <div className="space-y-8">
              {JSON_ONLY[kind] && <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">{JSON_ONLY[kind]}</p>}
              {(FIELD_GROUPS[kind] ?? []).map((group) => (
                <fieldset key={group.title} className="space-y-5">
                  <legend className="mb-3 text-sm font-semibold tracking-wide text-subtle uppercase">{group.title}</legend>
                  {group.fields.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      record={record}
                      setRecord={setRecord}
                      refs={refs}
                      error={errorByField[f.key]}
                      setLocalError={(k, m) => setLocalErrors((prev) => ({ ...prev, [k]: m ?? '' }))}
                    />
                  ))}
                </fieldset>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          {serverErrors.length > 0 && (
            <ul role="alert" className="mb-3 max-h-28 overflow-y-auto rounded-lg bg-danger-soft p-3 text-xs text-danger">
              {serverErrors.map((e) => (
                <li key={e.field + e.message}>
                  <strong>{e.field.replace(/^data\./, '')}</strong>: {e.message}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving || !record}>
              {saving ? 'Saving…' : 'Validate & save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
