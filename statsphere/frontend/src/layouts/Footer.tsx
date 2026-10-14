import { CalendarClock, Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/ui/Logo'
import { brand } from '../config/brand'
import { useSite } from '../hooks/useSite'

const COLUMNS = [
  {
    title: 'Consulting',
    links: [
      { to: '/services', label: 'All services' },
      { to: '/services/statistical-analysis', label: 'Statistical analysis' },
      { to: '/services/regression-predictive-modelling', label: 'Predictive modelling' },
      { to: '/services/time-series-forecasting', label: 'Forecasting' },
      { to: '/services/research-methodology-support', label: 'Research support' },
    ],
  },
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

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark src={brandLogoUrl} />
            <span className="font-semibold text-ink">{name}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">{tagline}</p>
          <p className="mt-2 text-sm leading-6 text-subtle">
            Consulting and certificate courses in statistics, mathematics and data science.
          </p>
          {hasContact && (
            <ul className="mt-6 space-y-2 text-sm text-muted">
              {contact.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-subtle" aria-hidden />
                  <a className="hover:text-ink" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-subtle" aria-hidden />
                  <a className="hover:text-ink" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-subtle" aria-hidden />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-subtle" aria-hidden />
                  <span>{contact.hours}</span>
                </li>
              )}
            </ul>
          )}
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="link mt-4 inline-flex items-center gap-1.5 text-sm">
              <CalendarClock className="h-4 w-4" aria-hidden /> Schedule a call
            </a>
          )}
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold text-ink">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-muted hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {col.title === 'Company' && contact.linkedin_url && (
                  <li>
                    <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
                      LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p>
            A service of{' '}
            <a href={brand.institution.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {brand.institution.name}
            </a>
            . Certificates of completion are not degrees or accredited qualifications.
          </p>
        </div>
      </div>
    </footer>
  )
}
