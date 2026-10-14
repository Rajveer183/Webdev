import { Award, Search, ShieldAlert, SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CourseCard } from '../components/content/Cards'
import { CtaBanner } from '../components/content/CtaBanner'
import { FORMAT_LABEL } from '../components/ui/Badge'
import { Illustration } from '../components/illustrations/Illustration'
import { PageHeader, Section } from '../components/ui/Section'
import { EmptyState, ErrorState, SkeletonGrid } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import type { CourseCard as CourseCardT, ListResponse } from '../types/content'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const MODE_LABEL: Record<string, string> = { online: 'Online', 'in-person': 'In person', hybrid: 'Hybrid' }

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-subtle">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ring focus:ring-2 focus:ring-ring/25 focus:outline-none"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function CertificatePolicy() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-6">
        <Award className="h-6 w-6 text-success" aria-hidden />
        <h3 className="mt-3 font-semibold text-ink">What Our Certificate Is</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          A <strong className="text-ink">certificate of completion issued by SGT Consulting Services</strong>, a service of SGT University, awarded when you meet
          the course&apos;s stated requirements (for example attendance, lab exercises and a final project). It records the topics covered
          and the work you completed.
        </p>
      </div>
      <div className="card p-6">
        <ShieldAlert className="h-6 w-6 text-warning" aria-hidden />
        <h3 className="mt-3 font-semibold text-ink">What It Is Not</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          It is <strong className="text-ink">not</strong> an SGT University degree or diploma, and not an externally accredited,
          government-recognised or industry-certified qualification. If any course gains such recognition, it will be stated explicitly on
          that course page.
        </p>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const { data, error, reload } = useApi<ListResponse<CourseCardT>>('/api/courses')
  const [params, setParams] = useSearchParams()
  const f = {
    level: params.get('level') ?? '',
    category: params.get('category') ?? '',
    format: params.get('format') ?? '',
    mode: params.get('mode') ?? '',
    q: params.get('q') ?? '',
  }

  usePageMeta({
    title: 'Certificate Courses',
    description:
      'Practical certificate courses in statistics, mathematics, programming, data analytics and machine learning, with hands-on lab work and project-based assessment.',
  })

  const all = useMemo(() => data?.items ?? [], [data])
  const categories = useMemo(() => [...new Set(all.map((c) => c.category))].sort(), [all])
  const formats = useMemo(() => [...new Set(all.map((c) => c.format))], [all])
  const modes = useMemo(() => [...new Set(all.flatMap((c) => c.delivery_modes))], [all])

  const items = useMemo(() => {
    const needle = f.q.trim().toLowerCase()
    return all.filter(
      (c) =>
        (!f.level || c.level === f.level) &&
        (!f.category || c.category === f.category) &&
        (!f.format || c.format === f.format) &&
        (!f.mode || c.delivery_modes.includes(f.mode as never)) &&
        (!needle || [c.title, c.summary, ...c.tools, ...c.learning_objectives].join(' ').toLowerCase().includes(needle)),
    )
  }, [all, f.level, f.category, f.format, f.mode, f.q])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const active = Object.values(f).some(Boolean)

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Certificate Courses' }]}
        eyebrow="Certificate courses"
        title="Build practical skill in statistics, mathematics and data science"
        intro="Structured courses that combine concepts, worked examples and lab practice, from spreadsheet analytics and R or Python programming to inference, forecasting and machine learning."
        aside={<Illustration motif="statistics" className="w-full drop-shadow-sm" />}
      />

      <Section>
        <div role="group" aria-label="Filter by level" className="mb-5 flex flex-wrap gap-2">
          {['', ...LEVELS].map((l) => (
            <button
              key={l || 'all'}
              type="button"
              aria-pressed={f.level === l}
              onClick={() => setParam('level', l)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                f.level === l ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
              }`}
            >
              {l || 'All levels'}
              <span className="ml-1.5 text-xs opacity-70">{l ? all.filter((c) => c.level === l).length : all.length}</span>
            </button>
          ))}
        </div>
        <div className="card mb-8 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <SlidersHorizontal className="h-4 w-4 text-subtle" aria-hidden /> Refine
          </div>
          <div className={`grid gap-4 sm:grid-cols-2 ${modes.length > 0 ? 'lg:grid-cols-[1.6fr_1fr_1fr_1fr]' : 'lg:grid-cols-[1.6fr_1fr_1fr]'}`}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-subtle">Search</span>
              <span className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
                <input
                  type="search"
                  value={f.q}
                  onChange={(e) => setParam('q', e.target.value)}
                  placeholder="Topic or tool"
                  className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-subtle focus:border-ring focus:ring-2 focus:ring-ring/25 focus:outline-none"
                />
              </span>
            </label>
            <FilterSelect label="Subject" value={f.category} onChange={(v) => setParam('category', v)} options={categories.map((c) => ({ value: c, label: c }))} />
            <FilterSelect
              label="Format"
              value={f.format}
              onChange={(v) => setParam('format', v)}
              options={formats.map((x) => ({ value: x, label: FORMAT_LABEL[x] ?? x }))}
            />
            {modes.length > 0 && (
              <FilterSelect label="Delivery" value={f.mode} onChange={(v) => setParam('mode', v)} options={modes.map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
            )}
          </div>
          {active && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
            >
              <X className="h-4 w-4" aria-hidden /> Clear filters
            </button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState title="No courses match these filters">Try removing a filter or searching for a different topic.</EmptyState>
        ) : (
          <>
            <p className="mb-4 text-sm text-subtle" aria-live="polite">
              Showing {items.length} of {data.total} courses
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          </>
        )}
      </Section>

      <Section tone="muted" id="certificates" eyebrow="Certificate integrity" title="What our certificates mean">
        <CertificatePolicy />
        <p className="mt-6 max-w-3xl text-sm leading-6 text-subtle">
          All courses are currently listed as proposed offerings. Durations are proposals; dates, delivery mode and fees will be published
          once a cohort is confirmed. Registering interest is free and carries no obligation.
        </p>
      </Section>

      <CtaBanner
        title="Training a team rather than an individual?"
        text="Any course can be adapted into a workshop or multi-week programme for your organisation, using your own tools and anonymised data."
        primary={{ label: 'Request corporate training', to: '/corporate-training#proposal' }}
        secondary={{ label: 'Enquire about a course', to: '/contact?type=course' }}
      />
    </>
  )
}
