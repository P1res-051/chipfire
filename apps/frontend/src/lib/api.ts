import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

import { useAuthStore } from '@/features/auth/auth.store'

function getBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL
  return fromEnv || 'http://localhost:3000/api'
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken ?? localStorage.getItem('evo:accessToken')
  if (token) {
    if (!config.headers) {
      config.headers = {} as any
    }
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// refresh automático de access token quando expirar (401)
const authApi = axios.create({ baseURL: getBaseUrl(), withCredentials: false })
let refreshPromise: Promise<{ accessToken: string; refreshToken: string; role: any; mustChangePassword?: boolean }> | null = null

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status
    const original = error?.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!original) return Promise.reject(error)
    if (status !== 401) return Promise.reject(error)
    if (original._retry) return Promise.reject(error)

    // evita loops em endpoints de auth
    const url = String(original.url ?? '')
    if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      return Promise.reject(error)
    }

    const refreshToken = useAuthStore.getState().refreshToken ?? localStorage.getItem('evo:refreshToken')
    if (!refreshToken) {
      useAuthStore.getState().clear()
      return Promise.reject(error)
    }

    try {
      original._retry = true

      refreshPromise =
        refreshPromise ??
        authApi
          .post('/auth/refresh', { refreshToken })
          .then((res) => res.data as { accessToken: string; refreshToken: string; role: any; mustChangePassword?: boolean })
          .finally(() => {
            refreshPromise = null
          })

      const session = await refreshPromise
      useAuthStore.getState().setSession(session)

      if (!original.headers) {
        original.headers = {} as any
      }
      original.headers!['Authorization'] = `Bearer ${session.accessToken}`

      return api.request(original)
    } catch (e) {
      useAuthStore.getState().clear()
      return Promise.reject(e)
    }
  },
)
