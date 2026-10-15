import { z } from 'zod'

// Interpreted parsing only: Zod's `new Function` probe would otherwise be reported as a CSP
// (script-src 'self') violation on every page with a form. Every form imports this module.
z.config({ jitless: true })

/** Client-side rules mirror backend/app/schemas/enquiry.py. The server remains the source of truth. */

const phone = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\+?[0-9 ()-]{7,20}$/.test(v), 'Enter a valid phone number (digits, spaces, +, - and brackets only)')

export const baseShape = {
  name: z.string().trim().min(2, 'Please enter your name').max(120, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email address'),
  phone,
  organisation: z.string().trim().max(160, 'Too long'),
  preferred_contact: z.enum(['email', 'phone', 'video_call']),
  consent: z.boolean().refine((v) => v, 'Please confirm that we may store your details to respond'),
  website: z.string(),
}

const phoneWhenCalled = <T extends { preferred_contact: string; phone: string }>(v: T) => v.preferred_contact !== 'phone' || v.phone.trim() !== ''
const phoneMsg = { message: 'Please add a phone number if you would like us to call you', path: ['phone'] }

export const timelineOptions = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'within_1_month', label: 'Within a month' },
  { value: '1_3_months', label: 'In 1–3 months' },
  { value: '3_6_months', label: 'In 3–6 months' },
  { value: 'flexible', label: 'Flexible' },
]

export const contactMethodOptions = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone call' },
  { value: 'video_call', label: 'Video call' },
]

export const consultingSchema = z
  .object({
    ...baseShape,
    service_slug: z.string(),
    client_type: z.enum(['business', 'researcher', 'student', 'public_sector', 'other']),
    project_description: z
      .string()
      .trim()
      .min(20, 'Please describe your project in at least 20 characters')
      .max(5000, 'Please keep this under 5,000 characters'),
    data_status: z.enum(['ready', 'partial', 'not_yet', 'not_sure']),
    timeline: z.enum(['asap', 'within_1_month', '1_3_months', '3_6_months', 'flexible']),
    budget_range: z.string().trim().max(80, 'Too long'),
    preferred_date: z.string(),
    preferred_time: z.enum(['', 'morning', 'afternoon', 'evening', 'any']),
  })
  .refine(phoneWhenCalled, phoneMsg)

export const courseSchema = z
  .object({
    ...baseShape,
    course_slug: z.string().min(1, 'Please choose a course'),
    learner_type: z.enum(['student', 'professional', 'researcher', 'educator', 'other']),
    experience_level: z.enum(['none', 'some', 'confident']),
    preferred_mode: z.enum(['online', 'in-person', 'hybrid', 'no_preference']),
    message: z.string().trim().max(3000, 'Please keep this under 3,000 characters'),
  })
  .refine(phoneWhenCalled, phoneMsg)

export const corporateSchema = z
  .object({
    ...baseShape,
    organisation: z.string().trim().min(2, 'Please enter your organisation').max(160, 'Too long'),
    job_title: z.string().trim().max(120, 'Too long'),
    team_size: z.coerce.number<number>({ message: 'Enter the number of participants' }).int('Whole numbers only').min(1, 'At least 1').max(5000, 'Up to 5,000'),
    workshop_slugs: z.array(z.string()),
    preferred_format: z.enum(['half_day', 'one_day', 'two_three_days', 'multi_week', 'not_sure']),
    preferred_mode: z.enum(['online', 'in-person', 'hybrid', 'no_preference']),
    timeline: z.enum(['asap', 'within_1_month', '1_3_months', '3_6_months', 'flexible']),
    objectives: z
      .string()
      .trim()
      .min(20, 'Please describe your training goals in at least 20 characters')
      .max(5000, 'Please keep this under 5,000 characters'),
  })
  .refine(phoneWhenCalled, phoneMsg)

export const contactSchema = z
  .object({
    ...baseShape,
    subject: z.string().trim().min(3, 'Please add a subject').max(150, 'Too long'),
    message: z.string().trim().min(10, 'Please write at least 10 characters').max(5000, 'Please keep this under 5,000 characters'),
  })
  .refine(phoneWhenCalled, phoneMsg)

export type ConsultingValues = z.infer<typeof consultingSchema>
export type CourseValues = z.infer<typeof courseSchema>
export type CorporateValues = z.infer<typeof corporateSchema>
export type ContactValues = z.infer<typeof contactSchema>

export const baseDefaults = {
  name: '',
  email: '',
  phone: '',
  organisation: '',
  preferred_contact: 'email' as const,
  consent: false,
  website: '',
}

/** Convert empty strings to null so optional fields are omitted server-side. */
export function cleanPayload<T extends Record<string, unknown>>(values: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(values)) out[k] = v === '' ? null : v
  return out
}
