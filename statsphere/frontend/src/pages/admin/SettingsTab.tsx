import { useEffect, useState, type FormEvent } from 'react'
import { CheckboxField, TextField } from '../../components/forms/Fields'
import { FormAlert } from '../../components/forms/FormParts'
import { Button } from '../../components/ui/Button'
import { brand } from '../../config/brand'
import { ApiError } from '../../services/api'
import type { ContactSettings } from '../../types/content'
import { adminRequest } from './adminApi'
import { MediaSettings } from './MediaSettings'

type Brand = { name: string | null; tagline: string | null; show_institution_logo: boolean | null }

const CONTACT_FIELDS: { key: keyof ContactSettings; label: string; hint?: string; type?: string }[] = [
  { key: 'email', label: 'Public email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp number' },
  { key: 'address', label: 'Address', hint: 'Only add a real, verified business address.' },
  { key: 'hours', label: 'Opening hours', hint: 'e.g. Mon–Fri, 10:00–18:00' },
  { key: 'booking_url', label: 'Booking page URL', hint: 'An https:// scheduling link. Shown as “Schedule a call”.', type: 'url' },
  { key: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
]

export function SettingsTab() {
  const [contact, setContact] = useState<ContactSettings>()
  const [brandS, setBrand] = useState<Brand>()
  const [msg, setMsg] = useState<{ tone: 'error' | 'info'; text: string }>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminRequest<{ contact: ContactSettings; brand: Brand }>('/settings').then((d) => {
      setContact(d.contact)
      setBrand(d.brand)
    })
  }, [])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!contact || !brandS) return
    setSaving(true)
    setMsg(undefined)
    const clean = Object.fromEntries(Object.entries(contact).map(([k, v]) => [k, v === '' ? null : v]))
    const brandClean = { ...brandS, name: brandS.name || null, tagline: brandS.tagline || null }
    try {
      await adminRequest('/settings', { method: 'PUT', body: { contact: clean, brand: brandClean } })
      setMsg({ tone: 'info', text: 'Settings saved. Reload the public site to see changes.' })
    } catch (err) {
      const text =
        err instanceof ApiError && err.details.length ? err.details.map((d) => `${d.field}: ${d.message}`).join('; ') : (err as Error).message
      setMsg({ tone: 'error', text })
    } finally {
      setSaving(false)
    }
  }

  if (!contact || !brandS) return <p className="text-muted">Loading…</p>

  return (
    <form onSubmit={save} className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Settings</h1>
        <p className="text-sm text-muted">Public business details. Empty fields are hidden on the website, so nothing unverified is displayed.</p>
      </div>
      <fieldset className="card grid gap-5 p-6 sm:grid-cols-2">
        <legend className="px-1 font-semibold text-ink">Contact details</legend>
        {CONTACT_FIELDS.map((f) => (
          <TextField
            key={f.key}
            label={f.label}
            hint={f.hint}
            type={f.type ?? 'text'}
            value={contact[f.key] ?? ''}
            onChange={(e) => setContact({ ...contact, [f.key]: e.target.value })}
          />
        ))}
      </fieldset>
      <fieldset className="card grid gap-5 p-6 sm:grid-cols-2">
        <legend className="px-1 font-semibold text-ink">Brand</legend>
        <TextField label="Business name override" hint={`Default: ${brand.name}`} value={brandS.name ?? ''} onChange={(e) => setBrand({ ...brandS, name: e.target.value })} />
        <TextField label="Tagline override" hint={`Default: ${brand.tagline}`} value={brandS.tagline ?? ''} onChange={(e) => setBrand({ ...brandS, tagline: e.target.value })} />
        <div className="sm:col-span-2">
          <CheckboxField
            label={
              <>
                Show the {brand.institution.name} seal in the “A service of {brand.institution.name}” panel on the About and Knowledge Hub
                pages. The header and footer always use the business logo (Settings → Logos).
              </>
            }
            checked={brandS.show_institution_logo ?? brand.institution.showLogo}
            onChange={(e) => setBrand({ ...brandS, show_institution_logo: e.target.checked })}
          />
        </div>
      </fieldset>
      {msg && <FormAlert tone={msg.tone}>{msg.text}</FormAlert>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save settings'}
      </Button>
      <MediaSettings />
    </form>
  )
}
