/**
 * Headline-style Title Case for headings: "Statistical, mathematical and data science consulting"
 * → "Statistical, Mathematical and Data Science Consulting".
 *
 * - Short function words (and, of, the, in, …) stay lowercase unless they start the title or
 *   follow a colon/dash.
 * - Words that already contain capitals or digits (SGT, SQL, R, B.Sc., PCA, X̄, k-Means) are kept as written.
 * - Hyphenated words capitalise each part ("Time-Series", "Least-Squares").
 * - Inline TeX segments ($…$) are left untouched.
 */
const SMALL = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via', 'with',
])

function capitalise(word: string): string {
  return word.replace(/^(\p{L})/u, (c) => c.toUpperCase())
}

const stripPunct = (s: string) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')

function caseWord(word: string, forceCap: boolean): string {
  const core = stripPunct(word)
  if (!core) return word
  if (!forceCap && !word.includes('-') && SMALL.has(core.toLowerCase())) return word.toLowerCase()
  return word
    .split('-')
    .map((part) => {
      const c = stripPunct(part)
      // Keep acronyms and mixed-case words as written (SQL, SGT, B.Sc., k-NN parts with internal capitals).
      if (/[\p{Lu}\p{N}]/u.test(c.slice(1))) return part
      return capitalise(part)
    })
    .join('-')
}

export function titleCase(text: string): string {
  return text
    .split(/(\$[^$]*\$)/g)
    .map((segment, si) => {
      if (segment.startsWith('$') && segment.endsWith('$') && segment.length > 1) return segment
      const words = segment.split(/(\s+)/)
      let wordIndex = 0
      return words
        .map((w, i) => {
          if (/^\s+$/.test(w) || !w) return w
          const prev = words.slice(0, i).join('').trimEnd()
          const first = si === 0 && wordIndex === 0
          const afterBreak = /[:—–]$/.test(prev)
          wordIndex++
          return caseWord(w, first || afterBreak)
        })
        .join('')
    })
    .join('')
}

/** Title-case a heading if it is a plain string; leave elements untouched. */
export function tc<T>(value: T): T | string {
  return typeof value === 'string' ? titleCase(value) : value
}
