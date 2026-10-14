import { titleCase } from '../lib/titleCase'
import { Compass, ExternalLink, Eye, Scale, UserRound, Wrench } from 'lucide-react'
import { CtaBanner } from '../components/content/CtaBanner'
import { InstitutionReference } from '../components/content/InstitutionReference'
import { Illustration } from '../components/illustrations/Illustration'
import { Icon } from '../components/ui/Icon'
import { PageHeader, Section } from '../components/ui/Section'
import { brand } from '../config/brand'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useSite'

const VALUES = [
  {
    icon: Scale,
    title: 'Accuracy',
    text: 'Methods are chosen for the question and the data, assumptions are checked, and results are reported with their uncertainty.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    text: 'Clear scopes, documented methods, reproducible code and honest statements about what an analysis can and cannot show.',
  },
  {
    icon: Wrench,
    title: 'Practical problem-solving',
    text: 'Work is judged by whether it helps someone make a better decision or understand their data, not by technical complexity.',
  },
  {
    icon: Compass,
    title: 'Integrity in education',
    text: 'Plain descriptions of what courses cover and what certificates mean, with no inflated claims about recognition or outcomes.',
  },
]

function Team() {
  if (brand.team.length === 0) {
    // Nothing is shown to visitors until real, verified profiles are added in brand.ts.
    return import.meta.env.DEV ? (
      <Section eyebrow="Team" title="Who you will work with">
        <p className="rounded-xl border border-dashed border-warning/50 bg-warning-soft p-4 text-sm text-warning">
          Development note: add verified team profiles (name, role, bio, credentials, optional photo) to <code>brand.team</code> in
          frontend/src/config/brand.ts. This section is hidden in production until then.
        </p>
      </Section>
    ) : null
  }
  return (
    <Section eyebrow="Team" title="Who you will work with">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brand.team.map((m) => (
          <article key={m.name} className="card overflow-hidden">
            {m.photo ? (
              <img src={m.photo} alt={`Portrait of ${m.name}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-surface-2">
                <UserRound className="h-12 w-12 text-subtle" aria-hidden />
              </div>
            )}
            <div className="p-6">
              <p className="font-semibold text-ink">{m.name}</p>
              <p className="text-sm text-accent">{m.role}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{m.bio}</p>
              {m.credentials && <p className="mt-3 text-xs text-subtle">{m.credentials.join(' · ')}</p>}
              {m.linkedin && (
                <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-flex items-center gap-1 text-sm">
                  LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

export default function AboutPage() {
  const { name, content } = useSite()
  usePageMeta({
    title: 'About Us',
    description: `${name} combines statistical consulting with practical training in statistics, mathematics and data science.`,
  })

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About' }]}
        eyebrow="About us"
        title="Rigorous quantitative work, explained clearly"
        intro={`${name} is the consulting and professional training service of ${brand.institution.name}. We help students, researchers, professionals and businesses solve quantitative problems and build practical data science skills.`}
        aside={
          brand.aboutImage ? (
            <img src={brand.aboutImage} alt="" className="w-full rounded-3xl border border-line object-cover shadow-sm" />
          ) : (
            <Illustration motif="network" className="w-full drop-shadow-sm" />
          )
        }
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-5 text-[1.02rem] leading-8 text-muted">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Our Purpose</h2>
            <p>
              Good decisions increasingly depend on data, but sound analysis depends on mathematical reasoning and statistical evidence:
              choosing the right method, checking its assumptions and reporting uncertainty honestly. We exist to provide that rigour where
              it is needed and to help people develop it themselves.
            </p>
            <p>
              Our focus is the core of the discipline: probability and inference, regression and multivariate methods, time series, survey and
              experimental design, optimisation, machine learning and the mathematics underneath them.
            </p>
          </div>
          <div className="space-y-5 text-[1.02rem] leading-8 text-muted">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Consulting and Training, Together</h2>
            <p>
              Consulting and teaching inform each other. Consulting keeps our courses grounded in the problems people actually bring, such as
              messy data, unclear questions and tight deadlines. Teaching forces us to explain methods clearly, which makes our consulting
              reports easier to act on.
            </p>
            <p>
              Clients can commission analysis and then train their teams to maintain it. Learners study the same methods we apply in practice,
              with lab work in industry-standard tools.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted" eyebrow="Values" title="What we stand for">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: I, title, text }) => (
            <div key={title} className="card p-6">
              <I className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-4 font-semibold text-ink">{titleCase(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Team />

      {content && (
        <Section
          eyebrow="Areas of expertise"
          title="What we know"
          intro="Our subject coverage spans a complete four-year statistics and data science curriculum, from descriptive statistics to deep learning."
        >
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {content.expertise_areas.map((e) => (
              <div key={e.title} className="bg-surface p-6">
                <Icon name={e.icon} className="h-5 w-5 text-brand" />
                <h3 className="mt-3 font-semibold text-ink">{titleCase(e.title)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{e.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {content && (
        <Section
          tone="muted"
          eyebrow="Who we serve"
          title="Sectors our methods apply to"
          intro="These are the contexts our services and courses are designed for. We do not list clients without their permission."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.industries.map((i) => (
              <div key={i.name} className="card p-5">
                <Icon name={i.icon} className="h-5 w-5 text-accent" />
                <h3 className="mt-3 text-[0.95rem] font-semibold text-ink">{titleCase(i.name)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{i.note}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section eyebrow="Our institution" title="Part of SGT University">
        <InstitutionReference />
      </Section>

      <CtaBanner
        title="Have a question about your data?"
        text="Start with a short conversation. We will tell you honestly whether and how we can help."
        primary={{ label: 'Book a consultation', to: '/contact?type=consulting' }}
        secondary={{ label: 'Explore courses', to: '/courses' }}
      />
    </>
  )
}
