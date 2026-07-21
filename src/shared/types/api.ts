/**
 * Transport-level contracts shared across every feature's API layer.
 * Mirror the envelope shape returned by the .NET backend here so features
 * never re-declare it.
 */

/** Standard success envelope. */
export interface ApiResponse<TData = unknown> {
  data: TData
  message?: string
  success: boolean
}

/** Normalized error shape produced by the response interceptor. */
export interface ApiError {
  /** HTTP status code, or 0 for network/timeout failures. */
  status: number
  /** Machine-readable error code from the backend, when available. */
  code?: string
  /** Human-readable message (already localized server-side or generic). */
  message: string
  /** Field-level validation errors keyed by field name. */
  errors?: Record<string, string[]>
}

/** Cursor/page metadata returned by paginated list endpoints. */
export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

/** A page of results plus its metadata. */
export interface PaginatedResponse<TItem> {
  items: TItem[]
  meta: PaginationMeta
}

/** Query parameters accepted by paginated list endpoints. */
export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
