import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import type { ListResponse, Workshop } from '../../types/content'
import { SelectField, TextArea, TextField } from './Fields'
import { ConsentAndSubmit, ContactBasics, FormSuccess } from './FormParts'
import { baseDefaults, corporateSchema, timelineOptions, type CorporateValues } from './schemas'
import { useEnquirySubmit } from './useEnquirySubmit'

export function CorporateTrainingForm({ workshopSlug }: { workshopSlug?: string }) {
  const { data: workshops } = useApi<ListResponse<Workshop>>('/api/workshops')
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<CorporateValues>({
    resolver: zodResolver(corporateSchema),
    defaultValues: {
      ...baseDefaults,
      job_title: '',
      team_size: '' as unknown as number,
      workshop_slugs: workshopSlug ? [workshopSlug] : [],
      preferred_format: 'not_sure',
      preferred_mode: 'no_preference',
      timeline: 'flexible',
      objectives: '',
    },
  })
  // Options arrive asynchronously; re-apply the preselection once they exist in the DOM.
  useEffect(() => {
    if (workshops && workshopSlug) setValue('workshop_slugs', [workshopSlug])
  }, [workshops, workshopSlug, setValue])
  const { state, submit, reset } = useEnquirySubmit<CorporateValues>('/api/enquiries/corporate-training', setError)

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

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="relative space-y-6" aria-label="Corporate training proposal request">
      <ContactBasics register={register} errors={errors} organisationLabel="Organisation" organisationRequired />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your role" autoComplete="organization-title" error={errors.job_title?.message} {...register('job_title')} />
        <TextField
          label="Number of participants"
          type="number"
          inputMode="numeric"
          min={1}
          required
          error={errors.team_size?.message}
          {...register('team_size')}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">
          Workshops of interest <span className="font-normal text-subtle">(optional, choose any)</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(workshops?.items ?? []).map((w) => (
            <label
              key={w.slug}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-muted hover:border-line-strong has-[:checked]:border-ring has-[:checked]:bg-brand-soft/60"
            >
              <input type="checkbox" value={w.slug} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" {...register('workshop_slugs')} />
              <span className="text-ink">{w.title}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField
          label="Preferred format"
          required
          options={[
            { value: 'not_sure', label: 'Not sure yet' },
            { value: 'half_day', label: 'Half-day' },
            { value: 'one_day', label: 'One day' },
            { value: 'two_three_days', label: 'Two to three days' },
            { value: 'multi_week', label: 'Multi-week programme' },
          ]}
          {...register('preferred_format')}
        />
        <SelectField
          label="Delivery"
          required
          options={[
            { value: 'no_preference', label: 'No preference' },
            { value: 'online', label: 'Online' },
            { value: 'in-person', label: 'In person' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
          {...register('preferred_mode')}
        />
        <SelectField label="Timeline" required options={timelineOptions} {...register('timeline')} />
      </div>
      <TextArea
        label="Training goals"
        required
        rows={5}
        hint="Who will attend, their current skill level, the tools they use and what they should be able to do afterwards."
        error={errors.objectives?.message}
        {...register('objectives')}
      />
      <ConsentAndSubmit register={register} errors={errors} submitting={isSubmitting} label="Request a proposal" state={state} />
    </form>
  )
}
