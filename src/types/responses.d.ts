/**
 * API response types and utilities
 */

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiSuccess<T = unknown> {
  data: T
  message?: string
  meta?: {
    count?: number
    page?: number
    limit?: number
    total_pages?: number
  }
}

export type ApiResult<T = unknown> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError }

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number>
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface FilterParams {
  search?: string
  category?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface QueryParams extends PaginationParams, FilterParams {}
