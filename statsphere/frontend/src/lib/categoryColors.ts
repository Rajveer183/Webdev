/**
 * One colour per subject category, used for card outlines, soft card shading,
 * icon tiles, badges and filter pills. Class names are written out in full so
 * Tailwind can find them at build time.
 */
export interface CategoryColor {
  /** Card outline, top-left shade and hover outline. */
  card: string
  /** Gradient icon tile. */
  icon: string
  /** Small category badge. */
  badge: string
  /** Filter pill, not selected. */
  pill: string
  /** Filter pill, selected. */
  pillOn: string
  /** Plain coloured text. */
  text: string
}

export const PALETTE: Record<string, CategoryColor> = {
  sky: {
    card: 'border-sky-200 bg-gradient-to-br from-sky-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-sky-400 dark:border-sky-400/30 dark:from-sky-500/10 dark:hover:border-sky-400/70',
    icon: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/25',
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300',
    pill: 'border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-500 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-300',
    pillOn: 'border-sky-600 bg-sky-600 text-white shadow-sm dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950',
    text: 'text-sky-700 dark:text-sky-300',
  },
  violet: {
    card: 'border-violet-200 bg-gradient-to-br from-violet-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-violet-400 dark:border-violet-400/30 dark:from-violet-500/10 dark:hover:border-violet-400/70',
    icon: 'bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-md shadow-violet-500/25',
    badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-300',
    pill: 'border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-500 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-300',
    pillOn: 'border-violet-600 bg-violet-600 text-white shadow-sm dark:border-violet-400 dark:bg-violet-400 dark:text-slate-950',
    text: 'text-violet-700 dark:text-violet-300',
  },
  teal: {
    card: 'border-teal-200 bg-gradient-to-br from-teal-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-teal-400 dark:border-teal-400/30 dark:from-teal-500/10 dark:hover:border-teal-400/70',
    icon: 'bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-md shadow-teal-500/25',
    badge: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-300',
    pill: 'border-teal-300 bg-teal-50 text-teal-700 hover:border-teal-500 dark:border-teal-400/40 dark:bg-teal-500/10 dark:text-teal-300',
    pillOn: 'border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal-400 dark:bg-teal-400 dark:text-slate-950',
    text: 'text-teal-700 dark:text-teal-300',
  },
  fuchsia: {
    card: 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-fuchsia-400 dark:border-fuchsia-400/30 dark:from-fuchsia-500/10 dark:hover:border-fuchsia-400/70',
    icon: 'bg-gradient-to-br from-fuchsia-400 to-pink-600 text-white shadow-md shadow-fuchsia-500/25',
    badge: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300',
    pill: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 hover:border-fuchsia-500 dark:border-fuchsia-400/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-300',
    pillOn: 'border-fuchsia-600 bg-fuchsia-600 text-white shadow-sm dark:border-fuchsia-400 dark:bg-fuchsia-400 dark:text-slate-950',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
  emerald: {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-emerald-400 dark:border-emerald-400/30 dark:from-emerald-500/10 dark:hover:border-emerald-400/70',
    icon: 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-md shadow-emerald-500/25',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    pill: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300',
    pillOn: 'border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  orange: {
    card: 'border-orange-200 bg-gradient-to-br from-orange-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-orange-400 dark:border-orange-400/30 dark:from-orange-500/10 dark:hover:border-orange-400/70',
    icon: 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-orange-500/25',
    badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-300',
    pill: 'border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-500 dark:border-orange-400/40 dark:bg-orange-500/10 dark:text-orange-300',
    pillOn: 'border-orange-600 bg-orange-600 text-white shadow-sm dark:border-orange-400 dark:bg-orange-400 dark:text-slate-950',
    text: 'text-orange-700 dark:text-orange-300',
  },
  rose: {
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-rose-400 dark:border-rose-400/30 dark:from-rose-500/10 dark:hover:border-rose-400/70',
    icon: 'bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-md shadow-rose-500/25',
    badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300',
    pill: 'border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-500 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-300',
    pillOn: 'border-rose-600 bg-rose-600 text-white shadow-sm dark:border-rose-400 dark:bg-rose-400 dark:text-slate-950',
    text: 'text-rose-700 dark:text-rose-300',
  },
  indigo: {
    card: 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-[var(--bg-card)] to-[var(--bg-card)] hover:border-indigo-400 dark:border-indigo-400/30 dark:from-indigo-500/10 dark:hover:border-indigo-400/70',
    icon: 'bg-gradient-to-br from-indigo-400 to-indigo-700 text-white shadow-md shadow-indigo-500/25',
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300',
    pill: 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-500 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-300',
    pillOn: 'border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-400 dark:bg-indigo-400 dark:text-slate-950',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
}

const CATEGORY_HUE: Record<string, keyof typeof PALETTE> = {
  Statistics: 'sky',
  Mathematics: 'violet',
  'Data Science': 'teal',
  'Machine Learning': 'fuchsia',
  Analytics: 'emerald',
  Programming: 'orange',
  Research: 'rose',
}

export function categoryColor(category?: string | null): CategoryColor {
  return PALETTE[CATEGORY_HUE[category ?? ''] ?? 'indigo']
}

/** Rotating colours for lists that have no category (values, sectors, expertise areas). */
const ROTATION = ['sky', 'violet', 'emerald', 'orange', 'fuchsia', 'teal', 'rose', 'indigo'] as const

export function rotatingColor(index: number): CategoryColor {
  return PALETTE[ROTATION[index % ROTATION.length]]
}
