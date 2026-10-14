import { ArrowUpRight, BookOpen, Briefcase, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Related } from '../../types/content'

const GROUPS = [
  { key: 'services', title: 'Related Consulting', base: '/services', icon: Briefcase },
  { key: 'courses', title: 'Related Courses', base: '/courses', icon: GraduationCap },
  { key: 'articles', title: 'Further Reading', base: '/knowledge', icon: BookOpen },
] as const

export function RelatedLinks({ related, hide = [] }: { related: Related; hide?: (keyof Related)[] }) {
  const groups = GROUPS.filter((g) => !hide.includes(g.key) && related[g.key].length > 0)
  if (!groups.length) return null
  return (
    <div className="card divide-y divide-line">
      {groups.map(({ key, title, base, icon: I }) => (
        <nav key={key} aria-label={title} className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <I className="h-4 w-4 text-subtle" aria-hidden /> {title}
          </h2>
          <ul className="mt-3 space-y-2">
            {related[key].map((r) => (
              <li key={r.slug}>
                <Link to={`${base}/${r.slug}`} className="group flex items-start justify-between gap-2 text-sm text-muted hover:text-ink">
                  <span>{r.title}</span>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  )
}
