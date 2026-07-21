import { API_CONFIG } from '@/shared/config/api.config'
import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { normalizeApiError } from './api-error'
import { onUnauthorized, refreshSession } from './auth-bridge'

/**
 * The single Axios instance used by every feature's API layer.
 * It is the ONLY way the frontend talks to the external .NET REST API.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  headers: { ...API_CONFIG.headers }
})

/* ---------------------------------------------------------------------------
 * REQUEST INTERCEPTOR
 * Attach per-request context (locale, correlation id placeholder). Auth is
 * cookie-based (httpOnly) and handled by the browser, so no token header is
 * set here — wire one in if the backend switches to bearer tokens.
 * ------------------------------------------------------------------------ */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof document !== 'undefined') {
      // Forward the active UI locale so the backend can localize responses.
      const locale = document.documentElement.lang
      if (locale) config.headers.set('Accept-Language', locale)
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ---------------------------------------------------------------------------
 * RESPONSE INTERCEPTOR
 * Unwrap successful responses and centralize error handling, including a
 * single-flight refresh-token retry on 401.
 * ------------------------------------------------------------------------ */

// Tracks the in-flight refresh so concurrent 401s wait for one refresh call.
let refreshPromise: Promise<boolean> | null = null

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/**
 * Endpoints that must NOT trigger the refresh-retry flow. A 401 from
 * `/auth/login` means bad credentials (not an expired session), and the
 * refresh/logout endpoints would otherwise fire a pointless refresh.
 */
const REFRESH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

function isRefreshExempt(url: string | undefined): boolean {
  return Boolean(url) && REFRESH_EXEMPT_PATHS.some((p) => url!.includes(p))
}

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as RetryableConfig | undefined
    const status = error?.response?.status

    // Attempt one transparent refresh + retry on expired session. Auth
    // endpoints are exempt so a login failure never masquerades as a session
    // expiry.
    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshExempt(originalRequest.url)) {
      originalRequest._retry = true

      // Single-flight: concurrent 401s share one refresh call. `onUnauthorized`
      // is invoked inside this chain so it fires exactly ONCE per refresh
      // cycle, not once per waiting request.
      refreshPromise ??= refreshSession()
        .then((refreshed) => {
          if (!refreshed) onUnauthorized()
          return refreshed
        })
        .finally(() => {
          refreshPromise = null
        })

      const refreshed = await refreshPromise
      if (refreshed) {
        return httpClient(originalRequest)
      }
    }

    return Promise.reject(normalizeApiError(error))
  }
)
