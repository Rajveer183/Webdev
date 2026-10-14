import { CircleAlert, CircleCheck, LoaderCircle, Mail } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import { Button } from '../ui/Button'
import { CheckboxField, Honeypot, SelectField, TextField } from './Fields'
import { contactMethodOptions } from './schemas'
import type { SubmitState } from './useEnquirySubmit'

type BaseFields = {
  name: string
  email: string
  phone: string
  organisation: string
  preferred_contact: string
  consent: boolean
  website: string
}

/** Name, email, phone, organisation and preferred contact method shared by every form. */
export function ContactBasics({
  register,
  errors,
  organisationLabel = 'Organisation or institution',
  organisationRequired = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  errors: FieldErrors<BaseFields>
  organisationLabel?: string
  organisationRequired?: boolean
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField label="Full name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
      <TextField label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register('email')} />
      <TextField
        label="Phone"
        type="tel"
        autoComplete="tel"
        hint="Needed only if you prefer a call."
        error={errors.phone?.message}
        {...register('phone')}
      />
      <TextField
        label={organisationLabel}
        required={organisationRequired}
        autoComplete="organization"
        error={errors.organisation?.message}
        {...register('organisation')}
      />
      <SelectField
        label="Preferred contact method"
        required
        options={contactMethodOptions}
        error={errors.preferred_contact?.message}
        {...register('preferred_contact')}
      />
    </div>
  )
}

export function ConsentAndSubmit({
  register,
  errors,
  submitting,
  label,
  state,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  errors: FieldErrors<BaseFields>
  submitting: boolean
  label: string
  state: SubmitState
}) {
  return (
    <div className="space-y-5">
      <Honeypot {...register('website')} />
      <CheckboxField
        label={
          <>
            I agree that my details may be stored and used to respond to this enquiry, as described in the{' '}
            <Link to="/privacy" className="link">
              privacy notice
            </Link>
            .
          </>
        }
        error={errors.consent?.message}
        {...register('consent')}
      />
      {state.kind === 'error' && <FormAlert tone="error">{state.message}</FormAlert>}
      {state.kind === 'unconfirmed' && (
        <FormAlert tone="error">
          We could not confirm your submission. Please wait a moment and try again, or contact us directly.
        </FormAlert>
      )}
      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
        {submitting ? 'Sending…' : label}
      </Button>
    </div>
  )
}

export function FormAlert({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  const styles = tone === 'error' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-line bg-surface-2 text-muted'
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function FormSuccess({ reference, message, onReset }: { reference: string; message: string; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { contact } = useSite()
  useEffect(() => ref.current?.focus(), [])
  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-2xl border border-success/30 bg-success-soft p-6 focus:outline-none">
      <div className="flex items-start gap-3">
        <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden />
        <div>
          <h3 className="font-semibold text-ink">Enquiry Received</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
          <p className="mt-3 text-sm text-muted">
            Your reference number is <strong className="font-mono text-ink">{reference}</strong>. Please quote it if you contact us about
            this enquiry.
          </p>
          {contact.email && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
              <Mail className="h-4 w-4" aria-hidden /> {contact.email}
            </p>
          )}
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onReset}>
              Send another enquiry
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
