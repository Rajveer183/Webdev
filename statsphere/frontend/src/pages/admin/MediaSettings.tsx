import { ImageUp, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { FormAlert } from '../../components/forms/FormParts'
import { brand } from '../../config/brand'
import { ApiError } from '../../services/api'
import { adminRequest } from './adminApi'

type Media = Record<string, { description: string; url: string | null }>

const FALLBACK: Record<string, string> = {
  'brand-logo': `SGT University seal (${brand.logo})`,
  'institution-logo': `Bundled file ${brand.institution.logo}`,
}

export function MediaSettings() {
  const [media, setMedia] = useState<Media>()
  const [msg, setMsg] = useState<{ tone: 'error' | 'info'; text: string }>()

  const load = useCallback(() => {
    adminRequest<Media>('/media').then(setMedia).catch(() => undefined)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  async function upload(key: string, file: File | undefined) {
    if (!file) return
    setMsg(undefined)
    const form = new FormData()
    form.append('file', file)
    try {
      await adminRequest(`/media/${key}`, { method: 'PUT', form })
      setMsg({ tone: 'info', text: 'Image uploaded. Public pages show it after a reload.' })
      load()
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Upload failed' })
    }
  }

  async function remove(key: string) {
    if (!window.confirm('Remove this image and go back to the default?')) return
    try {
      await adminRequest(`/media/${key}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Could not remove the image' })
    }
  }

  return (
    <fieldset className="card space-y-5 p-6">
      <legend className="px-1 font-semibold text-ink">Logos</legend>
      <p className="text-sm text-muted">PNG, JPEG or WebP, up to 1 MB. SVG is not accepted because it can contain scripts.</p>
      {msg && <FormAlert tone={msg.tone}>{msg.text}</FormAlert>}
      <div className="grid gap-5 sm:grid-cols-2">
        {media &&
          Object.entries(media).map(([key, m]) => (
            <div key={key} className="rounded-xl border border-line p-4">
              <p className="text-sm font-medium text-ink">{m.description}</p>
              <div className="mt-3 flex h-24 items-center justify-center rounded-lg bg-surface-2">
                {m.url ? (
                  <img src={m.url} alt="" className="max-h-20 max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-subtle">Using default: {FALLBACK[key]}</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-link hover:underline">
                  <ImageUp className="h-4 w-4" aria-hidden /> Upload
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      upload(key, e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
                {m.url && (
                  <button type="button" onClick={() => remove(key)} className="inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline">
                    <Trash2 className="h-4 w-4" aria-hidden /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </fieldset>
  )
}
