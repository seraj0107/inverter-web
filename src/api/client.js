import axios from 'axios'
import appConfig from '../config/app.config.js'
import { setupInterceptors } from './interceptors.js'

const client = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.requestTimeout,
  headers: { 'Content-Type': 'application/json' },
})

setupInterceptors(client)

export default client
