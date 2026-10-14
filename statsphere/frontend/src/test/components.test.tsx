import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RichText } from '../components/content/RichText'
import { useEnquirySubmit } from '../components/forms/useEnquirySubmit'

describe('RichText', () => {
  it('renders plain text untouched', () => {
    render(<RichText text="No maths here" />)
    expect(screen.getByText('No maths here')).toBeInTheDocument()
  })
  it('splits inline TeX segments', async () => {
    const { container } = render(<RichText text="Mean $\bar{x}$ of the sample" />)
    expect(container.textContent).toContain('Mean')
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
  })
})

function Harness() {
  const { setError, formState } = useForm<{ email: string }>()
  const { state, submit } = useEnquirySubmit<{ email: string }>('/api/contact', setError)
  return (
    <div>
      <button onClick={() => submit({ email: 'a@b.co' })}>send</button>
      <p data-testid="state">{state.kind === 'success' ? `success ${state.reference}` : state.kind}</p>
      <p data-testid="err">{formState.errors.email?.message}</p>
    </div>
  )
}

const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

describe('useEnquirySubmit', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows success only for a 201 with a reference', async () => {
    vi.stubGlobal('fetch', respond(201, { reference: 'SSC-2026-ABCDEF', status: 'received', message: 'Thanks' }))
    render(<Harness />)
    await userEvent.click(screen.getByText('send'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('success SSC-2026-ABCDEF'))
  })

  it('does not claim success for an unconfirmed 202', async () => {
    vi.stubGlobal('fetch', respond(202, { status: 'accepted' }))
    render(<Harness />)
    await userEvent.click(screen.getByText('send'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('unconfirmed'))
  })

  it('maps server field errors onto the form', async () => {
    vi.stubGlobal(
      'fetch',
      respond(422, { error: { code: 'validation_error', message: 'Some fields need attention', details: [{ field: 'email', message: 'Bad email' }] } }),
    )
    render(<Harness />)
    await userEvent.click(screen.getByText('send'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('error'))
  })

  it('reports network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<Harness />)
    await userEvent.click(screen.getByText('send'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('error'))
  })
})
