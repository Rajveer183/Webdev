import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { TextArea, TextField } from './Fields'
import { ConsentAndSubmit, ContactBasics, FormSuccess } from './FormParts'
import { baseDefaults, contactSchema, type ContactValues } from './schemas'
import { useEnquirySubmit } from './useEnquirySubmit'

export function ContactForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { ...baseDefaults, subject: '', message: '' },
  })
  const { state, submit, reset } = useEnquirySubmit<ContactValues>('/api/contact', setError)

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
    <form noValidate onSubmit={handleSubmit(submit)} className="relative space-y-6" aria-label="General contact">
      <ContactBasics register={register} errors={errors} />
      <TextField label="Subject" required error={errors.subject?.message} {...register('subject')} />
      <TextArea label="Message" required rows={6} error={errors.message?.message} {...register('message')} />
      <ConsentAndSubmit register={register} errors={errors} submitting={isSubmitting} label="Send message" state={state} />
    </form>
  )
}
