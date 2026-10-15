import { CalendarDays, ChevronDown, Settings2, Target, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CorporateTrainingForm } from '../components/forms/CorporateTrainingForm'
import { Badge } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/Button'
import { CheckList } from '../components/ui/Lists'
import { Illustration } from '../components/illustrations/Illustration'
import { PageHeader, Section } from '../components/ui/Section'
import { ErrorState, SkeletonGrid } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import type { CourseCard, ListResponse, Workshop } from '../types/content'

const OBJECTIVES = [
  'Build a shared, correct understanding of statistical reasoning across analysts, managers and researchers.',
  'Give teams hands-on practice with the tools they already use: Excel, R, Python, SQL or the Hadoop/Spark stack.',
  'Improve how results, uncertainty and limitations are communicated to decision-makers.',
  'Leave participants with reusable templates, scripts and worked examples drawn from realistic data.',
]

const CUSTOMISATION = [
  'Length and depth: from a half-day briefing to a multi-week cohort programme.',
  'Examples from your sector, or your own anonymised data shared under a confidentiality agreement.',
  'Your toolset: exercises delivered in the software your team uses.',
  'A short pre-workshop survey to calibrate the starting level.',
  'Optional follow-up clinic for questions after the training.',
]

export default function CorporateTrainingPage() {
  const { data, error, reload } = useApi<ListResponse<Workshop>>('/api/workshops')
  const courses = useApi<ListResponse<CourseCard>>('/api/courses')
  const courseTitle = (slug: string) => courses.data?.items.find((c) => c.slug === slug)?.title ?? slug.replace(/-/g, ' ')
  usePageMeta({
    title: 'Corporate Training & Workshops',
    description:
      'Customised workshops in statistics, Excel analytics, Python and R, machine learning, data visualization, research methods and quality control for organisations.',
  })

  const example = data?.items.find((w) => w.slug === 'statistical-modelling-workshop') ?? data?.items[0]

  return (
    <>
      <PageHeader
        accent="emerald"
        crumbs={[{ label: 'Corporate Training' }]}
        eyebrow="Corporate training & workshops"
        title="Upskill your team in statistics, analytics and data science"
        intro="Practical, customised training for analysts, managers, researchers and technical teams, built from the same curriculum as our certificate courses."
        aside={<Illustration motif="analytics" className="w-full drop-shadow-sm" />}
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#proposal" className={buttonClass('primary', 'md')}>
            Request a proposal
          </a>
          <a href="#workshops" className={buttonClass('secondary', 'md')}>
            See workshop topics
          </a>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <Target className="h-6 w-6 text-accent" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold text-ink">Training Objectives</h2>
            <div className="mt-4">
              <CheckList items={OBJECTIVES} />
            </div>
          </div>
          <div>
            <Users className="h-6 w-6 text-accent" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold text-ink">Intended Participants</h2>
            <div className="mt-4">
              <CheckList
                items={[
                  'Analysts and reporting teams',
                  'Managers who commission or use analysis',
                  'Research and laboratory staff',
                  'Quality, operations and production teams',
                  'Data and engineering teams moving into analytics',
                ]}
              />
            </div>
          </div>
          <div>
            <Settings2 className="h-6 w-6 text-accent" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold text-ink">Customisation Options</h2>
            <div className="mt-4">
              <CheckList items={CUSTOMISATION} />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="muted" id="workshops" eyebrow="Workshop catalogue" title="Workshop topics" intro="Each workshop can be delivered as described or combined into a longer programme.">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.items.map((w) => (
              <article key={w.slug} className="card flex flex-col p-6">
                <h3 className="text-lg font-semibold text-ink">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{w.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {w.formats.map((f) => (
                    <Badge key={f}>
                      <CalendarDays className="h-3 w-3" aria-hidden /> {f}
                    </Badge>
                  ))}
                </div>
                <details className="group mt-5 rounded-xl border border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                    Objectives, topics and participants
                    <ChevronDown className="h-4 w-4 text-subtle transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="space-y-4 border-t border-line px-4 py-4 text-sm">
                    <div>
                      <p className="mb-2 font-semibold text-ink">Objectives</p>
                      <CheckList items={w.objectives} />
                    </div>
                    <div>
                      <p className="mb-2 font-semibold text-ink">Topics</p>
                      <p className="leading-6 text-muted">{w.topics.join(' · ')}</p>
                    </div>
                    <div>
                      <p className="mb-2 font-semibold text-ink">For</p>
                      <p className="leading-6 text-muted">{w.participants.join(' · ')}</p>
                    </div>
                    {w.related_courses.length > 0 && (
                      <p className="text-muted">
                        Related {w.related_courses.length > 1 ? 'courses' : 'course'}:{' '}
                        {w.related_courses.map((s, i) => (
                          <span key={s}>
                            {i > 0 && ', '}
                            <Link to={`/courses/${s}`} className="link">
                              {courseTitle(s)}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </Section>

      {example && (
        <Section eyebrow="Example structure" title={`Example: ${example.title}`} intro="An illustrative agenda. Every programme is agreed with you in advance.">
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {example.example_agenda.map((a, i) => (
              <li key={a.session} className="card p-5">
                <span className="text-xs font-semibold text-accent">Session {i + 1}</span>
                <p className="mt-1 font-semibold text-ink">{a.session.replace(/^Session \d+\s*·\s*/, '')}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{a.detail}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section tone="muted" id="proposal" eyebrow="Request a proposal" title="Tell us about your team">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.7fr]">
          <div className="space-y-4 text-muted">
            <p className="leading-7">
              Share the size of the group, their current level, the tools they use and what they should be able to do afterwards. We will reply
              to discuss your needs and prepare a written proposal with an agenda, format and fee.
            </p>
            <p className="text-sm text-subtle">We do not publish client names or testimonials without explicit permission.</p>
          </div>
          <div className="card p-6 sm:p-8">
            <CorporateTrainingForm />
          </div>
        </div>
      </Section>
    </>
  )
}
