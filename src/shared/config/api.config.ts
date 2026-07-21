import { env } from './env'

/**
 * Central API configuration. Consumed by the Axios instance and the
 * TanStack Query client. All values trace back to validated env vars.
 */
export const API_CONFIG = {
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: env.NEXT_PUBLIC_API_TIMEOUT,
  // Send/receive auth cookies set by the .NET backend (refresh token flow).
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
} as const
