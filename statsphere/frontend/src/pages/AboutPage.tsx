import { Compass, ExternalLink, Eye, Layers, Scale, Target, UserRound, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CtaBanner } from '../components/content/CtaBanner'
import { Icon } from '../components/ui/Icon'
import { Breadcrumbs } from '../components/ui/Section'
import { brand } from '../config/brand'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useSite'
import { titleCase } from '../lib/titleCase'
import { WaveDivider } from '../components/ui/WaveDivider'
import { PALETTE, rotatingColor } from '../lib/categoryColors'

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

function NetworkGraphCard() {
  const centerNode = { x: 220, y: 180 }
  const outerNodes = [
    { x: 100, y: 85 },
    { x: 220, y: 55 },
    { x: 340, y: 85 },
    { x: 385, y: 185 },
    { x: 335, y: 295 },
    { x: 220, y: 320 },
    { x: 105, y: 290 },
    { x: 60, y: 180 },
  ]

  const lines: [number | 'c', number | 'c'][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    [0, 'c'], [1, 'c'], [2, 'c'], [3, 'c'], [4, 'c'], [5, 'c'], [6, 'c'], [7, 'c'],
    [0, 3], [2, 5], [4, 7], [1, 6],
  ]

  return (
    <div className="relative flex h-full min-h-[380px] w-full items-center justify-center overflow-hidden rounded-[16px] border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-card)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-200 hover:border-[var(--accent)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
      <svg
        viewBox="0 0 440 360"
        className="h-full max-h-[380px] w-full select-none"
        aria-hidden="true"
      >
        <defs>
          {/* Faint grid background */}
          <pattern id="about-network-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--primary)] opacity-[0.08]" />
          </pattern>

          {/* Soft gold glow filter for the central node */}
          <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gold glow centered at the core */}
          <radialGradient id="center-radial-accent" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--bg-card)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Faint grid and subtle radial wash */}
        <rect width="100%" height="100%" fill="url(#about-network-grid)" />
        <circle cx={centerNode.x} cy={centerNode.y} r="160" fill="url(#center-radial-accent)" />

        {/* Thin primary-tinted connecting lines (30% opacity) */}
        <g stroke="var(--primary)" strokeOpacity="0.30" strokeWidth="1.5">
          {lines.map(([from, to], idx) => {
            const p1 = from === 'c' ? centerNode : outerNodes[from]
            const p2 = to === 'c' ? centerNode : outerNodes[to]
            return <line key={idx} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />
          })}
        </g>

        {/* Outer orbital guide ring */}
        <circle
          cx={centerNode.x}
          cy={centerNode.y}
          r="140"
          fill="none"
          stroke="var(--primary)"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Central aura ring */}
        <circle
          cx={centerNode.x}
          cy={centerNode.y}
          r="32"
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Primary outer nodes */}
        {outerNodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r="10"
            fill="var(--primary)"
            stroke="var(--bg-card)"
            strokeWidth="2.5"
          />
        ))}

        {/* Gold central node with soft gold glow */}
        <g filter="url(#gold-glow)">
          <circle
            cx={centerNode.x}
            cy={centerNode.y}
            r="18"
            fill="var(--accent)"
            stroke="var(--bg-card)"
            strokeWidth="3"
          />
          <circle
            cx={centerNode.x}
            cy={centerNode.y}
            r="6"
            fill="var(--bg-card)"
          />
        </g>
      </svg>
    </div>
  )
}

