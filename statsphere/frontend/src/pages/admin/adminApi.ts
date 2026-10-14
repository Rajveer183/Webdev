import { ApiError, clearCache, request } from '../../services/api'

const KEY = 'statsphere-admin-token'

/** The token lives in sessionStorage: it is cleared when the browser tab closes. */
export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },
}

export async function adminRequest<T>(path: string, opts: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; form?: FormData } = {}) {
  try {
    const { data } = await request<T>(`/api/admin${path}`, { ...opts, token: tokenStore.get() })
    if (opts.method && opts.method !== 'GET') clearCache() // public pages should reflect admin edits
    return data
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      tokenStore.clear()
      window.dispatchEvent(new Event('statsphere-admin-logout'))
    }
    throw err
  }
}

export async function login(username: string, password: string) {
  const { data } = await request<{ access_token: string }>('/api/admin/login', { method: 'POST', body: { username, password } })
  tokenStore.set(data.access_token)
}

export interface EnquiryRow {
  id: number
  reference: string
  type: string
  status: string
  name: string
  email: string
  phone: string | null
  organisation: string | null
  preferred_contact: string
  subject: string | null
  message: string | null
  details: Record<string, unknown>
  admin_notes: string | null
  notification_status: string
  created_at: string
}

export interface CatalogueRow {
  kind: string
  slug: string
  title: string
  category: string | null
  level: string | null
  status: string
  availability: string | null
  featured: boolean
  order: number
  updated_at: string
}

export interface TopicRow {
  id: string
  name: string
  origin: string
  status: string
  review_note: string | null
  ingestion_run_id: number | null
  data: Record<string, unknown> & { source_pages?: number[]; syllabus_code?: string | null; semester?: number | null; description?: string }
  updated_at: string
}

export interface IngestionRun {
  id: number
  filename: string
  sha256: string
  page_count: number
  modules_found: number
  warnings: string[]
  created_at: string
}
