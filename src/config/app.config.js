import env from './env.js'

export const appConfig = {
  name: 'Inverter',
  apiBaseUrl: env.API_BASE_URL,
  requestTimeout: 30000,
  defaultTheme: 'light',
  storagePrefix: 'inverter',
}

export default appConfig
