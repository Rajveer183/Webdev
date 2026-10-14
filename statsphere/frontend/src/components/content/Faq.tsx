import { ChevronDown } from 'lucide-react'

/** Accessible accordion built on <details>/<summary> (keyboard and screen-reader friendly by default). */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium text-ink hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-subtle transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="px-6 pb-6 text-[0.95rem] leading-7 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  }
}
