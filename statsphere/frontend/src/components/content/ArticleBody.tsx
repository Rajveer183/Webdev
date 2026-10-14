import { titleCase } from '../../lib/titleCase'
import { Calculator, Lightbulb } from 'lucide-react'
import type { ArticleBlock } from '../../types/content'
import { MathBlock } from './Math'
import { RichText } from './RichText'

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/\$[^$]*\$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="text-[1.02rem] leading-8 text-muted">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return (
              <h2 key={i} id={slugifyHeading(b.text)} className="mt-10 mb-3 scroll-mt-24 text-xl font-semibold tracking-tight text-ink">
                <RichText text={titleCase(b.text)} />
              </h2>
            )
          case 'paragraph':
            return (
              <p key={i} className="my-4">
                <RichText text={b.text} />
              </p>
            )
          case 'formula':
            return <MathBlock key={i} tex={b.tex} caption={b.caption} />
          case 'list':
            return (
              <ul key={i} className="my-4 list-disc space-y-2 pl-6 marker:text-subtle">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <RichText text={it} />
                  </li>
                ))}
              </ul>
            )
          case 'table':
            return (
              <div key={i} className="my-6 overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="bg-surface-2 text-ink">
                    <tr>
                      {b.columns.map((c) => (
                        <th key={c} scope="col" className="px-4 py-2.5 font-semibold">
                          <RichText text={c} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {b.rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2.5 align-top">
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'callout':
            return (
              <aside key={i} className="my-8 rounded-2xl border border-accent/25 bg-accent-soft/60 p-5">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Lightbulb className="h-4 w-4 text-accent" aria-hidden /> {titleCase(b.title)}
                </p>
                <p className="mt-2 text-[0.97rem] leading-7">
                  <RichText text={b.text} />
                </p>
              </aside>
            )
          case 'example':
            return (
              <section key={i} className="my-8 rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Calculator className="h-4 w-4 text-brand" aria-hidden /> {titleCase(b.title)}
                </p>
                {b.text && (
                  <p className="mt-2 text-[0.97rem] leading-7">
                    <RichText text={b.text} />
                  </p>
                )}
                {b.steps.length > 0 && (
                  <ol className="mt-3 list-decimal space-y-2 pl-6 text-[0.97rem] leading-7 marker:font-semibold marker:text-subtle">
                    {b.steps.map((s, j) => (
                      <li key={j}>
                        <RichText text={s} />
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
