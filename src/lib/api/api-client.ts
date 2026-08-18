import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken } from '@/lib/auth'
import { env } from '@/lib/env'

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean
}

export const apiClient = axios.create({
  baseURL: env.apiGatewayBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._authRetry) {
      throw error
    }

    originalRequest._authRetry = true
    const token = await getAccessToken(true)

    if (!token) {
      throw error
    }

    originalRequest.headers.Authorization = `Bearer ${token}`
    return apiClient(originalRequest)
  },
)
