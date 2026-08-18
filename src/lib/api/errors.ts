import axios from 'axios'
import type { ApiErrorPayload } from '@/lib/types'

export type ApiClientError = {
  message: string
  details?: string[]
  statusCode?: number
}

export function toApiClientError(error: unknown): ApiClientError {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return {
      message: error instanceof Error ? error.message : 'Unexpected error',
    }
  }

  const payload = error.response?.data
  const message = payload?.message ?? error.message

  return {
    message: Array.isArray(message) ? message[0] : message || 'Request failed',
    details: Array.isArray(message) ? message : undefined,
    statusCode: error.response?.status ?? payload?.statusCode,
  }
}

export function apiErrorDescription(error: unknown): string | undefined {
  const normalized = toApiClientError(error)
  return normalized.details && normalized.details.length > 0
    ? normalized.details.join('\n')
    : normalized.statusCode
      ? `HTTP ${normalized.statusCode}`
      : undefined
}
