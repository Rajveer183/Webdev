/**
 * Field definitions for the admin content editor, one list per content type.
 * Mirrors backend/app/schemas/content.py; the backend validates every save.
 */

export type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea' | 'nullable-text'; hint?: string; rows?: number }
  | { key: string; label: string; type: 'number'; hint?: string }
  | { key: string; label: string; type: 'select'; options: string[]; hint?: string }
  | { key: string; label: string; type: 'checkboxes'; options: { value: string; label: string }[]; hint?: string }
  | { key: string; label: string; type: 'list'; hint?: string }
  | { key: string; label: string; type: 'pairs'; fields: [string, string]; labels: [string, string]; hint?: string }
  | { key: string; label: string; type: 'modules'; hint?: string }
  | { key: string; label: string; type: 'refs'; target: 'service' | 'course' | 'article'; hint?: string }
  | { key: string; label: string; type: 'pages'; hint?: string }

export interface FieldGroup {
  title: string
  fields: FieldDef[]
}

export const CATEGORIES = ['Statistics', 'Mathematics', 'Data Science', 'Machine Learning', 'Analytics', 'Programming', 'Research']
export const ICONS = [
  'Sigma', 'TrendingUp', 'BrainCircuit', 'LineChart', 'GraduationCap', 'FlaskConical', 'Network', 'HeartPulse', 'Gauge',
  'BarChart3', 'Briefcase', 'Route', 'FunctionSquare', 'Database', 'BookOpen', 'Lightbulb', 'Microscope', 'Users',
]

const pages: FieldDef = { key: 'source_pages', label: 'Source PDF pages', type: 'pages', hint: 'Comma-separated, e.g. 2, 3, 29-31' }

