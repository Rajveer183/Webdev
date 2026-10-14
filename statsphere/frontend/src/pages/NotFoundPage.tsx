import { Compass } from 'lucide-react'
import { LinkButton } from '../components/ui/Button'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta({ title: 'Page not found', description: 'The page you were looking for could not be found.', noindex: true })
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">We Could Not Find That Page</h1>
      <p className="mt-3 max-w-md text-muted">The link may be out of date, or the page may have moved. These are good places to continue:</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton to="/">Home</LinkButton>
        <LinkButton to="/services" variant="secondary">
          Consulting services
        </LinkButton>
        <LinkButton to="/courses" variant="secondary">
          Certificate courses
        </LinkButton>
        <LinkButton to="/contact" variant="ghost">
          Contact us
        </LinkButton>
      </div>
    </section>
  )
}
