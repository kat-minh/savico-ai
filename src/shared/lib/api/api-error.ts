import type { ApiError } from '@/shared/types'
import { AxiosError } from 'axios'

/**
 * Normalize any thrown value (Axios error, network failure, unknown) into our
 * stable {@link ApiError} shape so feature code never has to inspect Axios
 * internals.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    // Server responded with a non-2xx status.
    if (error.response) {
      const data = error.response.data as
        | { message?: string; code?: string; errors?: Record<string, string[]> }
        | undefined

      return {
        status: error.response.status,
        code: data?.code,
        message: data?.message ?? defaultMessageForStatus(error.response.status),
        errors: data?.errors
      }
    }

    // Request made but no response (timeout / network / CORS).
    return {
      status: 0,
      code: error.code,
      message:
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Please try again.'
          : 'Network error. Check your connection and try again.'
    }
  }

  return {
    status: 0,
    message: error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The request was invalid.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return "You don't have permission to perform this action."
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'This action conflicts with the current state.'
    case 422:
      return 'Please review the highlighted fields.'
    case 429:
      return 'Too many requests. Please slow down.'
    default:
      return status >= 500
        ? 'Our servers are having trouble. Please try again later.'
        : 'Something went wrong. Please try again.'
  }
}

/** Type guard for narrowing an unknown error to {@link ApiError}. */
export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'status' in value && 'message' in value
}
