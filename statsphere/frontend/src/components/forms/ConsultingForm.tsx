import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { useSite } from '../../hooks/useSite'
import type { ListResponse, ServiceCard } from '../../types/content'
import { SelectField, TextArea, TextField } from './Fields'
import { ConsentAndSubmit, ContactBasics, FormSuccess } from './FormParts'
import { baseDefaults, consultingSchema, timelineOptions, type ConsultingValues } from './schemas'
import { useEnquirySubmit } from './useEnquirySubmit'

export function ConsultingForm({ serviceSlug = '', compact = false }: { serviceSlug?: string; compact?: boolean }) {
  const { data: services } = useApi<ListResponse<ServiceCard>>('/api/services')
  const { bookingUrl } = useSite()
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<ConsultingValues>({
    resolver: zodResolver(consultingSchema),
    defaultValues: {
      ...baseDefaults,
      service_slug: serviceSlug,
      client_type: 'business',
      project_description: '',
      data_status: 'not_sure',
      timeline: 'flexible',
      budget_range: '',
      preferred_date: '',
      preferred_time: '',
    },
  })
  // Options arrive asynchronously; re-apply the preselection once they exist in the DOM.
  useEffect(() => {
    if (services && serviceSlug) setValue('service_slug', serviceSlug)
  }, [services, serviceSlug, setValue])
  const { state, submit, reset } = useEnquirySubmit<ConsultingValues>('/api/enquiries/consulting', setError)

  if (state.kind === 'success')
    return (
      <FormSuccess
        reference={state.reference}
        message={state.message}
        onReset={() => {
          resetForm()
          reset()
        }}
      />
    )

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="relative space-y-6" aria-label="Consultation request">
      <ContactBasics register={register} errors={errors} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Service of interest"
          placeholder="Not sure yet / something else"
          options={(services?.items ?? []).map((s) => ({ value: s.slug, label: s.title }))}
          error={errors.service_slug?.message}
          {...register('service_slug')}
        />
        <SelectField
          label="You are enquiring as"
          required
          options={[
            { value: 'business', label: 'A business or professional' },
            { value: 'researcher', label: 'A researcher' },
            { value: 'student', label: 'A student' },
            { value: 'public_sector', label: 'A public-sector or non-profit organisation' },
            { value: 'other', label: 'Other' },
          ]}
          {...register('client_type')}
        />
      </div>
      <TextArea
        label="Describe your problem or project"
        required
        rows={compact ? 4 : 6}
        hint="What question are you trying to answer, what data do you have, and how will the results be used?"
        error={errors.project_description?.message}
        {...register('project_description')}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField
          label="Is your data ready?"
          required
          options={[
            { value: 'ready', label: 'Yes, it is ready' },
            { value: 'partial', label: 'Partly' },
            { value: 'not_yet', label: 'Not yet collected' },
            { value: 'not_sure', label: 'Not sure' },
          ]}
          {...register('data_status')}
        />
        <SelectField label="Desired timeline" required options={timelineOptions} {...register('timeline')} />
        <TextField label="Indicative budget" placeholder="e.g. a range" error={errors.budget_range?.message} {...register('budget_range')} />
      </div>

      {!compact && (
        <fieldset className="rounded-2xl border border-line bg-surface-2/50 p-5">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-ink">
            <CalendarClock className="h-4 w-4 text-subtle" aria-hidden /> Preferred time for an initial call
          </legend>
          {bookingUrl ? (
            <p className="mt-1 text-sm text-muted">
              You can also{' '}
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="link">
                pick a time in our booking calendar
              </a>
              .
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Tell us when suits you and we will confirm a time by your preferred contact method.</p>
          )}
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <TextField label="Preferred date" type="date" min={today} suppressHydrationWarning {...register('preferred_date')} />
            <SelectField
              label="Preferred time of day"
              placeholder="No preference"
              options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'evening', label: 'Evening' },
                { value: 'any', label: 'Any time' },
              ]}
              {...register('preferred_time')}
            />
          </div>
        </fieldset>
      )}

      <ConsentAndSubmit register={register} errors={errors} submitting={isSubmitting} label="Request a consultation" state={state} />
    </form>
  )
}
