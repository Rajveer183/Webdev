import { FlaskConical } from 'lucide-react'
import { ProjectCard } from '../components/content/Cards'
import { CtaBanner } from '../components/content/CtaBanner'
import { Illustration } from '../components/illustrations/Illustration'
import { PageHeader, Section } from '../components/ui/Section'
import { ErrorState, SkeletonGrid } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import type { ListResponse, ProjectCard as ProjectCardT } from '../types/content'

export default function ProjectsPage() {
  const { data, error, reload } = useApi<ListResponse<ProjectCardT>>('/api/projects')
  usePageMeta({
    title: 'Projects & Case Studies',
    description:
      'Reproducible demonstration analyses on synthetic data: forecasting, control charts, survival analysis, regression, PCA, ANOVA and linear programming.',
  })

  return (
    <>
      <PageHeader
        accent="rose"
        crumbs={[{ label: 'Projects' }]}
        eyebrow="Projects & case studies"
        title="Worked analyses, end to end"
        intro="Each project walks through a realistic problem from question to interpretation, including the limitations. The numbers are computed by a reproducible script, not invented."
        aside={<Illustration motif="timeseries" className="w-full drop-shadow-sm" />}
      >
        <div className="mt-6 flex max-w-3xl gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm leading-6 text-muted">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <p>
            <strong>All projects on this page are demonstrations on synthetic data.</strong> They are not client engagements, and no client
            names, results or performance figures are implied. Real client work is confidential and is shown only with permission.
          </p>
        </div>
      </PageHeader>
      <Section>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonGrid />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        )}
      </Section>
      <CtaBanner
        title="Have a similar problem with real data?"
        text="Tell us what you are trying to find out. We will explain which methods fit and what they can and cannot tell you."
        primary={{ label: 'Discuss your project', to: '/contact?type=consulting' }}
        secondary={{ label: 'Browse services', to: '/services' }}
      />
    </>
  )
}
