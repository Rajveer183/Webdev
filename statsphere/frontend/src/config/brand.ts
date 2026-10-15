/**
 * Brand and business configuration.
 *
 * Everything that identifies the business lives here so it can be changed in one
 * place. Contact details are deliberately empty: they are managed in the admin
 * area (Settings) and served by GET /api/site. Never put unverified claims here.
 */
export const brand = {
  name: 'SGT Consulting Services',
  shortName: 'SGT Consulting',
  tagline: 'From Statistical Insight to Data-Driven Impact.',
  description:
    'Statistical consulting, mathematical modelling, data analytics and practical certificate courses in statistics, mathematics and data science, from SGT University.',
  category: 'Statistics, Mathematics & Data Science Consulting and Professional Training',
  /** Logo shown in the header, footer and admin area (the official SGT University seal). Admin → Settings → Logos can replace it. */
  logo: '/assets/sgt-university-logo.webp',
  logoAlt: 'SGT University logo',
  /** Public URL of the deployed site, used for canonical links and social metadata. */
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || '',
  /** Optional external booking page (e.g. a scheduling tool). Admin Settings can override it. */
  bookingUrl: (import.meta.env.VITE_BOOKING_URL as string | undefined) || '',

  /**
   * Parent institution. SGT Consulting Services is an official service of SGT University
   * (confirmed by the site owner). Its course catalogue is built on the university's
   * B.Sc. (Hons) Statistics & Data Science curriculum (Department of Mathematics).
   * Do not add accreditation or recognition badges here unless they apply to these
   * specific services and courses.
   */
  institution: {
    name: 'SGT University',
    legalName: 'Shree Guru Gobind Singh Tricentenary University',
    url: 'https://sgtuniversity.ac.in/',
    department: 'Department of Mathematics',
    logo: '/assets/sgt-university-logo.webp',
    logoAlt: 'SGT University logo',
    showLogo: true,
  },

  /**
   * Team profiles shown on the About page. Leave empty until names, roles and credentials are
   * verified; nothing is rendered in production while it is empty. `photo` is a path under
   * frontend/public (e.g. '/assets/team/jane.jpg'); `linkedin` must be an https:// URL.
   */
  team: [] as Array<{ name: string; role: string; bio: string; credentials?: string[]; photo?: string; linkedin?: string }>,

  /**
   * Optional real photography. When set (paths under frontend/public), the homepage hero and the
   * About page show these images instead of the built-in illustrations.
   */
  heroImage: '' as string,
  aboutImage: '' as string,
} as const

/** schema.org description of the business, shared by page-level JSON-LD. */
export const organizationLd = {
  '@type': 'Organization',
  name: brand.name,
  parentOrganization: {
    '@type': 'CollegeOrUniversity',
    name: brand.institution.name,
    legalName: brand.institution.legalName,
    url: brand.institution.url,
  },
}

export type Brand = typeof brand
