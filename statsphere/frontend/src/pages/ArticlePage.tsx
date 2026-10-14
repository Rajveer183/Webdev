import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ArticleBody, slugifyHeading } from '../components/content/ArticleBody'
import { RelatedLinks } from '../components/content/RelatedLinks'
import { RichText } from '../components/content/RichText'
import { buttonClass } from '../components/ui/Button'
import { Breadcrumbs } from '../components/ui/Section'
import { ErrorState, Loading } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { organizationLd } from '../config/brand'
import { usePageMeta } from '../hooks/usePageMeta'
import type { Article, ArticleCard, ListResponse } from '../types/content'
import NotFoundPage from './NotFoundPage'

export default function ArticlePage() {
  const { slug = '' } = useParams()
  const { data: a, error, reload } = useApi<Article>(`/api/articles/${slug}`)
  const list = useApi<ListResponse<ArticleCard>>('/api/articles')

  usePageMeta({
    title: a?.title ?? 'Article',
    description: a?.summary.replace(/\$[^$]*\$/g, '').slice(0, 300) ?? 'Knowledge hub article',
    type: 'article',
    jsonLd: a
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: a.title,
          description: a.summary.replace(/\$[^$]*\$/g, ''),
          keywords: a.tags.join(', '),
          publisher: organizationLd,
        }
      : undefined,
  })

  if (error?.status === 404) return <NotFoundPage />
  if (error) return <div className="container-page py-20"><ErrorState error={error} onRetry={reload} /></div>
  if (!a) return <Loading />

  const idx = list.data?.items.findIndex((x) => x.slug === a.slug) ?? -1
  const prev = idx > 0 ? list.data!.items[idx - 1] : undefined
  const next = idx >= 0 && idx < (list.data?.items.length ?? 0) - 1 ? list.data!.items[idx + 1] : undefined
  const headings = a.body.filter((b) => b.type === 'heading') as { type: 'heading'; text: string }[]
  const service = a.related.services[0]
  const course = a.related.courses[0]

  return (
    <article>
      <header className="border-b border-line bg-surface">
        <div className="container-page max-w-4xl py-12 sm:py-16">
          <Breadcrumbs items={[{ label: 'Knowledge Hub', to: '/knowledge' }, { label: a.title }]} />
          <p className="eyebrow mb-3">{a.category}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{a.title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            <RichText text={a.summary} />
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden /> {a.reading_minutes} min read
            </span>
            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
              {a.tags.map((t) => (
                <li key={t}>
                  <Link to={`/knowledge?tag=${encodeURIComponent(t)}`} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs hover:text-ink">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 max-w-3xl">
          <ArticleBody blocks={a.body} />
          <p className="mt-10 border-t border-line pt-6 text-xs text-subtle">
            An educational summary written by our team. It is not a substitute for professional advice on a specific problem.
          </p>

          {(service || course) && (
            <aside className="mt-10 rounded-2xl border border-line bg-surface-2/70 p-6">
              <p className="font-semibold text-ink">Applying this to your own work?</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {service && <>We offer {service.title.toLowerCase()} as a consulting service. </>}
                {course && <>The topic is covered in depth in our {course.title} course.</>}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {service && (
                  <Link to={`/services/${service.slug}`} className={buttonClass('secondary', 'sm')}>
                    View the service
                  </Link>
                )}
                {course && (
                  <Link to={`/courses/${course.slug}`} className={buttonClass('secondary', 'sm')}>
                    View the course
                  </Link>
                )}
              </div>
            </aside>
          )}

          <nav aria-label="More articles" className="mt-10 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link to={`/knowledge/${prev.slug}`} className="card card-hover p-4 text-sm">
                <span className="inline-flex items-center gap-1 text-xs text-subtle">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
                </span>
                <span className="mt-1 block font-medium text-ink">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/knowledge/${next.slug}`} className="card card-hover p-4 text-right text-sm">
                <span className="inline-flex items-center gap-1 text-xs text-subtle">
                  Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="mt-1 block font-medium text-ink">{next.title}</span>
              </Link>
            )}
          </nav>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {headings.length > 2 && (
            <nav aria-label="On this page" className="card p-5">
              <h2 className="text-sm font-semibold text-ink">On This Page</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {headings.map((h) => (
                  <li key={h.text}>
                    <a href={`#${slugifyHeading(h.text)}`} className="text-muted hover:text-ink">
                      <RichText text={h.text} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <RelatedLinks related={a.related} />
        </aside>
      </div>
    </article>
  )
}
