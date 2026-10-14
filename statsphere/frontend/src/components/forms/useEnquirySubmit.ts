import { useRef, useState } from 'react'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError, request } from '../../services/api'
import { cleanPayload } from './schemas'

export type SubmitState =
  | { kind: 'idle' }
  | { kind: 'success'; reference: string; message: string }
  | { kind: 'unconfirmed' }
  | { kind: 'error'; message: string }

/**
 * Posts an enquiry and maps the backend response onto form state.
 * Success is shown only for a 201 response carrying a reference number.
 */
export function useEnquirySubmit<T extends FieldValues>(endpoint: string, setError: UseFormSetError<T>) {
  const startedAt = useRef(Date.now())
  const [state, setState] = useState<SubmitState>({ kind: 'idle' })

  async function submit(values: T) {
    setState({ kind: 'idle' })
    try {
      const { status, data } = await request<{ reference?: string; message?: string }>(endpoint, {
        method: 'POST',
        body: { ...cleanPayload(values), form_started_at: startedAt.current },
      })
      if (status === 201 && data?.reference) {
        setState({ kind: 'success', reference: data.reference, message: data.message ?? 'Thank you, we have received your enquiry.' })
      } else {
        setState({ kind: 'unconfirmed' })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422 && err.details.length) {
          for (const d of err.details) {
            setError(d.field as Path<T>, { type: 'server', message: d.message })
          }
          setState({ kind: 'error', message: 'Some fields need attention. Please check the highlighted fields.' })
        } else if (err.status === 429) {
          setState({ kind: 'error', message: 'You have sent several enquiries in a short time. Please wait a few minutes and try again.' })
        } else {
          setState({ kind: 'error', message: err.message })
        }
      } else {
        setState({ kind: 'error', message: 'Something went wrong. Please try again.' })
      }
    }
  }

  function reset() {
    startedAt.current = Date.now()
    setState({ kind: 'idle' })
  }

  return { state, submit, reset }
}
