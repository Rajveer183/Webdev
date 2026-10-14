import { ExternalLink } from 'lucide-react'
import { brand } from '../../config/brand'
import { useSite } from '../../hooks/useSite'

/** Explains the relationship with SGT University and where the curriculum comes from. */
export function InstitutionReference({ compact = false }: { compact?: boolean }) {
  const { showInstitutionLogo, name, institutionLogoUrl } = useSite()
  const inst = brand.institution
  return (
    <aside aria-labelledby="institution-reference" className={`card flex flex-col gap-5 sm:flex-row sm:items-start ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      {showInstitutionLogo && (
        <img
          src={institutionLogoUrl}
          alt={inst.logoAlt}
          width={88}
          height={84}
          loading="lazy"
          className="h-20 w-auto shrink-0 self-start rounded-full bg-white object-contain p-1"
        />
      )}
      <div>
        <h2 id="institution-reference" className="font-semibold text-ink">
          A service of {inst.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {name} is the consulting and professional training service of{' '}
          <a href={inst.url} className="link inline-flex items-center gap-0.5" target="_blank" rel="noopener noreferrer">
            {inst.name} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>{' '}
          ({inst.legalName}). Our services and certificate courses are built on the university&apos;s four-year B.Sc. (Hons) Statistics
          &amp; Data Science curriculum from the {inst.department}, covering 51 modules across eight semesters.
        </p>
        <p className="mt-2 text-xs leading-5 text-subtle">
          Certificate courses lead to a certificate of completion issued by {name}. They are short professional courses, not university
          degrees, diplomas or externally accredited qualifications.
        </p>
      </div>
    </aside>
  )
}
