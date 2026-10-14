import { titleCase } from '../lib/titleCase'
import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ServiceCard } from '../components/content/Cards'
import { CtaBanner } from '../components/content/CtaBanner'
import { Steps } from '../components/ui/Lists'
import { Illustration } from '../components/illustrations/Illustration'
import { PageHeader, Section } from '../components/ui/Section'
import { EmptyState, ErrorState, SkeletonGrid } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useSite'
import type { ListResponse, ServiceCard as ServiceCardT } from '../types/content'

const ENGAGEMENTS = [
  { title: 'Fixed-scope project', text: 'A defined question, agreed deliverables and a timeline: for example an analysis report, a forecast or a model with documentation.' },
  { title: 'Ongoing analytical support', text: 'Regular access for a team that needs recurring analysis, review of its own work or methodological advice.' },
  { title: 'Methodology review', text: 'An independent check of a study design, survey, model or analysis before it is used or published.' },
  { title: 'Training alongside a project', text: 'We deliver the analysis and train your team to maintain and extend it.' },
]

export default function ServicesPage() {
  const { data, error, reload } = useApi<ListResponse<ServiceCardT>>('/api/services')
  const { content } = useSite()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const q = params.get('q') ?? ''

  usePageMeta({
    title: 'Consulting Services',
    description:
      'Statistical analysis, predictive modelling, forecasting, research methodology, survey and experimental design, machine learning and optimisation consulting.',
  })

  const categories = useMemo(() => [...new Set((data?.items ?? []).map((s) => s.category))].sort(), [data])
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data?.items ?? []).filter(
      (s) =>
        (!category || s.category === category) &&
        (!needle || [s.title, s.summary, ...s.methods, ...s.tools].join(' ').toLowerCase().includes(needle)),
    )
  }, [data, category, q])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Consulting' }]}
        eyebrow="Consulting services"
        title="Statistical, mathematical and data science consulting"
        intro="Bring us a question, a dataset or a research design. We scope the work with you, apply methods suited to the problem, and explain the results and their limitations clearly."
        aside={<Illustration motif="regression" className="w-full drop-shadow-sm" />}
      />

      <Section>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'}
                type="button"
                aria-pressed={category === c}
                onClick={() => setParam('category', c)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  category === c ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                {c || 'All'}
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:w-72">
            <span className="sr-only">Search services</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search methods or tools"
              className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-subtle focus:border-ring focus:ring-2 focus:ring-ring/25 focus:outline-none"
            />
          </label>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState title="No services match your filters">Try a different category or search term.</EmptyState>
        ) : (
          <>
            <p className="mb-4 text-sm text-subtle" aria-live="polite">
              Showing {items.length} of {data.total} services
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          </>
        )}
      </Section>

      {content && (
        <Section tone="muted" eyebrow="Engagement model" title="How a consulting engagement works">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <Steps steps={content.consulting_approach.map((s) => ({ title: s.step, detail: s.detail }))} />
            <div>
              <h3 className="mb-4 text-lg font-semibold text-ink">Ways to Work with Us</h3>
              <div className="space-y-4">
                {ENGAGEMENTS.map((e) => (
                  <div key={e.title} className="card p-5">
                    <p className="font-semibold text-ink">{titleCase(e.title)}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{e.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-subtle">Every engagement is quoted individually after scoping, based on the work involved.</p>
            </div>
          </div>
        </Section>
      )}

      <CtaBanner
        title="Not sure which service fits?"
        text="Describe your problem in a few sentences and we will suggest an approach. An initial conversation carries no obligation."
        primary={{ label: 'Discuss your project', to: '/contact?type=consulting' }}
        secondary={{ label: 'Request corporate training', to: '/corporate-training' }}
      />
    </>
  )
}
