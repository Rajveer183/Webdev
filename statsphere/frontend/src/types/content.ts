export type Availability = 'proposed' | 'enquiries_open' | 'enrolling' | 'closed'
export type Level = 'Beginner' | 'Intermediate' | 'Advanced'
export type CourseFormat = 'short-course' | 'workshop' | 'extended'
export type DeliveryMode = 'online' | 'in-person' | 'hybrid'

export interface RelatedLink {
  slug: string
  title: string
  summary: string
}

export interface Related {
  services: RelatedLink[]
  courses: RelatedLink[]
  articles: RelatedLink[]
}

export interface ListResponse<T> {
  items: T[]
  total: number
}

export interface ServiceCard {
  slug: string
  title: string
  category: string
  icon: string
  summary: string
  featured: boolean
  availability?: Availability
  methods: string[]
  tools: string[]
  problems: string[]
  audience: string[]
  deliverables: string[]
  applications: string[]
  client_inputs: string[]
  related_courses: string[]
  related_articles: string[]
  source_pages: number[]
  order: number
}

export interface Service extends ServiceCard {
  overview: string
  process: { step: string; detail: string }[]
  related: Related
}

export interface CourseCard {
  slug: string
  title: string
  category: string
  level: Level
  format: CourseFormat
  summary: string
  featured: boolean
  availability?: Availability
  proposed_duration: string
  proposed_hours: number
  delivery_modes: DeliveryMode[]
  tools: string[]
  learning_objectives: string[]
  prerequisites: string[]
  audience: string[]
  fee: string | null
  module_count?: number
  source_pages: number[]
  order: number
}

export interface Course extends CourseCard {
  description: string
  modules: { title: string; topics: string[] }[]
  projects: string[]
  teaching_format: string
  assessment: string[]
  certificate: { type: 'completion'; eligibility: string[] }
  related_services: string[]
  related_articles: string[]
  source_modules: { name: string; code: string; pages: number[] }[]
  related: Related
}

export type ArticleBlock =
  | { type: 'paragraph' | 'heading'; text: string }
  | { type: 'formula'; tex: string; caption?: string | null }
  | { type: 'list'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'callout'; title: string; text: string }
  | { type: 'example'; title: string; text: string; steps: string[] }

export interface ArticleCard {
  slug: string
  title: string
  category: string
  summary: string
  tags: string[]
  reading_minutes: number
  source_pages: number[]
  order: number
}

export interface Article extends ArticleCard {
  body: ArticleBlock[]
  related_services: string[]
  related_courses: string[]
  related: Related
}

export interface ChartSeries {
  key: string
  label: string
  color: number
  style: 'line' | 'dashed' | 'points' | 'line-points' | 'step' | 'bar'
  error_key?: string | null
}

export interface ChartSpec {
  id: string
  kind: 'line' | 'bar' | 'scatter' | 'step'
  title: string
  subtitle?: string | null
  x_key: string
  x_label: string
  y_label: string
  x_type: 'number' | 'category'
  y_domain?: number[] | null
  layout?: 'vertical' | 'horizontal' | null
  series: ChartSeries[]
  data: Record<string, number | string | null>[]
  overlay?: Record<string, number | string | null>[] | null
  reference_lines: { axis: 'x' | 'y'; value: number; label: string }[]
}

export interface ProjectCard {
  slug: string
  title: string
  category: string
  summary: string
  is_synthetic: boolean
  problem: string
  dataset: string
  methodology: string[]
  results: { label: string; value: string }[]
  featured: boolean
  source_pages: number[]
  order: number
}

export interface Project extends ProjectCard {
  process: string[]
  charts: ChartSpec[]
  anova_table: { columns: string[]; rows: string[][] } | null
  interpretation: string[]
  limitations: string[]
  applications: string[]
  related: Related
}

export interface Workshop {
  slug: string
  title: string
  summary: string
  participants: string[]
  objectives: string[]
  topics: string[]
  formats: string[]
  example_agenda: { session: string; detail: string }[]
  customisation: string[]
  related_courses: string[]
  source_pages: number[]
  order: number
}

export interface Topic {
  id: string
  name: string
  description: string
  semester: number | null
  source_pages: number[]
  related_services: string[]
  related_courses: string[]
  related_articles: string[]
  website_section: string | null
}

export interface SiteContent {
  expertise_areas: { title: string; icon: string; description: string; source_pages: number[] }[]
  industries: { name: string; icon: string; note: string; source_pages: number[] }[]
  audiences: { title: string; icon: string; description: string; path: string; cta: { label: string; to: string } }[]
  consulting_approach: { step: string; detail: string }[]
  training_methodology: { title: string; icon: string; description: string }[]
  faq: { q: string; a: string }[]
}

export interface ContactSettings {
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  hours: string | null
  booking_url: string | null
  linkedin_url: string | null
}

export interface SiteResponse {
  contact: ContactSettings
  brand: { name: string | null; tagline: string | null; show_institution_logo: boolean | null }
  content: SiteContent
  media: { brand_logo: string | null }
}
