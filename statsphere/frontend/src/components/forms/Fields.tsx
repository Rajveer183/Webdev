import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const control =
  'block w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-subtle shadow-sm transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-60'

function stateClass(error?: string) {
  return error ? 'border-danger' : 'border-line-strong'
}

interface FieldShellProps {
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode
  className?: string
}

export function FieldShell({ label, error, hint, required, children, className = '' }: FieldShellProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            {' '}*
          </span>
        ) : (
          <span className="font-normal text-subtle"> (optional)</span>
        )}
      </label>
      {children({ id, describedBy })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

type Common = { label: string; error?: string; hint?: ReactNode; className?: string }

export const TextField = forwardRef<HTMLInputElement, Common & InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { label, error, hint, required, className, ...props },
  ref,
) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={`${control} ${stateClass(error)}`}
          {...props}
        />
      )}
    </FieldShell>
  )
})

export const TextArea = forwardRef<HTMLTextAreaElement, Common & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { label, error, hint, required, className, rows = 5, ...props },
  ref,
) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy }) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={`${control} ${stateClass(error)} resize-y`}
          {...props}
        />
      )}
    </FieldShell>
  )
})

export const SelectField = forwardRef<
  HTMLSelectElement,
  Common & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }
>(function SelectField({ label, error, hint, required, className, options, placeholder, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy }) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={`${control} ${stateClass(error)} pr-9`}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  )
})

export const CheckboxField = forwardRef<HTMLInputElement, { label: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>>(
  function CheckboxField({ label, error, ...props }, ref) {
    const id = useId()
    return (
      <div>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
            className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong accent-[var(--brand)]"
            {...props}
          />
          <label htmlFor={id} className="text-sm leading-6 text-muted">
            {label}
          </label>
        </div>
        {error && (
          <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    )
  },
)

/** Visually hidden honeypot. Real visitors never see or fill it; bots usually do. */
export const Honeypot = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Honeypot(props, ref) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  )
})
