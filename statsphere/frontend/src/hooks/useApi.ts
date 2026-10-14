import { useCallback, useEffect, useState } from 'react'
import { ApiError, cachedGet, isStale, peekCache, revalidate } from '../services/api'

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
  reload: () => void
}

const toApiError = (e: unknown) => (e instanceof ApiError ? e : new ApiError(0, 'error', 'Something went wrong.'))

/**
 * Fetch a public GET endpoint with a shared in-memory cache. Pass null to skip.
 * Data embedded by the prerenderer is used for the first render (so hydration matches
 * the server HTML) and then refreshed once from the live API.
 */
export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | undefined>(() => (path ? peekCache<T>(path) : undefined))
  const [error, setError] = useState<ApiError>()
  const [loading, setLoading] = useState<boolean>(() => (path ? peekCache(path) === undefined : false))
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!path) return
    let active = true
    const cached = peekCache<T>(path)
    if (cached !== undefined && nonce === 0) {
      setData(cached)
      setLoading(false)
      setError(undefined)
      if (isStale(path)) {
        revalidate<T>(path)
          .then((fresh) => active && setData(fresh))
          .catch((e: unknown) => {
            // Content unpublished since the build shows the not-found state; transient errors keep the snapshot.
            if (active && e instanceof ApiError && e.status === 404) setError(e)
          })
      }
      return () => {
        active = false
      }
    }
    setLoading(true)
    setError(undefined)
    cachedGet<T>(path)
      .then((d) => active && setData(d))
      .catch((e: unknown) => active && setError(toApiError(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [path, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, loading, reload }
}
