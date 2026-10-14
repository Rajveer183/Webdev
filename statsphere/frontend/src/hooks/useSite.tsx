import { createContext, useContext, type ReactNode } from 'react'
import { brand } from '../config/brand'
import type { ContactSettings, SiteContent, SiteResponse } from '../types/content'
import { useApi } from './useApi'

interface SiteValue {
  name: string
  tagline: string
  contact: ContactSettings
  content: SiteContent | undefined
  bookingUrl: string
  showInstitutionLogo: boolean
  brandLogoUrl: string | null
  institutionLogoUrl: string
  loading: boolean
}

const EMPTY_CONTACT: ContactSettings = {
  email: null,
  phone: null,
  whatsapp: null,
  address: null,
  hours: null,
  booking_url: null,
  linkedin_url: null,
}

const SiteContext = createContext<SiteValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data, loading } = useApi<SiteResponse>('/api/site')
  const contact = data?.contact ?? EMPTY_CONTACT
  const value: SiteValue = {
    name: data?.brand.name || brand.name,
    tagline: data?.brand.tagline || brand.tagline,
    contact,
    content: data?.content,
    bookingUrl: contact.booking_url || brand.bookingUrl,
    showInstitutionLogo: data?.brand.show_institution_logo ?? brand.institution.showLogo,
    brandLogoUrl: data?.media?.brand_logo ?? null,
    institutionLogoUrl: data?.media?.institution_logo ?? brand.institution.logo,
    loading,
  }
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSite(): SiteValue {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>')
  return ctx
}
