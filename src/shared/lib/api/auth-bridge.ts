import { useAuthStore } from '@/shared/auth/auth.store'
import { API_CONFIG } from '@/shared/config/api.config'
import axios from 'axios'

/**
 * Thin bridge between the HTTP client and the auth layer.
 *
 * Kept separate from `http-client.ts` to avoid an import cycle and to keep the
 * refresh-token flow a single, swappable placeholder. Replace the endpoint
 * paths below once the .NET refresh contract is finalized.
 */

/**
 * Attempt to refresh the session using the httpOnly refresh cookie.
 * Uses a bare axios call (NOT `httpClient`) to avoid recursing through the
 * 401 interceptor.
 *
 * @returns `true` if the session was refreshed, `false` otherwise.
 */
export async function refreshSession(): Promise<boolean> {
  try {
    await axios.post(
      '/auth/refresh',
      {},
      {
        baseURL: API_CONFIG.baseURL,
        withCredentials: true,
        timeout: API_CONFIG.timeout
      }
    )
    return true
  } catch {
    // TODO: integrate real refresh contract / error reporting.
    return false
  }
}

/** Called when the session is irrecoverable — clear client auth state. */
export function onUnauthorized(): void {
  useAuthStore.getState().reset()
}
