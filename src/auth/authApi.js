import axios from 'axios'
import { apiClient, apiUrl } from '../api/client'

let accessToken = null

const sessionClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  withCredentials: true,
})

function unwrap(body) {
  return body?.success === true && 'data' in body ? body.data : body
}

function tokenFrom(payload) {
  return payload?.accessToken || payload?.access_token || payload?.token || null
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

export async function login(credentials) {
  const payload = await apiClient.post('/auth/login', credentials)
  accessToken = tokenFrom(payload)
  return payload
}

export async function refreshAccessToken() {
  const response = await sessionClient.post('/auth/refresh')
  const token = tokenFrom(unwrap(response.data))
  if (!token) throw new Error('La renovación de sesión no devolvió un access token.')
  accessToken = token
  return token
}

export async function getCurrentUser(options = {}) {
  const payload = await apiClient.get('/auth/me', options)
  return payload?.user || payload
}

export async function logout() {
  try {
    await sessionClient.post('/auth/logout')
  } finally {
    clearAccessToken()
  }
}
