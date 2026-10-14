import { FileUp } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { FormAlert } from '../../components/forms/FormParts'
import { Button } from '../../components/ui/Button'
import { adminRequest, type IngestionRun } from './adminApi'

export function IngestionTab() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ run: IngestionRun; topics_created: number; topics_updated: number }>()
  const [error, setError] = useState('')
  const [runs, setRuns] = useState<IngestionRun[]>([])

  const loadRuns = () => adminRequest<IngestionRun[]>('/pdf-ingestion/runs').then(setRuns).catch(() => undefined)
  useEffect(() => {
    loadRuns()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError('')
    setResult(undefined)
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await adminRequest<{ run: IngestionRun; topics_created: number; topics_updated: number }>('/pdf-ingestion', { method: 'POST', form })
      setResult(r)
      loadRuns()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">PDF ingestion</h1>
        <p className="max-w-3xl text-sm text-muted">
          Upload a syllabus PDF to extract its course modules (name, code, units, outcomes, practicals and page references). Extracted
          modules are stored as topics <strong>pending review</strong>. Re-uploading refreshes the extracted data without changing review
          decisions. Scanned pages need the optional OCR extras (see README).
        </p>
      </div>
      <form onSubmit={submit} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-ink">
          PDF file
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full rounded-lg border border-line-strong bg-surface p-2 text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
        </label>
        <Button type="submit" disabled={!file || busy}>
          <FileUp className="h-4 w-4" aria-hidden /> {busy ? 'Processing…' : 'Upload & extract'}
        </Button>
      </form>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {result && (
        <div role="status" className="card space-y-2 p-5 text-sm">
          <p className="font-semibold text-ink">
            {result.run.filename}: {result.run.page_count} pages, {result.run.modules_found} modules
          </p>
          <p className="text-muted">
            Topics created: {result.topics_created} · updated: {result.topics_updated}. Review them in the PDF topics tab.
          </p>
          {result.run.warnings.length > 0 && (
            <details>
              <summary className="cursor-pointer text-link">{result.run.warnings.length} warning(s)</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {result.run.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {runs.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="px-4 pt-4 pb-2 text-left font-semibold text-ink">Recent runs</caption>
            <thead className="text-subtle">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Pages</th>
                <th className="px-4 py-2 font-medium">Modules</th>
                <th className="px-4 py-2 font-medium">Warnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.filename}</td>
                  <td className="px-4 py-2 tabular-nums">{r.page_count}</td>
                  <td className="px-4 py-2 tabular-nums">{r.modules_found}</td>
                  <td className="px-4 py-2 tabular-nums">{r.warnings.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
