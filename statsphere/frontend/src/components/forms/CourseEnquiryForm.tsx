import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import type { CourseCard, ListResponse } from '../../types/content'
import { SelectField, TextArea } from './Fields'
import { ConsentAndSubmit, ContactBasics, FormAlert, FormSuccess } from './FormParts'
import { baseDefaults, courseSchema, type CourseValues } from './schemas'
import { useEnquirySubmit } from './useEnquirySubmit'

export function CourseEnquiryForm({ courseSlug = '' }: { courseSlug?: string }) {
  const { data: courses } = useApi<ListResponse<CourseCard>>('/api/courses')
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<CourseValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      ...baseDefaults,
      course_slug: courseSlug,
      learner_type: 'student',
      experience_level: 'some',
      preferred_mode: 'no_preference',
      message: '',
    },
  })
  // Options arrive asynchronously; re-apply the preselection once they exist in the DOM.
  useEffect(() => {
    if (courses && courseSlug) setValue('course_slug', courseSlug)
  }, [courses, courseSlug, setValue])
  const { state, submit, reset } = useEnquirySubmit<CourseValues>('/api/enquiries/courses', setError)

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
    <form noValidate onSubmit={handleSubmit(submit)} className="relative space-y-6" aria-label="Course enquiry">
      <FormAlert tone="info">
        Courses are currently proposed offerings. Registering your interest is free and does not commit you to anything. We will contact you
        with confirmed dates, delivery mode and fees.
      </FormAlert>
      <SelectField
        label="Course"
        required
        placeholder="Choose a course"
        options={(courses?.items ?? []).map((c) => ({ value: c.slug, label: `${c.title} (${c.level})` }))}
        error={errors.course_slug?.message}
        {...register('course_slug')}
      />
      <ContactBasics register={register} errors={errors} />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField
          label="You are a"
          required
          options={[
            { value: 'student', label: 'Student' },
            { value: 'professional', label: 'Working professional' },
            { value: 'researcher', label: 'Researcher' },
            { value: 'educator', label: 'Educator' },
            { value: 'other', label: 'Other' },
          ]}
          {...register('learner_type')}
        />
        <SelectField
          label="Experience with the topic"
          required
          options={[
            { value: 'none', label: 'New to it' },
            { value: 'some', label: 'Some experience' },
            { value: 'confident', label: 'Confident' },
          ]}
          {...register('experience_level')}
        />
        <SelectField
          label="Preferred format"
          required
          options={[
            { value: 'no_preference', label: 'No preference' },
            { value: 'online', label: 'Online' },
            { value: 'in-person', label: 'In person' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
          {...register('preferred_mode')}
        />
      </div>
      <TextArea
        label="Anything else we should know?"
        rows={4}
        hint="For example, your goals, preferred schedule or questions about the syllabus."
        error={errors.message?.message}
        {...register('message')}
      />
      <ConsentAndSubmit register={register} errors={errors} submitting={isSubmitting} label="Send course enquiry" state={state} />
    </form>
  )
}
