import { STORAGE_KEYS } from './constants.js'

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token)
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.token, token)
}

export function removeToken() {
  localStorage.removeItem(STORAGE_KEYS.token)
}
