import type { ReactNode } from 'react'
import type { Availability } from '../../types/content'

type Tone = 'neutral' | 'brand' | 'accent' | 'warning' | 'success'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-line',
  brand: 'bg-brand-soft text-brand border-transparent',
  accent: 'bg-accent-soft text-accent-strong border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  success: 'bg-success-soft text-success border-transparent',
}

export function Badge({ tone = 'neutral', color, children, className = '' }: { tone?: Tone; color?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${color ?? tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

const AVAILABILITY: Record<Availability, { label: string; tone: Tone; hint: string }> = {
  proposed: { label: 'Accepting enquiries', tone: 'accent', hint: 'Dates, fees and delivery mode are confirmed when a cohort is scheduled.' },
  enquiries_open: { label: 'Enquiries open', tone: 'accent', hint: 'Register your interest to hear about the next cohort.' },
  enrolling: { label: 'Enrolling', tone: 'success', hint: 'Enrolment is open.' },
  closed: { label: 'Not currently offered', tone: 'neutral', hint: 'This offering is not available at the moment.' },
}

export function AvailabilityBadge({ value, kind = 'course' }: { value?: Availability; kind?: 'course' | 'service' }) {
  if (!value) return null
  const a = AVAILABILITY[value]
  const label = kind === 'service' && value === 'proposed' ? 'Accepting new projects' : a.label
  return (
    <Badge tone={a.tone}>
      <span title={a.hint}>{label}</span>
    </Badge>
  )
}

export function availabilityHint(value?: Availability) {
  return value ? AVAILABILITY[value].hint : ''
}

export const LEVEL_TONE: Record<string, Tone> = { Beginner: 'success', Intermediate: 'brand', Advanced: 'accent' }

export const FORMAT_LABEL: Record<string, string> = {
  'short-course': 'Short course',
  workshop: 'Workshop',
  extended: 'Extended training',
}
