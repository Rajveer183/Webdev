import { titleCase } from '../lib/titleCase'
import { AlertTriangle, Database, FlaskConical, Target } from 'lucide-react'
import { lazy, Suspense, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { CtaBanner } from '../components/content/CtaBanner'
import { RelatedLinks } from '../components/content/RelatedLinks'
import { RichText } from '../components/content/RichText'
import { Badge } from '../components/ui/Badge'
import { CheckList } from '../components/ui/Lists'
import { Illustration, motifFor } from '../components/illustrations/Illustration'
import { PageHeader } from '../components/ui/Section'
import { ErrorState, Loading } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import type { Project } from '../types/content'
import NotFoundPage from './NotFoundPage'

const ChartRenderer = lazy(() => import('../components/charts/ChartRenderer'))

function Block({ title, children, icon: I }: { title: string; children: ReactNode; icon?: typeof Target }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
        {I && <I className="h-5 w-5 text-subtle" aria-hidden />}
        {titleCase(title)}
      </h2>
      {children}
    </section>
  )
}

export default function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const { data: p, error, reload } = useApi<Project>(`/api/projects/${slug}`)
  usePageMeta({ title: p?.title ?? 'Project', description: p?.summary ?? 'Demonstration analysis' })

  if (error?.status === 404) return <NotFoundPage />
  if (error) return <div className="container-page py-20"><ErrorState error={error} onRetry={reload} /></div>
  if (!p) return <Loading />

  return (
    <>
      <PageHeader
        accent="fuchsia"
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: p.title }]}
        eyebrow={p.category}
        title={p.title}
        intro={p.summary}
        aside={<Illustration motif={motifFor(p.category, p.slug)} className="w-full drop-shadow-sm" />}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="accent">
            <FlaskConical className="h-3 w-3" aria-hidden /> Synthetic demonstration, not a client engagement
          </Badge>
        </div>
      </PageHeader>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-12">
          <div className="grid gap-6 md:grid-cols-2">
            <Block title="Problem statement" icon={Target}>
              <p className="leading-7 text-muted">{p.problem}</p>
            </Block>
            <Block title="Dataset" icon={Database}>
              <p className="leading-7 text-muted">{p.dataset}</p>
            </Block>
          </div>

          <Block title="Methodology">
            <CheckList items={p.methodology} />
          </Block>

          <Block title="Analytical process">
            <ol className="list-decimal space-y-2 pl-6 leading-7 text-muted marker:font-semibold marker:text-subtle">
              {p.process.map((s) => (
                <li key={s}>
                  <RichText text={s} />
                </li>
              ))}
            </ol>
          </Block>

          <Block title="Visualizations">
            <Suspense fallback={<Loading label="Loading charts…" />}>
              <div className="space-y-6">
                {p.charts.map((c) => (
                  <ChartRenderer key={c.id} spec={c} />
                ))}
              </div>
            </Suspense>
          </Block>

          {p.anova_table && (
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-surface-2 text-ink">
                  <tr>
                    {p.anova_table.columns.map((c) => (
                      <th key={c} scope="col" className="px-4 py-2.5 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums text-muted">
                  {p.anova_table.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((cell, j) => (
                        <td key={j} className="px-4 py-2.5">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Block title="Results">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.results.map((r) => (
                <div key={r.label + r.value} className="card p-4">
                  <dt className="text-xs text-subtle">{r.label}</dt>
                  <dd className="mt-1 font-semibold text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block title="Interpretation">
            <CheckList items={p.interpretation} />
          </Block>

          <Block title="Limitations" icon={AlertTriangle}>
            <ul className="list-disc space-y-2 pl-6 leading-7 text-muted marker:text-subtle">
              {p.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Block>

          <Block title="Potential applications">
            <CheckList items={p.applications} columns={2} />
          </Block>

        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <RelatedLinks related={p.related} />
        </aside>
      </div>

      <CtaBanner
        title="Want this analysis on your own data?"
        text="We can apply the same approach to your problem, with a written report and reproducible code."
        primary={{ label: 'Discuss your project', to: `/contact?type=consulting${p.related.services[0] ? `&service=${p.related.services[0].slug}` : ''}` }}
      />
    </>
  )
}
