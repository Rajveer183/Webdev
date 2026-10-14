import { describe, expect, it } from 'vitest'
import { cleanPayload, consultingSchema, contactSchema, corporateSchema } from '../components/forms/schemas'
import { formatPages } from '../components/ui/Lists'

const base = { name: 'Asha Verma', email: 'asha@example.com', phone: '', organisation: '', preferred_contact: 'email' as const, consent: true, website: '' }

describe('form schemas', () => {
  it('accepts a valid consulting enquiry', () => {
    const r = consultingSchema.safeParse({
      ...base,
      service_slug: '',
      client_type: 'business',
      project_description: 'Forecast monthly demand for 40 product lines.',
      data_status: 'ready',
      timeline: 'flexible',
      budget_range: '',
      preferred_date: '',
      preferred_time: '',
    })
    expect(r.success).toBe(true)
  })

  it('requires consent and a real email', () => {
    const r = contactSchema.safeParse({ ...base, email: 'nope', consent: false, subject: 'Hi there', message: 'A short message.' })
    expect(r.success).toBe(false)
    const fields = r.error!.issues.map((i) => i.path[0])
    expect(fields).toContain('email')
    expect(fields).toContain('consent')
  })

  it('asks for a phone number when a call is preferred', () => {
    const r = contactSchema.safeParse({ ...base, preferred_contact: 'phone', subject: 'Call me', message: 'Please call me back.' })
    expect(r.success).toBe(false)
    expect(r.error!.issues[0].path).toEqual(['phone'])
  })

  it('coerces team size and requires an organisation for corporate training', () => {
    const r = corporateSchema.safeParse({
      ...base,
      organisation: 'Acme',
      job_title: '',
      team_size: '12',
      workshop_slugs: [],
      preferred_format: 'not_sure',
      preferred_mode: 'no_preference',
      timeline: 'flexible',
      objectives: 'Teach our analysts control charts and capability analysis.',
    })
    expect(r.success).toBe(true)
    expect(r.success && r.data.team_size).toBe(12)
  })

  it('turns empty strings into nulls before submission', () => {
    expect(cleanPayload({ a: '', b: 'x', c: false })).toEqual({ a: null, b: 'x', c: false })
  })
})

describe('formatPages', () => {
  it('collapses consecutive pages into ranges', () => {
    expect(formatPages([2, 3, 13, 14, 29, 30, 31, 70])).toBe('2–3, 13–14, 29–31, 70')
    expect(formatPages([5])).toBe('5')
  })
})
