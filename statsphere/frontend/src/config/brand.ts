/**
 * Brand and business configuration.
 *
 * Everything that identifies the business lives here so it can be changed in one
 * place. Contact details are deliberately empty: they are managed in the admin
 * area (Settings) and served by GET /api/site. Never put unverified claims here.
 */
export const brand = {
  name: 'Hexona Consultancy Services',
  shortName: 'Hexona Consultancy',
  tagline: 'From Statistical Insight to Data-Driven Impact.',
  description:
    'Statistical consulting, mathematical modelling, data analytics and practical certificate courses in statistics, mathematics and data science.',
  category: 'Statistics, Mathematics & Data Science Consulting and Professional Training',
  /** Public URL of the deployed site, used for canonical links and social metadata. */
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || '',
  /** Optional external booking page (e.g. a scheduling tool). Admin Settings can override it. */
  bookingUrl: (import.meta.env.VITE_BOOKING_URL as string | undefined) || '',

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
}

export type Brand = typeof brand
