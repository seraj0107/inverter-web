import { useCallback, useEffect, useRef, useState } from 'react'
import { dashboardService } from '../services/dashboardService.js'
import {
  CACHED_DATA_KEY,
  FETCH_INTERVAL_MS,
  LAST_FETCH_KEY,
} from '../../../utils/constants.js'

function readCache() {
  try {
    const cached = localStorage.getItem(CACHED_DATA_KEY)
    const fetched = localStorage.getItem(LAST_FETCH_KEY)
    return {
      data: cached ? JSON.parse(cached) : null,
      fetchedAt: fetched ? Number(fetched) : null,
    }
  } catch {
    return { data: null, fetchedAt: null }
  }
}

export function useDashboard() {
  const [initial] = useState(readCache)
  const [data, setData] = useState(initial.data)
  const [loading, setLoading] = useState(!initial.data)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(initial.fetchedAt)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setRefreshing(true)
    try {
      setError(null)
      const response = await dashboardService.getSummary()
      const next = response?.data ?? response
      setData(next)
      const timestamp = Date.now()
      setFetchedAt(timestamp)
      localStorage.setItem(CACHED_DATA_KEY, JSON.stringify(next))
      localStorage.setItem(LAST_FETCH_KEY, String(timestamp))
    } catch (err) {
      setError(err?.message || 'Could not load dashboard')
    } finally {
      inFlight.current = false
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const kickoff = setTimeout(load, 0)
    const interval = setInterval(load, FETCH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    const onOnline = () => load()

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    return () => {
      clearTimeout(kickoff)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [load])

  return { data, loading, refreshing, error, fetchedAt, refresh: load }
}
