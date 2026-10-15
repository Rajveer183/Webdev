import { Briefcase, CalendarClock, GraduationCap, Mail, MessageSquare, Phone, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ConsultingForm } from '../components/forms/ConsultingForm'
import { ContactForm } from '../components/forms/ContactForm'
import { CorporateTrainingForm } from '../components/forms/CorporateTrainingForm'
import { CourseEnquiryForm } from '../components/forms/CourseEnquiryForm'
import { PageHeader } from '../components/ui/Section'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useSite'

const TABS = [
  {
    key: 'consulting',
    label: 'Consulting',
    icon: Briefcase,
    blurb: 'Book a consultation or discuss a project.',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    on: 'border-sky-400 bg-sky-50 ring-1 ring-sky-400 dark:border-sky-400/70 dark:bg-sky-500/10 dark:ring-sky-400/70',
    hover: 'hover:border-sky-300 hover:bg-sky-50/50 dark:hover:border-sky-400/50 dark:hover:bg-sky-500/5',
  },
  {
    key: 'course',
    label: 'Course Enquiry',
    icon: GraduationCap,
    blurb: 'Register interest in a certificate course.',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    on: 'border-violet-400 bg-violet-50 ring-1 ring-violet-400 dark:border-violet-400/70 dark:bg-violet-500/10 dark:ring-violet-400/70',
    hover: 'hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-400/50 dark:hover:bg-violet-500/5',
  },
  {
    key: 'corporate',
    label: 'Corporate Training',
    icon: Users,
    blurb: 'Request a training proposal for your team.',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    on: 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400 dark:border-emerald-400/70 dark:bg-emerald-500/10 dark:ring-emerald-400/70',
    hover: 'hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-500/5',
  },
  {
    key: 'contact',
    label: 'General',
    icon: MessageSquare,
    blurb: 'Anything else.',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    on: 'border-amber-400 bg-amber-50 ring-1 ring-amber-400 dark:border-amber-400/70 dark:bg-amber-500/10 dark:ring-amber-400/70',
    hover: 'hover:border-amber-300 hover:bg-amber-50/50 dark:hover:border-amber-400/50 dark:hover:bg-amber-500/5',
  },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function ContactPage() {
  const [params, setParams] = useSearchParams()
  const { contact, bookingUrl } = useSite()
  const raw = params.get('type')
  const active: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : 'consulting'

  usePageMeta({
    title: 'Contact & Consultation Booking',
    description: 'Book a consultation, enquire about a certificate course, request corporate training or send us a message.',
  })

  const select = (key: TabKey) => {
    const next = new URLSearchParams(params)
    next.set('type', key)
    next.delete('service')
    next.delete('course')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader
        accent="teal"
        crumbs={[{ label: 'Contact' }]}
        eyebrow="Contact"
        title="How can we help?"
        intro="Choose the type of enquiry so we can route it correctly. We reply using your preferred contact method."
      />

      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_20rem]">
        <div>
          <div role="tablist" aria-label="Enquiry type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TABS.map(({ key, label, icon: I, chip, on, hover }) => (
              <button
                key={key}
                id={`tab-${key}`}
                type="button"
                role="tab"
                aria-selected={active === key}
                aria-controls={`panel-${key}`}
                tabIndex={active === key ? 0 : -1}
                onClick={() => select(key)}
                onKeyDown={(e) => {
                  const i = TABS.findIndex((t) => t.key === active)
                  if (e.key === 'ArrowRight') select(TABS[(i + 1) % TABS.length].key)
                  if (e.key === 'ArrowLeft') select(TABS[(i - 1 + TABS.length) % TABS.length].key)
                }}
                className={`flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition ${
                  active === key ? `${on} shadow-sm` : `border-line bg-surface ${hover}`
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>
                  <I className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-ink">{label}</span>
              </button>
            ))}
          </div>

          <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} className="card mt-6 p-6 sm:p-8">
            <p className="mb-6 text-muted">{TABS.find((t) => t.key === active)!.blurb}</p>
            {active === 'consulting' && <ConsultingForm key="c" serviceSlug={params.get('service') ?? ''} />}
            {active === 'course' && <CourseEnquiryForm key="k" courseSlug={params.get('course') ?? ''} />}
            {active === 'corporate' && <CorporateTrainingForm key="t" />}
            {active === 'contact' && <ContactForm key="g" />}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-semibold text-ink">{contact.email || contact.phone ? 'Direct Contact' : 'What Happens Next'}</h2>
            {contact.email || contact.phone ? (
              <ul className="mt-4 space-y-3 text-sm">
                {contact.email && (
                  <li className="flex items-center gap-2 text-muted">
                    <Mail className="h-4 w-4 text-subtle" aria-hidden />
                    <a href={`mailto:${contact.email}`} className="link">
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex items-center gap-2 text-muted">
                    <Phone className="h-4 w-4 text-subtle" aria-hidden />
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="link">
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.hours && <li className="text-subtle">{contact.hours}</li>}
              </ul>
            ) : (
              <ol className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">1</span>
                  Send the form that fits your enquiry. You get a reference number straight away.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">2</span>
                  Our team reviews it and replies using your preferred contact method.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">3</span>
                  For consulting, we arrange a short call to agree scope, approach and next steps.
                </li>
              </ol>
            )}

          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <CalendarClock className="h-4 w-4 text-subtle" aria-hidden /> Scheduling a Consultation
            </h2>
            {bookingUrl ? (
              <p className="mt-3 text-sm leading-6 text-muted">
                Pick a time directly in our{' '}
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="link">
                  booking calendar
                </a>
                , or use the consulting form and we will arrange a time with you.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">
                Add your preferred date and time of day in the consulting form. We will confirm a slot by your preferred contact method.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
