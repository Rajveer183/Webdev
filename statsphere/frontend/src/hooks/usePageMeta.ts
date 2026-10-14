import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { brand } from '../config/brand'
import { HeadContext } from './headContext'

interface PageMeta {
  title: string
  description: string
  type?: 'website' | 'article'
  noindex?: boolean
  /** schema.org JSON-LD object(s) describing this page. Only include accurate facts. */
  jsonLd?: object | object[]
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

/** Sets title, description, canonical, Open Graph/Twitter tags and JSON-LD for the current page. */
export function usePageMeta({ title, description, type = 'website', noindex, jsonLd }: PageMeta) {
  const { pathname } = useLocation()
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''
  const ssr = useContext(HeadContext)
  if (ssr) {
    // Prerendering: effects do not run on the server, so record the tags for the HTML template.
    ssr.head = {
      title: title === brand.name ? title : `${title} · ${brand.shortName}`,
      description,
      type,
      noindex: !!noindex,
      canonical: brand.siteUrl ? `${brand.siteUrl}${pathname}` : '',
      jsonLd: ld,
    }
  }

  useEffect(() => {
    const fullTitle = title === brand.name ? title : `${title} · ${brand.shortName}`
    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    const url = brand.siteUrl ? `${brand.siteUrl}${pathname}` : ''
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (url) {
      setMeta('property', 'og:url', url)
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = url
    }

    let script = document.getElementById('page-jsonld')
    if (ld) {
      if (!script) {
        script = document.createElement('script')
        script.id = 'page-jsonld'
        script.setAttribute('type', 'application/ld+json')
        document.head.appendChild(script)
      }
      script.textContent = ld
    } else if (script) {
      script.remove()
    }
  }, [title, description, type, noindex, ld, pathname])
}
