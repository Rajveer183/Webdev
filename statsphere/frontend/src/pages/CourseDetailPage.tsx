import { titleCase } from '../lib/titleCase'
import { Award, BookMarked, CalendarRange, ChevronDown, Clock, GraduationCap, Layers, ReceiptText, MonitorSmartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { CourseEnquiryForm } from '../components/forms/CourseEnquiryForm'
import { RelatedLinks } from '../components/content/RelatedLinks'
import { StickyCta } from '../components/content/StickyCta'
import { AvailabilityBadge, availabilityHint, Badge, FORMAT_LABEL, LEVEL_TONE } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/Button'
import { CheckList, formatPages, TagList } from '../components/ui/Lists'
import { Illustration, motifFor } from '../components/illustrations/Illustration'
import { PageHeader } from '../components/ui/Section'
import { ErrorState, Loading } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { organizationLd } from '../config/brand'
import { usePageMeta } from '../hooks/usePageMeta'
import type { Course } from '../types/content'
import NotFoundPage from './NotFoundPage'

function Block({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{titleCase(title)}</h2>
      {children}
    </section>
  )
}

function Fact({ icon: I, label, value, note }: { icon: typeof Clock; label: string; value: ReactNode; note?: string }) {
  return (
    <div className="flex gap-3">
      <I className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden />
      <div>
        <dt className="text-xs text-subtle">{label}</dt>
        <dd className="text-sm font-medium text-ink">{value}</dd>
        {note && <dd className="text-xs text-subtle">{note}</dd>}
      </div>
    </div>
  )
}

export default function CourseDetailPage() {
  const { slug = '' } = useParams()
  const { data: c, error, reload } = useApi<Course>(`/api/courses/${slug}`)

  usePageMeta({
    title: c?.title ?? 'Certificate course',
    description: c?.summary ?? 'Certificate course details',
    jsonLd: c
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: c.title,
          description: c.summary,
          educationalLevel: c.level,
          teaches: c.learning_objectives,
          provider: organizationLd,
        }
      : undefined,
  })

  if (error?.status === 404) return <NotFoundPage />
  if (error) return <div className="container-page py-20"><ErrorState error={error} onRetry={reload} /></div>
  if (!c) return <Loading />

  const MODE: Record<string, string> = { online: 'Online', 'in-person': 'In person', hybrid: 'Hybrid' }
  const modes = c.delivery_modes.length ? c.delivery_modes.map((m) => MODE[m] ?? m).join(' · ') : 'Agreed when a cohort is scheduled'

  return (
    <>
      <PageHeader
        accent="violet"
        crumbs={[{ label: 'Certificate Courses', to: '/courses' }, { label: c.title }]}
        eyebrow={`${c.category} · Certificate course`}
        title={c.title}
        intro={c.summary}
        aside={<Illustration motif={motifFor(c.category, c.slug)} className="w-full drop-shadow-sm" />}
      >
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge tone={LEVEL_TONE[c.level]}>{c.level}</Badge>
          <Badge>{FORMAT_LABEL[c.format]}</Badge>
          <AvailabilityBadge value={c.availability} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#enquire" className={buttonClass('primary', 'md')}>
            Enquire about this course
          </a>
          <a href="#syllabus" className={buttonClass('secondary', 'md')}>
            View syllabus
          </a>
        </div>
      </PageHeader>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <Block title="About this course">
            {c.description.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} className="mb-4 text-[1.02rem] leading-8 text-muted">
                {p}
              </p>
            ))}
          </Block>

          <Block title="Learning objectives">
            <CheckList items={c.learning_objectives} />
          </Block>

          <Block title="Syllabus" id="syllabus">
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {c.modules.map((m, i) => (
                <details key={m.title} className="group" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-semibold text-brand">
                        {i + 1}
                      </span>
                      <span className="font-medium text-ink">{titleCase(m.title)}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-subtle transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <ul className="grid gap-x-6 gap-y-1.5 px-5 pb-5 pl-15 text-sm leading-6 text-muted sm:grid-cols-2">
                    {m.topics.map((t) => (
                      <li key={t} className="list-disc marker:text-subtle">
                        {t}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </Block>

          <Block title="Practical exercises and projects">
            <CheckList items={c.projects} />
          </Block>

          <div className="grid gap-10 md:grid-cols-2">
            <Block title="Who should take it">
              <CheckList items={c.audience} />
            </Block>
            <Block title="Prerequisites">
              <CheckList items={c.prerequisites} />
            </Block>
          </div>

          <Block title="Tools and technologies">
            <TagList items={c.tools} label="Tools" />
          </Block>

          <div className="grid gap-10 md:grid-cols-2">
            <Block title="Teaching format">
              <p className="leading-7 text-muted">{c.teaching_format}</p>

            </Block>
            <Block title="Assessment">
              <CheckList items={c.assessment} />
            </Block>
          </div>

          <Block title="Certificate">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <Award className="h-5 w-5 text-success" aria-hidden /> Certificate of completion, issued by SGT Consulting Services
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                A short professional course certificate. It is not an SGT University degree or diploma, and not an externally accredited
                or government-recognised qualification.
              </p>
              <h3 className="mt-5 text-sm font-semibold text-ink">Proposed Eligibility Requirements</h3>
              <div className="mt-3">
                <CheckList items={c.certificate.eligibility} />
              </div>
            </div>
          </Block>

          <details className="group rounded-2xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-subtle" aria-hidden /> Curriculum Basis
              </span>
              <ChevronDown className="h-4 w-4 text-subtle transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-line px-5 py-4">
              <p className="mb-3 text-sm leading-6 text-muted">
                This course follows the corresponding modules of an established four-year B.Sc. (Hons) Statistics &amp; Data Science curriculum.
              </p>
              <ul className="space-y-1.5 text-sm">
                {c.source_modules.map((m) => (
                  <li key={`${m.code}-${m.name}`} className="flex flex-wrap justify-between gap-2 text-muted">
                    <span>{m.name}</span>
                    <span className="text-xs text-subtle">
                      Module {m.code} · pp. {formatPages(m.pages)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <section id="enquire" className="scroll-mt-24 rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Enquire About This Course</h2>
            <p className="mt-2 mb-8 text-muted">Register your interest and we will contact you when dates, delivery mode and fees are confirmed.</p>
            <CourseEnquiryForm courseSlug={c.slug} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <GraduationCap className="h-5 w-5 text-brand" aria-hidden /> Course at a Glance
            </p>
            <dl className="mt-5 space-y-4">
              <Fact icon={Clock} label="Planned duration" value={c.proposed_duration} note="Proposed; final schedule agreed per cohort" />
              <Fact icon={Layers} label="Format" value={`${FORMAT_LABEL[c.format]} · ${c.modules.length} modules`} />
              <Fact icon={MonitorSmartphone} label="Delivery mode" value={modes} />
              <Fact icon={CalendarRange} label="Next cohort" value={c.availability === 'enrolling' ? 'Enrolling now' : 'Scheduled on demand'} note={availabilityHint(c.availability)} />
              <Fact icon={ReceiptText} label="Fee" value={c.fee ?? 'Shared on enquiry'} />
              <Fact icon={Award} label="Certificate" value="Certificate of completion" note="Issued by SGT Consulting Services" />
            </dl>
            <a href="#enquire" className={buttonClass('primary', 'md', 'mt-6 w-full')}>
              Enquire about this course
            </a>
          </div>
          <RelatedLinks related={c.related} hide={['courses']} />
        </aside>
      </div>
      <StickyCta title={c.title} label="Enquire" />
    </>
  )
}
