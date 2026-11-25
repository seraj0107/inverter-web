import { getToken, removeToken } from '../utils/token.js'
import { routePaths } from '../routes/routePaths.js'

export function setupInterceptors(client) {
  client.interceptors.request.use(
    (config) => {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        removeToken()
        if (window.location.pathname !== routePaths.login) {
          window.location.assign(routePaths.login)
        }
      }
      return Promise.reject(error)
    },
  )
}
