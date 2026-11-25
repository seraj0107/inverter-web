export const STORAGE_KEYS = {
  token: 'inverter.token',
  user: 'inverter.user',
  theme: 'inverter.theme',
  dashboardCache: 'inverter.dashboard.cache',
  dashboardFetchedAt: 'inverter.dashboard.fetchedAt',
}

export const ROLES = {
  user: 'user',
  admin: 'admin',
}

export const FETCH_INTERVAL_MS = 10 * 60 * 1000

export const CACHED_DATA_KEY = STORAGE_KEYS.dashboardCache
export const LAST_FETCH_KEY = STORAGE_KEYS.dashboardFetchedAt
