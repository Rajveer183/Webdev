import { lazy, Suspense } from 'react'

const MathInline = lazy(() => import('./Math').then((m) => ({ default: m.MathInline })))

/** Renders text with inline TeX segments written as $...$ (KaTeX is loaded only when needed). */
export function RichText({ text }: { text: string }) {
  if (!text.includes('$')) return <>{text}</>
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('$') && part.endsWith('$') && part.length > 2 ? (
          <Suspense key={i} fallback={<code className="text-[0.9em]">{part.slice(1, -1)}</code>}>
            <MathInline tex={part.slice(1, -1)} />
          </Suspense>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
