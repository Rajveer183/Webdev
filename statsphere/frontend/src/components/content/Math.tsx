import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

function render(tex: string, displayMode: boolean) {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' })
  } catch {
    return null
  }
}

export function MathInline({ tex }: { tex: string }) {
  const html = useMemo(() => render(tex, false), [tex])
  if (!html) return <code>{tex}</code>
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export function MathBlock({ tex, caption }: { tex: string; caption?: string | null }) {
  const html = useMemo(() => render(tex, true), [tex])
  return (
    <figure className="my-6 rounded-xl border border-line bg-surface-2/70 px-4 py-3">
      {html ? <div className="text-ink" dangerouslySetInnerHTML={{ __html: html }} /> : <pre>{tex}</pre>}
      {caption && <figcaption className="mt-1 text-center text-xs text-subtle">{caption}</figcaption>}
    </figure>
  )
}
