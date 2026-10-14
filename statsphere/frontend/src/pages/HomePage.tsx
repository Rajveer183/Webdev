import { titleCase } from '../lib/titleCase'
import { ArrowRight, Check, GraduationCap, Briefcase } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { CourseCard, ProjectCard, ServiceCard } from '../components/content/Cards'
import { CtaBanner } from '../components/content/CtaBanner'
import { Faq, faqJsonLd } from '../components/content/Faq'
import { Illustration } from '../components/illustrations/Illustration'
import { LinkButton } from '../components/ui/Button'
import { Section } from '../components/ui/Section'
import { WaveDivider } from '../components/ui/WaveDivider'
import { ErrorState, Loading, SkeletonGrid } from '../components/ui/States'
import { brand, organizationLd } from '../config/brand'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useSite'
import type { CourseCard as CourseCardT, ListResponse, Project, ProjectCard as ProjectCardT, ServiceCard as ServiceCardT } from '../types/content'

const ChartRenderer = lazy(() => import('../components/charts/ChartRenderer'))

const SHOWCASE = 'demand-forecasting-decomposition'

const VALUE_POINTS = ['Methods matched to your question', 'Reproducible code and documented assumptions', 'Plain-language reports with limitations stated']

function HeroVisual() {
  // A normal density curve with a shaded 95% interval: a quiet nod to the subject, no invented data.
  // Coordinates are rounded so server (Node) and browser floating-point results match during hydration.
  const pt = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`
  const pts: string[] = []
  for (let i = 0; i <= 120; i++) {
    const x = -3.2 + (6.4 * i) / 120
    const y = Math.exp(-(x * x) / 2)
    pts.push(pt(20 + (i / 120) * 360, 200 - y * 150))
  }
  const area: string[] = []
  for (let i = 0; i <= 120; i++) {
    const x = -3.2 + (6.4 * i) / 120
    if (x < -1.96 || x > 1.96) continue
    area.push(pt(20 + (i / 120) * 360, 200 - Math.exp(-(x * x) / 2) * 150))
  }
  const x0 = Number((20 + ((-1.96 + 3.2) / 6.4) * 360).toFixed(2))
  const x1 = Number((20 + ((1.96 + 3.2) / 6.4) * 360).toFixed(2))
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Sampling distribution of the mean</span>
          <span className="rounded-full bg-[var(--tint-blue)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">95% interval</span>
        </div>
        <svg viewBox="0 0 400 220" className="mt-4 w-full" role="img" aria-label="Illustration of a normal curve with the central 95 percent shaded">
          <line x1="20" y1="200" x2="380" y2="200" stroke="var(--border)" strokeWidth="1.5" />
          <polygon points={`${x0},200 ${area.join(' ')} ${x1},200`} fill="var(--tint-blue)" />
          <polyline points={pts.join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="200" y1="200" x2="200" y2="50" stroke="var(--border)" strokeDasharray="3 4" strokeWidth="1.5" />
          <text x="200" y="215" textAnchor="middle" fontSize="11" fill="var(--text-muted)">μ</text>
          <text x={x0} y="215" textAnchor="middle" fontSize="11" fill="var(--text-muted)">−1.96σ</text>
          <text x={x1} y="215" textAnchor="middle" fontSize="11" fill="var(--text-muted)">+1.96σ</text>
        </svg>
        <p className="mt-4 rounded-xl bg-[var(--bg-blue)] px-4 py-3 text-center font-mono text-sm font-semibold text-[var(--primary)]">x̄ ± 1.96 · σ/√n</p>
      </div>
    </div>
  )
}

function PillarCard({
  icon: I,
  eyebrow,
  title,
  text,
  points,
  motif,
  cta,
  secondary,
}: {
  icon: typeof Briefcase
  eyebrow: string
  title: string
  text: string
  points: string[]
  motif: 'regression' | 'statistics'
  cta: { label: string; to: string }
  secondary: { label: string; to: string }
}) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <div aria-hidden className="h-44 overflow-hidden border-b border-line bg-surface-2">
        <Illustration motif={motif} className="mx-auto -mt-4 h-56 w-auto" />
      </div>
      <div className="flex flex-1 flex-col p-7">
        <p className="eyebrow flex items-center gap-2">
          <I className="h-4 w-4" aria-hidden /> {eyebrow}
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">{titleCase(title)}</h3>
        <p className="mt-2 leading-7 text-muted">{text}</p>
        <ul className="mt-5 flex-1 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5 text-sm text-muted">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <LinkButton to={cta.to}>{cta.label}</LinkButton>
          <Link to={secondary.to} className="link text-sm">
            {secondary.label}
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const { content, name, tagline } = useSite()
  const services = useApi<ListResponse<ServiceCardT>>('/api/services?featured=true')
  const courses = useApi<ListResponse<CourseCardT>>('/api/courses?featured=true')
  const projects = useApi<ListResponse<ProjectCardT>>('/api/projects?featured=true')
  const showcase = useApi<Project>(`/api/projects/${SHOWCASE}`)

  usePageMeta({
    title: brand.name,
    description: `${tagline} Statistical consulting, mathematical modelling, data analytics and practical certificate courses.`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name,
        parentOrganization: organizationLd.parentOrganization,
        description: brand.description,
        slogan: tagline,
        ...(brand.siteUrl ? { url: brand.siteUrl } : {}),
        knowsAbout: ['Statistics', 'Mathematics', 'Data Science', 'Machine Learning', 'Data Analytics'],
      },
      ...(content?.faq ? [faqJsonLd(content.faq.slice(0, 6))] : []),
    ],
  })

  const chart = showcase.data?.charts[0]
  const otherProjects = (projects.data?.items ?? []).filter((p) => p.slug !== SHOWCASE).slice(0, 2)

  return (
    <>
      {/* 1. Hero */}
      <section style={{ background: 'var(--bg-hero)' }} className="relative overflow-hidden bg-hero text-[var(--text-heading)]">
        {/* Soft blurred glow circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-[460px] w-[460px] rounded-full bg-[#9CC4FF] opacity-35 blur-[80px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-[460px] w-[460px] rounded-full bg-[#FFE2A3] opacity-40 blur-[80px]"
        />

        {/* Hero subtle dotted pattern (primary at 6% opacity) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(var(--primary)_1.5px,transparent_1.5px)] [background-size:24px_24px]"
        />

        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="eyebrow mb-3">
              {brand.institution.name} · {tagline}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-heading)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
              Expert Consulting. Practical Data Science Training. Measurable Impact.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-body)]">
              Explore statistical consulting, mathematical problem-solving, data analytics, and practical certificate courses designed to turn
              technical knowledge into real-world capability.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton to="/contact?type=consulting" variant="primary" size="lg">
                Book a Consultation
              </LinkButton>
              <LinkButton to="/services" variant="secondary" size="lg">
                Explore Our Services
              </LinkButton>
            </div>
            <Link to="/courses" className="link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
              Explore Certificate Courses <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <ul className="mt-10 grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-3">
              {VALUE_POINTS.map((v) => (
                <li key={v} className="flex gap-2 text-sm leading-6 text-[var(--text-body)]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden /> {v}
                </li>
              ))}
            </ul>
          </div>
          {brand.heroImage ? (
            <img src={brand.heroImage} alt="" className="w-full rounded-[16px] border border-[var(--border)] object-cover shadow-[var(--card-shadow)]" />
          ) : (
            <HeroVisual />
          )}
        </div>
        <WaveDivider color="var(--bg-blue)" variant="wave-1" />
      </section>

      {/* 2. Two pillars (--bg-blue) */}
      <Section
        tone="blue"
        dividerColor="var(--bg-cream)"
        dividerVariant="wave-2"
        eyebrow="What we do"
        title="Consulting and training, from one team"
        intro="Commission an analysis, or build the skills to do it yourself. Both draw on the same methods and the same standards."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <PillarCard
            icon={Briefcase}
            eyebrow="Consulting"
            title="Answers you can defend"
            text="Statistical analysis, predictive modelling, forecasting, survey and experimental design, optimisation and machine learning, scoped around your question."
            points={['Fixed-scope projects, quoted after a discovery call', 'Assumptions checked and documented', 'Report, walkthrough and reproducible code']}
            motif="regression"
            cta={{ label: 'Discuss your project', to: '/contact?type=consulting' }}
            secondary={{ label: 'Browse services', to: '/services' }}
          />
          <PillarCard
            icon={GraduationCap}
            eyebrow="Academy"
            title="Skills that transfer to real work"
            text="Certificate courses and corporate workshops in statistics, mathematics, programming and data science, built around hands-on lab work."
            points={['Beginner to advanced, in R, Python, Excel, SQL and more', 'Project-based assessment', 'Workshops tailored to your team and data']}
            motif="statistics"
            cta={{ label: 'Explore courses', to: '/courses' }}
            secondary={{ label: 'Corporate training', to: '/corporate-training' }}
          />
        </div>
      </Section>

      {/* 3. Featured services (--bg-cream) */}
      <Section
        tone="cream"
        dividerColor="var(--bg-lavender)"
        dividerVariant="wave-1"
        eyebrow="Consulting services"
        title="Where we help most often"
        action={
          <LinkButton to="/services" variant="secondary">
            All services <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        }
      >
        {services.error ? (
          <ErrorState error={services.error} onRetry={services.reload} />
        ) : !services.data ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.data.items.slice(0, 6).map((s) => (
              <ServiceCard key={s.slug} service={s} visual />
            ))}
          </div>
        )}
      </Section>

      {/* 4. How we work (--bg-lavender) */}
      {content && (
        <Section
          tone="lavender"
          dividerColor="var(--bg-mint)"
          dividerVariant="wave-2"
          eyebrow="How we work"
          title="A clear process, from first question to handover"
        >
          <ol className="grid gap-6 md:grid-cols-5">
            {content.consulting_approach.map((s, i) => (
              <li key={s.step} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tint-lavender)] text-sm font-semibold text-[var(--primary)]">{i + 1}</span>
                  {i < content.consulting_approach.length - 1 && <span aria-hidden className="hidden h-px flex-1 bg-[var(--border)] md:block" />}
                </div>
                <h3 className="mt-4 font-semibold text-ink">{titleCase(s.step)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{s.detail}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* 5. Featured courses (--bg-mint) */}
      <Section
        tone="mint"
        dividerColor="var(--bg-blue)"
        dividerVariant="wave-1"
        eyebrow="Certificate courses"
        title="Popular courses"
        intro="Structured courses with lab work and a final project, from first principles to advanced modelling."
        action={
          <LinkButton to="/courses" variant="secondary">
            All courses <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        }
      >
        {courses.error ? (
          <ErrorState error={courses.error} onRetry={courses.reload} />
        ) : !courses.data ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.data.items.slice(0, 4).map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        )}
      </Section>

      {/* 6. Worked analysis showcase (--bg-blue) */}
      <Section
        tone="blue"
        dividerColor="var(--bg-cream)"
        dividerVariant="wave-2"
        eyebrow="See how we work"
        title="A worked analysis, end to end"
      >
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            {chart ? (
              <Suspense fallback={<Loading label="Loading chart…" />}>
                <ChartRenderer spec={chart} />
              </Suspense>
            ) : (
              <Loading label="Loading chart…" />
            )}
          </div>
          <div className="flex flex-col gap-5">
            {showcase.data && (
              <div>
                <h3 className="text-lg font-semibold text-ink">{showcase.data.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{showcase.data.summary}</p>
                <Link to={`/projects/${SHOWCASE}`} className="link mt-3 inline-flex items-center gap-1 text-sm">
                  Read the full analysis <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <p className="mt-3 text-xs text-subtle">Demonstration on synthetic data; not a client engagement.</p>
              </div>
            )}
            {otherProjects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </div>
      </Section>

      {/* 7. FAQ (--bg-cream) */}
      {content && (
        <Section
          tone="cream"
          isBandDivider={true}
          dividerVariant="wave-1"
          eyebrow="FAQ"
          title="Frequently asked questions"
        >
          <div className="mx-auto max-w-3xl">
            <Faq items={content.faq.slice(0, 6)} />
            <p className="mt-6 text-center text-sm text-muted">
              More questions?{' '}
              <Link to="/contact?type=contact" className="link">
                Send us a message
              </Link>
              .
            </p>
          </div>
        </Section>
      )}

      <CtaBanner
        title="Have a question about your data?"
        text="Tell us what you are trying to find out. We will reply to discuss scope, approach and next steps. There is no obligation."
        primary={{ label: 'Book a consultation', to: '/contact?type=consulting' }}
        secondary={{ label: 'Request corporate training', to: '/corporate-training#proposal' }}
      />
    </>
  )
}
