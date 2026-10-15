import { CalendarClock, Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/ui/Logo'
import { brand } from '../config/brand'
import { useApi } from '../hooks/useApi'
import { useSite } from '../hooks/useSite'
import type { ListResponse, ServiceCard } from '../types/content'

/** Featured services linked from the footer; the list comes from the API so unpublished slugs never appear. */
const FOOTER_SERVICES = 4

const STATIC_COLUMNS = [
  {
    title: 'Learning',
    links: [
      { to: '/courses', label: 'Certificate courses' },
      { to: '/corporate-training', label: 'Corporate training' },
      { to: '/knowledge', label: 'Knowledge hub' },
      { to: '/projects', label: 'Projects & demos' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/privacy', label: 'Privacy notice' },
    ],
  },
]

export function Footer() {
  const { name, tagline, contact, bookingUrl, brandLogoUrl } = useSite()
  const year = new Date().getFullYear()
  const hasContact = contact.email || contact.phone || contact.address
  const featured = useApi<ListResponse<ServiceCard>>('/api/services?featured=true')
  const columns = [
    {
      title: 'Consulting',
      links: [
        { to: '/services', label: 'All services' },
        ...(featured.data?.items ?? []).slice(0, FOOTER_SERVICES).map((s) => ({ to: `/services/${s.slug}`, label: s.title })),
      ],
    },
    ...STATIC_COLUMNS,
  ]

  return (
    <footer className="border-t border-white/10 bg-[var(--bg-footer)] text-slate-300">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark src={brandLogoUrl} />
            <span className="font-semibold text-white">{name}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{tagline}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Consulting and certificate courses in statistics, mathematics and data science.
          </p>
          {hasContact && (
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              {contact.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" aria-hidden />
                  <a className="hover:text-white" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" aria-hidden />
                  <a className="hover:text-white" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                  <span>{contact.hours}</span>
                </li>
              )}
            </ul>
          )}
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
              <CalendarClock className="h-4 w-4" aria-hidden /> Schedule a call
            </a>
          )}
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold text-white">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-slate-300 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {col.title === 'Company' && contact.linkedin_url && (
                  <li>
                    <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white">
                      LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p>
            A service of{' '}
            <a href={brand.institution.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {brand.institution.name}
            </a>
            . Certificates of completion are not degrees or accredited qualifications.
          </p>
        </div>
      </div>
    </footer>
  )
}
