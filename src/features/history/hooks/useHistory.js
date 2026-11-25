import { useCallback, useEffect, useState } from 'react'
import { historyService } from '../services/historyService.js'

const EMPTY_PAGINATION = {
  page: 1,
  limit: 20,
  totalRecords: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
}

function readPayload(payload) {
  if (!payload || payload.success === false) {
    throw new Error(payload?.message || 'Could not load history')
  }

  return {
    records: Array.isArray(payload.data) ? payload.data : [],
    pagination: { ...EMPTY_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Could not load history'
  )
}

export function useHistory({ page = 1, limit = 20 } = {}) {
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${page}:${limit}:${reloadKey}`
  const [state, setState] = useState(() => ({
    key: requestKey,
    records: [],
    pagination: { ...EMPTY_PAGINATION, page, limit },
    loading: true,
    error: '',
  }))

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  useEffect(() => {
    let active = true

    historyService
      .list({ page, limit })
      .then((payload) => {
        if (!active) return
        const next = readPayload(payload)
        setState({
          key: requestKey,
          records: next.records,
          pagination: next.pagination,
          loading: false,
          error: '',
        })
      })
      .catch((requestError) => {
        if (!active) return
        setState((current) => ({
          ...current,
          key: requestKey,
          loading: false,
          error: getErrorMessage(requestError),
        }))
      })

    return () => {
      active = false
    }
  }, [page, limit, reloadKey, requestKey])

  return {
    records: state.records,
    pagination: state.pagination,
    loading: state.key !== requestKey || state.loading,
    error: state.key === requestKey ? state.error : '',
    refresh,
  }
}