function Team() {
  if (brand.team.length === 0) {
    return null
  }
  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg-section-alt)] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-text">Team</p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] sm:text-3xl">Who you will work with</h2>
        </div>
        <div className={`grid gap-6 sm:grid-cols-2 ${brand.team.length >= 3 ? 'lg:grid-cols-3' : 'max-w-3xl'}`}>
          {brand.team.map((m) => (
            <article key={m.name} className="flex flex-col overflow-hidden rounded-[16px] border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-card)] shadow-sm transition-all duration-200 hover:border-[var(--accent)] hover:shadow-md">
              {m.photo ? (
                <img src={m.photo} alt={`Portrait of ${m.name}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[var(--accent-soft)]">
                  <UserRound className="h-12 w-12 text-[var(--primary)]" aria-hidden />
                </div>
              )}
              <div className="p-6">
                <p className="font-semibold text-[var(--text-heading)]">{m.name}</p>
                <p className="text-sm font-medium text-accent-text">{m.role}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-body)]">{m.bio}</p>
                {m.credentials && <p className="mt-3 text-xs text-[var(--text-muted)]">{m.credentials.join(' · ')}</p>}
                {m.linkedin && (
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-flex items-center gap-1 text-sm font-medium">
                    LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
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
      {/* ===================== HERO SECTION ===================== */}
      <div style={{ background: 'var(--bg-hero)' }} className="relative overflow-hidden bg-hero">
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

        <div className="relative mx-auto w-full max-w-[1200px] px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-8 min-[900px]:grid-cols-12 lg:gap-12">
            {/* Left Column: Text block */}
            <div className="flex flex-col justify-center min-[900px]:col-span-7">
              <Breadcrumbs items={[{ label: 'About' }]} />

              {/* Eyebrow "ABOUT US": --accent, uppercase */}
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-text">
                ABOUT US
              </p>

              {/* Headline: "Rigorous Quantitative Work, Explained Clearly" */}
              <h1 className="hero-title mb-5">
                Rigorous Quantitative Work,
                <br />
                <span className="hero-title-accent">Explained Clearly</span>
              </h1>

              {/* Paragraph: --text-body, 18px, line-height 1.6, max-width 60ch */}
              <p className="max-w-[60ch] text-[18px] leading-[1.6] text-[var(--text-body)]">
                {name} is a consulting and professional training service. We help students,
                researchers, professionals and businesses solve quantitative problems and build practical data science skills.
              </p>

              {/* Two CTAs: Primary solid --primary, Secondary transparent with 1.5px --primary border and hover --accent-soft */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/contact?type=consulting"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3.5 text-sm font-semibold text-white dark:text-[#060D1F] shadow-sm transition-all duration-150 hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                >
                  Book a Consultation
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-[var(--primary)] bg-transparent px-6 py-3.5 text-sm font-semibold text-[var(--primary)] transition-all duration-150 hover:bg-[var(--accent-soft)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                >
                  Explore Courses
                </Link>
              </div>

              {/* Slim trust strip under the CTAs with 3 stats in --text-muted with gold (--accent-text) numbers */}
              <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)] sm:gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-accent-text">25+</span>
                  <span>projects delivered</span>
                </div>
                <div className="hidden h-3.5 w-px bg-[var(--border)] sm:block" aria-hidden />
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-accent-text">500+</span>
                  <span>learners trained</span>
                </div>
              </div>
            </div>

            {/* Right Column: Illustration card matching text block height */}
            <div className="flex items-stretch min-[900px]:col-span-5">
              {brand.aboutImage ? (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[16px] border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-card)] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[var(--accent)]">
                  <img src={brand.aboutImage} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <NetworkGraphCard />
              )}
            </div>
          </div>
        </div>
        <WaveDivider color="var(--bg-blue)" variant="wave-1" />
      </div>

      {/* ===================== SECTION 2: PURPOSE & TRAINING (--bg-blue) ===================== */}
      <section className="relative bg-[var(--bg-blue)] pt-12 sm:pt-16">
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-8 min-[900px]:grid-cols-2">
            {/* Card 1: Our Purpose */}
            <div className="flex h-full flex-col rounded-[16px] border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-card)] p-8 shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md sm:p-10">
              <div className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl ${PALETTE.sky.icon}`}>
                <Target className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-[var(--text-heading)]">
                Our Purpose
              </h2>
              <div className="flex-1 space-y-4 text-[17px] leading-[1.65] text-[var(--text-body)]">
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
            </div>

            {/* Card 2: Consulting and Training, Together */}
            <div className="flex h-full flex-col rounded-[16px] border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-card)] p-8 shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md sm:p-10">
              <div className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl ${PALETTE.violet.icon}`}>
                <Layers className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-[var(--text-heading)]">
                Consulting and Training, Together
              </h2>
              <div className="flex-1 space-y-4 text-[17px] leading-[1.65] text-[var(--text-body)]">
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
          </div>
        </div>
        <WaveDivider color="var(--bg-cream)" variant="wave-2" />
      </section>

      {/* ===================== SECTION 3: VALUES (--bg-cream) ===================== */}
      <section className="relative bg-[var(--bg-cream)] pt-12 sm:pt-16">
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-text">
              Values
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] sm:text-3xl">
              What we stand for
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: I, title, text }, idx) => (
              <div
                key={title}
                className={`flex flex-col rounded-[16px] border-[1.5px] p-6 shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${rotatingColor(idx).card}`}
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${rotatingColor(idx).icon}`}>
                  <I className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-heading)]">{titleCase(title)}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-body)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <WaveDivider color="var(--bg-lavender)" variant="wave-1" />
      </section>

      <Team />

      {/* ===================== SECTION 4: AREAS OF EXPERTISE (--bg-lavender) ===================== */}
      {content && (
        <section className="relative bg-[var(--bg-lavender)] pt-12 sm:pt-16">
          <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-text">
                Areas of expertise
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] sm:text-3xl">
                What we know
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--text-body)]">
                Our subject coverage spans a complete four-year statistics and data science curriculum, from descriptive statistics to deep learning.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[16px] border-[1.5px] border-[var(--border-strong)] bg-[var(--border-strong)] shadow-[var(--card-shadow)] sm:grid-cols-2 lg:grid-cols-4">
              {content.expertise_areas.map((e, idx) => (
                <div key={e.title} className="bg-[var(--bg-card)] p-6 transition-colors duration-150 hover:bg-[var(--tint-lavender)]/20">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${rotatingColor(idx).icon}`}>
                    <Icon name={e.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2 font-semibold text-[var(--text-heading)]">{titleCase(e.title)}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-body)]">{e.description}</p>
                </div>
              ))}
            </div>
          </div>
          <WaveDivider color="var(--bg-mint)" variant="wave-2" />
        </section>
      )}

      {/* ===================== SECTION 5: WHO WE SERVE (--bg-mint) ===================== */}
      {content && (
        <section className="relative bg-[var(--bg-mint)] pt-12 sm:pt-16">
          <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-text">
                Who we serve
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] sm:text-3xl">
                Sectors our methods apply to
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--text-body)]">
                These are the contexts our services and courses are designed for. We do not list clients without their permission.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {content.industries.map((i, idx) => (
                <div
                  key={i.name}
                  className={`flex flex-col rounded-[16px] border-[1.5px] p-6 shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${rotatingColor(idx).card}`}
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${rotatingColor(idx).icon}`}>
                    <Icon name={i.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-heading)]">{titleCase(i.name)}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-body)]">{i.note}</p>
                </div>
              ))}
            </div>
          </div>
          <WaveDivider color="var(--bg-blue)" variant="wave-1" />
        </section>
      )}

      {/* ===================== BOTTOM CTA BANNER ===================== */}
      <CtaBanner
        title="Have a question about your data?"
        text="Start with a short conversation. We will tell you honestly whether and how we can help."
        primary={{ label: 'Book a consultation', to: '/contact?type=consulting' }}
        secondary={{ label: 'Explore courses', to: '/courses' }}
      />
    </>
  )
}