export const FIELD_GROUPS: Record<string, FieldGroup[]> = {
  service: [
    {
      title: 'Basics',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { key: 'icon', label: 'Icon', type: 'select', options: ICONS },
        { key: 'summary', label: 'Card summary', type: 'textarea', rows: 2 },
        { key: 'overview', label: 'Overview', type: 'textarea', rows: 5 },
      ],
    },
    {
      title: 'Service details',
      fields: [
        { key: 'problems', label: 'Problems it solves', type: 'list' },
        { key: 'audience', label: 'Who it is for', type: 'list' },
        { key: 'client_inputs', label: 'What the client provides', type: 'list' },
        { key: 'process', label: 'Engagement process', type: 'pairs', fields: ['step', 'detail'], labels: ['Step', 'Detail'] },
        { key: 'deliverables', label: 'Deliverables', type: 'list' },
        { key: 'applications', label: 'Applications', type: 'list' },
        { key: 'methods', label: 'Methods', type: 'list' },
        { key: 'tools', label: 'Tools', type: 'list' },
      ],
    },
    {
      title: 'Links and sources',
      fields: [
        { key: 'related_courses', label: 'Related courses', type: 'refs', target: 'course' },
        { key: 'related_articles', label: 'Related articles', type: 'refs', target: 'article' },
        pages,
        { key: 'approval_note', label: 'Internal approval note (never shown publicly)', type: 'nullable-text' },
      ],
    },
  ],
  course: [
    {
      title: 'Basics',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { key: 'level', label: 'Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
        { key: 'format', label: 'Format', type: 'select', options: ['short-course', 'workshop', 'extended'] },
        { key: 'summary', label: 'Card summary', type: 'textarea', rows: 2 },
        { key: 'description', label: 'Description', type: 'textarea', rows: 6, hint: 'Separate paragraphs with a blank line.' },
      ],
    },
    {
      title: 'Syllabus',
      fields: [
        { key: 'learning_objectives', label: 'Learning objectives', type: 'list' },
        { key: 'modules', label: 'Modules', type: 'modules' },
        { key: 'projects', label: 'Practical exercises and projects', type: 'list' },
        { key: 'prerequisites', label: 'Prerequisites', type: 'list' },
        { key: 'audience', label: 'Intended audience', type: 'list' },
        { key: 'tools', label: 'Tools and technologies', type: 'list' },
      ],
    },
    {
      title: 'Delivery and certificate',
      fields: [
        { key: 'teaching_format', label: 'Teaching format', type: 'textarea', rows: 2 },
        {
          key: 'delivery_modes',
          label: 'Confirmed delivery modes',
          type: 'checkboxes',
          options: [
            { value: 'online', label: 'Online' },
            { value: 'in-person', label: 'In person' },
            { value: 'hybrid', label: 'Hybrid' },
          ],
          hint: 'Leave all unticked until confirmed; the site then shows “To be confirmed”.',
        },
        { key: 'proposed_duration', label: 'Duration (shown with a “proposed” label)', type: 'text' },
        { key: 'proposed_hours', label: 'Contact hours', type: 'number' },
        { key: 'fee', label: 'Fee', type: 'nullable-text', hint: 'Leave empty to show “To be announced”.' },
        { key: 'assessment', label: 'Assessment', type: 'list' },
        { key: 'certificate.eligibility', label: 'Certificate eligibility', type: 'list', hint: 'Certificate type is always “completion”.' },
      ],
    },
    {
      title: 'Links and sources',
      fields: [
        { key: 'related_services', label: 'Related services', type: 'refs', target: 'service' },
        { key: 'related_articles', label: 'Related articles', type: 'refs', target: 'article' },
        pages,
      ],
    },
  ],
  article: [
    {
      title: 'Article',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { key: 'summary', label: 'Summary', type: 'textarea', rows: 3, hint: 'Inline maths: $\\bar{x}$' },
        { key: 'tags', label: 'Tags', type: 'list' },
        { key: 'reading_minutes', label: 'Reading time (minutes)', type: 'number' },
      ],
    },
    {
      title: 'Links and sources',
      fields: [
        { key: 'related_services', label: 'Related services', type: 'refs', target: 'service' },
        { key: 'related_courses', label: 'Related courses', type: 'refs', target: 'course' },
        pages,
      ],
    },
  ],
  workshop: [
    {
      title: 'Workshop',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'summary', label: 'Summary', type: 'textarea', rows: 3 },
        { key: 'participants', label: 'Participants', type: 'list' },
        { key: 'objectives', label: 'Objectives', type: 'list' },
        { key: 'topics', label: 'Topics', type: 'list' },
        { key: 'formats', label: 'Formats', type: 'list', hint: 'e.g. Half-day, 1 day, Multi-week cohort' },
        { key: 'example_agenda', label: 'Example agenda', type: 'pairs', fields: ['session', 'detail'], labels: ['Session', 'Detail'] },
        { key: 'customisation', label: 'Customisation options', type: 'list' },
      ],
    },
    {
      title: 'Links and sources',
      fields: [{ key: 'related_courses', label: 'Related courses', type: 'refs', target: 'course' }, pages],
    },
  ],
  project: [
    {
      title: 'Project narrative',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { key: 'summary', label: 'Summary', type: 'textarea', rows: 2 },
        { key: 'problem', label: 'Problem statement', type: 'textarea', rows: 3 },
        { key: 'dataset', label: 'Dataset', type: 'textarea', rows: 3 },
        { key: 'methodology', label: 'Methodology', type: 'list' },
        { key: 'process', label: 'Analytical process', type: 'list' },
        { key: 'interpretation', label: 'Interpretation', type: 'list' },
        { key: 'limitations', label: 'Limitations', type: 'list' },
        { key: 'applications', label: 'Applications', type: 'list' },
      ],
    },
    {
      title: 'Links and sources',
      fields: [
        { key: 'related_services', label: 'Related services', type: 'refs', target: 'service' },
        { key: 'related_courses', label: 'Related courses', type: 'refs', target: 'course' },
        { key: 'related_articles', label: 'Related articles', type: 'refs', target: 'article' },
        pages,
      ],
    },
  ],
}

/** Fields edited only through the JSON tab (generated or block-structured content). */
export const JSON_ONLY: Record<string, string> = {
  article: 'The article body (paragraphs, formulas, tables, examples) is edited in the JSON tab.',
  project: 'Charts, results and tables are generated by data/scripts/build_projects.py; edit them in the JSON tab or regenerate.',
  course: 'Source modules (syllabus references) are edited in the JSON tab.',
}

// ---------- helpers ----------

export function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const [head, ...rest] = path.split('.')
  if (!rest.length) return { ...obj, [head]: value }
  const child = (obj[head] as Record<string, unknown>) ?? {}
  return { ...obj, [head]: setPath(child, rest.join('.'), value) }
}

export function parsePages(text: string): number[] | null {
  const out: number[] = []
  for (const part of text.split(',').map((p) => p.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*[-–]\s*(\d+)$/)
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])]
      if (b < a || b - a > 200) return null
      for (let i = a; i <= b; i++) out.push(i)
    } else if (/^\d+$/.test(part)) out.push(Number(part))
    else return null
  }
  return [...new Set(out)].sort((x, y) => x - y)
}
