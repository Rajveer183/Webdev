import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArticleCard } from '../components/content/Cards'
import { InstitutionReference } from '../components/content/InstitutionReference'
import { Illustration } from '../components/illustrations/Illustration'
import { PageHeader, Section } from '../components/ui/Section'
import { EmptyState, ErrorState, SkeletonGrid } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import type { ArticleCard as ArticleCardT, ListResponse, Topic } from '../types/content'

export default function KnowledgePage() {
  const { data, error, reload } = useApi<ListResponse<ArticleCardT>>('/api/articles')
  const topics = useApi<ListResponse<Topic>>('/api/topics')
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const tag = params.get('tag') ?? ''
  const q = params.get('q') ?? ''

  usePageMeta({
    title: 'Knowledge Hub',
    description:
      'Clear explanations of statistical methods, mathematical concepts and data science techniques, with formulas, worked examples and practical guidance.',
  })

  const all = useMemo(() => data?.items ?? [], [data])
  const categories = useMemo(() => [...new Set(all.map((a) => a.category))].sort(), [all])
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all.filter(
      (a) =>
        (!category || a.category === category) &&
        (!tag || a.tags.includes(tag)) &&
        (!needle || [a.title, a.summary, ...a.tags].join(' ').toLowerCase().includes(needle)),
    )
  }, [all, category, tag, q])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const bySemester = useMemo(() => {
    const groups = new Map<number, Topic[]>()
    for (const t of topics.data?.items ?? []) {
      const s = t.semester ?? 0
      groups.set(s, [...(groups.get(s) ?? []), t])
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [topics.data])

  return (
    <>
      <PageHeader
        accent="indigo"
        crumbs={[{ label: 'Knowledge Hub' }]}
        eyebrow="Knowledge hub"
        title="Statistics, mathematics and data science, explained"
        intro="Concise explanations of core methods with formulas, worked examples and notes on when to use them. Each article links to the related consulting service and course."
        aside={<Illustration motif="matrix" className="w-full drop-shadow-sm" />}
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
                {c || 'All topics'}
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:w-72">
            <span className="sr-only">Search articles</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search articles"
              className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-subtle focus:border-ring focus:ring-2 focus:ring-ring/25 focus:outline-none"
            />
          </label>
        </div>
        {tag && (
          <p className="mb-6 text-sm text-muted">
            Tagged “{tag}” ·{' '}
            <button type="button" className="link" onClick={() => setParam('tag', '')}>
              clear tag
            </button>
          </p>
        )}

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState title="No articles match">Try another search term or category.</EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </Section>

      {bySemester.length > 0 && (
        <Section
          tone="muted"
          eyebrow="Subject map"
          title="Every subject area we cover"
          intro="The reviewed subject areas behind our services, courses and articles, ordered as they appear in the curriculum."
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {bySemester.map(([sem, list]) => (
              <div key={sem} className="card p-5">
                <h3 className="text-sm font-semibold text-ink">{sem ? `Curriculum Stage ${sem}` : 'Other'}</h3>
                <ul className="mt-3 space-y-2.5">
                  {list.map((t) => {
                    const target = t.related_articles[0]
                      ? `/knowledge/${t.related_articles[0]}`
                      : t.related_courses[0]
                        ? `/courses/${t.related_courses[0]}`
                        : t.related_services[0]
                          ? `/services/${t.related_services[0]}`
                          : null
                    return (
                      <li key={t.id} className="text-sm">
                        {target ? (
                          <Link to={target} className="font-medium text-ink hover:text-link">
                            {t.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-ink">{t.name}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <InstitutionReference compact />
      </Section>
    </>
  )
}
