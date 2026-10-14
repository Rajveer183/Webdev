/**
 * Minimal typed fetch client for the FastAPI backend.
 * Errors follow the backend envelope: { error: { code, message, details? } }.
 */

const BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/$/, '')

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  code: string
  details: FieldError[]
  retryAfter?: number

  constructor(status: number, code: string, message: string, details: FieldError[] = [], retryAfter?: number) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.retryAfter = retryAfter
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
  signal?: AbortSignal
  form?: FormData
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: opts.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError(0, 'network_error', 'We could not reach the server. Check your connection and try again.')
  }

  const text = await res.text()
  let json: unknown = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
  }

  if (!res.ok) {
    const env = (json as { error?: { code?: string; message?: string; details?: FieldError[] } } | null)?.error
    const retry = Number(res.headers.get('Retry-After')) || undefined
    throw new ApiError(
      res.status,
      env?.code ?? 'error',
      env?.message ?? (res.status >= 500 ? 'Something went wrong on our side.' : 'Request failed.'),
      Array.isArray(env?.details) ? env!.details : [],
      retry,
    )
  }
  return { status: res.status, data: json as T }
}

// ---------- GET cache shared by all pages (catalogue data rarely changes) ----------

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

/**
 * Paths whose cached value came from the build-time snapshot embedded in prerendered
 * HTML. They render immediately (matching the server HTML) and are refreshed once from
 * the live API after hydration, so admin edits made after the build still show up.
 */
const stale = new Set<string>()

/** Paths read during a server render, so the prerenderer embeds only the data each page used. */
let recorder: Set<string> | null = null

export function primeCache(data: Record<string, unknown>, { markStale = true } = {}) {
  for (const [path, value] of Object.entries(data)) {
    cache.set(path, value)
    if (markStale) stale.add(path)
  }
}

export function recordReads(): () => string[] {
  recorder = new Set()
  return () => {
    const paths = [...(recorder ?? [])]
    recorder = null
    return paths
  }
}

const revalidating = new Map<string, Promise<unknown>>()

export function isStale(path: string) {
  return stale.has(path) || revalidating.has(path)
}

/** Fetch fresh data for a snapshot-primed path and update the cache (one request per path). */
export function revalidate<T>(path: string): Promise<T> {
  const pending = revalidating.get(path)
  if (pending) return pending as Promise<T>
  stale.delete(path)
  const p = request<T>(path)
    .then(({ data }) => {
      cache.set(path, data)
      return data
    })
    .finally(() => setTimeout(() => revalidating.delete(path), 0))
  revalidating.set(path, p)
  return p
}

export function cachedGet<T>(path: string): Promise<T> {
  if (cache.has(path)) return Promise.resolve(cache.get(path) as T)
  const existing = inflight.get(path)
  if (existing) return existing as Promise<T>
  const p = request<T>(path)
    .then(({ data }) => {
      cache.set(path, data)
      return data
    })
    .finally(() => inflight.delete(path))
  inflight.set(path, p)
  return p
}

export function peekCache<T>(path: string): T | undefined {
  recorder?.add(path)
  return cache.get(path) as T | undefined
}

export function clearCache() {
  cache.clear()
  stale.clear()
}
