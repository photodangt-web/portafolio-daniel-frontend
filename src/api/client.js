import axios from 'axios'

const LOCAL_API_URL = 'http://localhost:7070/api/v1'
const PROD_API_URL = 'https://apiportafolio.lionsoftgt.site/api/v1'

function isLocalHost() {
  const host = globalThis.location?.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

function getApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()
  const fallback = isLocalHost() ? LOCAL_API_URL : PROD_API_URL

  try {
    return new URL(configuredUrl || fallback).toString().replace(/\/$/, '')
  } catch {
    return fallback
  }
}

export const apiUrl = getApiUrl()

export const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  withCredentials: true,
})

apiClient.interceptors.response.use((response) => {
  const body = response.data
  return body?.success === true && 'data' in body ? body.data : body
})

let authRetryHandlers = null
let refreshRequest = null

export function configureAuthRetry(handlers) {
  authRetryHandlers = handlers
}

apiClient.interceptors.request.use((config) => {
  const token = authRetryHandlers?.getAccessToken?.()
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }
  return config
})

apiClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config
  const isAuthRequest = /\/auth\/(login|refresh|logout)/.test(request?.url || '')

  if (
    error.response?.status !== 401 ||
    request?._retriedAfterRefresh ||
    request?.skipAuthRefresh ||
    isAuthRequest ||
    !authRetryHandlers
  ) {
    return Promise.reject(error)
  }

  request._retriedAfterRefresh = true

  try {
    refreshRequest ??= authRetryHandlers.refreshAccessToken()
    const token = await refreshRequest
    request.headers = { ...request.headers, Authorization: `Bearer ${token}` }
    return apiClient(request)
  } catch (refreshError) {
    authRetryHandlers.onSessionExpired?.()
    return Promise.reject(refreshError)
  } finally {
    refreshRequest = null
  }
})

export function resolveMediaUrl(value) {
  if (!value) return ''

  try {
    return new URL(value, new URL(apiUrl).origin).toString()
  } catch {
    return value
  }
}
