import { tc } from '../../lib/titleCase'
import type { ReactNode } from 'react'
import { LinkButton } from '../ui/Button'
import { WaveDivider } from '../ui/WaveDivider'

export function CtaBanner({
  title,
  text,
  primary,
  secondary,
}: {
  title: ReactNode
  text: ReactNode
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
}) {
  return (
    <section
      style={{ background: 'var(--bg-band)' }}
      className="relative overflow-hidden bg-band pt-16 text-white sm:pt-20"
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--accent)]/15 blur-3xl" />
      <div className="container-page relative pb-16 sm:pb-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{tc(title)}</h2>
            <p className="mt-3 text-base leading-7 text-blue-100 dark:text-slate-200">{text}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton to={primary.to} variant="accent" size="lg">
              {primary.label}
            </LinkButton>
            {secondary && (
              <LinkButton to={secondary.to} variant="outline-light" size="lg">
                {secondary.label}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
      <WaveDivider color="var(--bg-footer)" />
    </section>
  )
}
