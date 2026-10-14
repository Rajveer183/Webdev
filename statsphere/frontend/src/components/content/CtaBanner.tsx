import { tc } from '../../lib/titleCase'
import type { ReactNode } from 'react'
import { LinkButton } from '../ui/Button'

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
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--hero-from),var(--hero-to))] px-6 py-12 text-white sm:px-12">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tc(title)}</h2>
              <p className="mt-3 text-base leading-7 text-slate-300">{text}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton to={primary.to} variant="light" size="lg">
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
      </div>
    </section>
  )
}
