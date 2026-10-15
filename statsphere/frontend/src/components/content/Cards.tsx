import { ArrowRight, BookOpen, Clock, FlaskConical, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ArticleCard as ArticleCardT, CourseCard as CourseCardT, ProjectCard as ProjectCardT, ServiceCard as ServiceCardT } from '../../types/content'
import { Badge, FORMAT_LABEL, LEVEL_TONE } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { categoryColor } from '../../lib/categoryColors'
import { Illustration, motifFor } from '../illustrations/Illustration'
import { RichText } from './RichText'

const CATEGORY_ICON: Record<string, string> = {
  Statistics: 'Sigma',
  Mathematics: 'FunctionSquare',
  'Data Science': 'Database',
  'Machine Learning': 'BrainCircuit',
  Analytics: 'BarChart3',
  Programming: 'LineChart',
  Research: 'FlaskConical',
}

function CardVisual({ category, slug }: { category: string; slug: string }) {
  return (
    <div aria-hidden className="-mx-6 -mt-6 mb-5 h-36 overflow-hidden rounded-t-2xl border-b border-line bg-surface-2">
      <Illustration motif={motifFor(category, slug)} className="mx-auto -mt-6 h-48 w-auto" />
    </div>
  )
}

export function ServiceCard({ service, visual = false }: { service: ServiceCardT; visual?: boolean }) {
  const col = categoryColor(service.category)
  return (
    <article className={`card card-hover group relative flex h-full flex-col p-6 ${col.card}`}>
      {visual && <CardVisual category={service.category} slug={service.slug} />}
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105 ${col.icon}`}>
          <Icon name={service.icon} className="h-5 w-5" />
        </span>
        <Badge color={col.badge}>{service.category}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-semibold leading-snug text-ink">
        <Link to={`/services/${service.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {service.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{service.summary}</p>
      <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-link">
        View service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </p>
    </article>
  )
}

export function CourseCard({ course, visual = false }: { course: CourseCardT; visual?: boolean }) {
  const col = categoryColor(course.category)
  return (
    <article className={`card card-hover group relative flex h-full flex-col p-6 ${col.card}`}>
      {visual && <CardVisual category={course.category} slug={course.slug} />}
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105 ${col.icon}`}>
          <Icon name={CATEGORY_ICON[course.category] ?? 'BookOpen'} className="h-5 w-5" />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone={LEVEL_TONE[course.level]}>{course.level}</Badge>
          <Badge color={col.badge}>{course.category}</Badge>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
        <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {course.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{course.summary}</p>
      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[0.8rem] text-subtle">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Planned duration</dt>
          <dd className="whitespace-nowrap">{course.proposed_duration}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Format</dt>
          <dd className="whitespace-nowrap">
            {FORMAT_LABEL[course.format]}
            {course.module_count ? ` · ${course.module_count} modules` : ''}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        {course.availability === 'closed' ? (
          <span className="text-subtle">Not currently offered</span>
        ) : (
          <span className="font-medium text-link">View course</span>
        )}
        <ArrowRight className="h-4 w-4 text-link transition group-hover:translate-x-0.5" aria-hidden />
      </div>
    </article>
  )
}

export function ArticleCard({ article }: { article: ArticleCardT }) {
  const col = categoryColor(article.category)
  return (
    <article className={`card card-hover group relative flex h-full flex-col p-6 ${col.card}`}>
      <div className="flex items-center justify-between gap-2 text-xs text-subtle">
        <span className={`inline-flex items-center gap-2 font-semibold ${col.text}`}>
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${col.icon}`}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
          </span>
          {article.category}
        </span>
        <span>{article.reading_minutes} min read</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">
        <Link to={`/knowledge/${article.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">
        <RichText text={article.summary} />
      </p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Topics">
        {article.tags.slice(0, 3).map((t) => (
          <li key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-subtle">
            {t}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function ProjectCard({ project }: { project: ProjectCardT }) {
  const col = categoryColor(project.category)
  return (
    <article className={`card card-hover group relative flex h-full flex-col p-6 ${col.card}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105 ${col.icon}`}>
          <FlaskConical className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone="accent">Demonstration</Badge>
          <Badge color={col.badge}>{project.category}</Badge>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
        <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {project.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{project.summary}</p>
      {project.results.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
          {project.results.slice(0, 2).map((r) => (
            <div key={r.label}>
              <dt className="text-xs text-subtle">{r.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}
