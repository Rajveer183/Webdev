import { createContext } from 'react'

export interface HeadData {
  title: string
  description: string
  type: 'website' | 'article'
  noindex: boolean
  canonical: string
  jsonLd: string
}

/** Provided only during prerendering: usePageMeta writes the page's head tags here synchronously. */
export const HeadContext = createContext<{ head: HeadData | null } | null>(null)
