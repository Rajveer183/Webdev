import { titleCase } from '../lib/titleCase'
import { ArrowRight, FileCheck2, Wrench } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ConsultingForm } from '../components/forms/ConsultingForm'
import { RelatedLinks } from '../components/content/RelatedLinks'
import { StickyCta } from '../components/content/StickyCta'
import { AvailabilityBadge, Badge } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { CheckList, Steps, TagList } from '../components/ui/Lists'
import { Illustration, motifFor } from '../components/illustrations/Illustration'
import { PageHeader } from '../components/ui/Section'
import { ErrorState, Loading } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { organizationLd } from '../config/brand'
import { usePageMeta } from '../hooks/usePageMeta'
import type { Service } from '../types/content'
import NotFoundPage from './NotFoundPage'

function Block({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{titleCase(title)}</h2>
      {children}
    </section>
  )
}

export default function ServiceDetailPage() {
  const { slug = '' } = useParams()
  const { data: s, error, reload } = useApi<Service>(`/api/services/${slug}`)

  usePageMeta({
    title: s?.title ?? 'Consulting service',
    description: s?.summary ?? 'Consulting service details',
    jsonLd: s
      ? {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: s.title,
          description: s.summary,
          serviceType: s.category,
          provider: organizationLd,
        }
      : undefined,
  })

  if (error?.status === 404) return <NotFoundPage />
  if (error) return <div className="container-page py-20"><ErrorState error={error} onRetry={reload} /></div>
  if (!s) return <Loading />

  return (
    <>
      <PageHeader
        accent="sky"
        crumbs={[{ label: 'Consulting', to: '/services' }, { label: s.title }]}
        eyebrow={s.category}
        title={s.title}
        intro={s.summary}
        aside={<Illustration motif={motifFor(s.category, s.slug)} className="w-full drop-shadow-sm" />}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <AvailabilityBadge value={s.availability} kind="service" />
          <a href="#enquire" className={buttonClass('primary', 'md')}>
            Discuss your project
          </a>
          <Link to="/contact?type=consulting" className={buttonClass('secondary', 'md')}>
            Book a consultation
          </Link>
        </div>
      </PageHeader>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-14">
          <Block title="What this service is">
            <p className="text-[1.02rem] leading-8 text-muted">{s.overview}</p>
          </Block>
          <Block title="Problems it solves">
            <CheckList items={s.problems} />
          </Block>
          <div className="grid gap-10 md:grid-cols-2">
            <Block title="Who it is for">
              <CheckList items={s.audience} />
            </Block>
            <Block title="What we need from you">
              <CheckList items={s.client_inputs} />
            </Block>
          </div>
          <Block title="How the engagement works">
            <Steps steps={s.process.map((p) => ({ title: p.step, detail: p.detail }))} />
          </Block>
          <Block title="What you receive">
            <div className="grid gap-3 sm:grid-cols-2">
              {s.deliverables.map((d) => (
                <div key={d} className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm leading-6 text-muted">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {d}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-subtle">
              We commit to sound methods and transparent reporting. We do not guarantee particular findings, model performance or business
              outcomes, as these depend on your data and question.
            </p>
          </Block>
          <Block title="Typical applications">
            <CheckList items={s.applications} columns={2} />
          </Block>
          <Block title="Methods and tools">
            <h3 className="mb-3 text-sm font-semibold text-ink">Methods</h3>
            <TagList items={s.methods} label="Methods" />
            <h3 className="mt-6 mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Wrench className="h-4 w-4 text-subtle" aria-hidden /> Tools
            </h3>
            <TagList items={s.tools} label="Tools" />
          </Block>

          <section id="enquire" className="scroll-mt-24 rounded-3xl border border-line bg-surface p-6 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Discuss Your Project</h2>
            <p className="mt-2 mb-8 text-muted">
              Describe your problem, data and timeline. We will reply to arrange an initial conversation about scope and approach.
            </p>
            <ConsultingForm serviceSlug={s.slug} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold text-ink">{s.title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{s.category}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              Fees are quoted per project after a scoping conversation, based on the work involved.
            </p>
            <a href="#enquire" className={buttonClass('primary', 'md', 'mt-5 w-full')}>
              Request a consultation <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <RelatedLinks related={s.related} hide={['services']} />
        </aside>
      </div>
      <StickyCta title={s.title} label="Discuss your project" />
    </>
  )
}
