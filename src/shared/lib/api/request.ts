import type { ApiResponse } from '@/shared/types'
import type { AxiosRequestConfig } from 'axios'
import { httpClient } from './http-client'

/**
 * Thin typed helpers over {@link httpClient} that unwrap the backend's
 * `ApiResponse<T>` envelope and return `T` directly.
 *
 * Feature API modules build on these so call sites get fully-typed payloads
 * without repeating `.data.data`.
 */
export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await httpClient.get<ApiResponse<T>>(url, config)
    return res.data.data
  },
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await httpClient.post<ApiResponse<T>>(url, body, config)
    return res.data.data
  },
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await httpClient.put<ApiResponse<T>>(url, body, config)
    return res.data.data
  },
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const res = await httpClient.patch<ApiResponse<T>>(url, body, config)
    return res.data.data
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await httpClient.delete<ApiResponse<T>>(url, config)
    return res.data.data
  }
}
