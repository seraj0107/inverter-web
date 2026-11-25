const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

console.log("env", API_BASE_URL)

export const VERSION_TYPES = [
  { value: 'GEPL', label: 'GEPL' },
  { value: 'GSPL', label: 'GSPL' },
]

export const APP_VERSIONS = {
  GEPL: import.meta.env.VITE_VERSION_GEPL || 'GEPL',
  GSPL: import.meta.env.VITE_VERSION_GSPL || 'GSPL',
}

const configuredVersion = import.meta.env.VITE_DEFAULT_VERSION_TYPE
export const DEFAULT_VERSION_TYPE = VERSION_TYPES.some(
  (item) => item.value === configuredVersion,
)
  ? configuredVersion
  : VERSION_TYPES[0].value

export const env = {
  API_BASE_URL,
  DEFAULT_VERSION_TYPE,
  APP_VERSIONS,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
}

export default env
