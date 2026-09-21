import { getApiBase } from '@/api/config'
import { clearStoredToken, getStoredToken } from '@/api/auth'

export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<T> = {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  error?: ApiError
}

type RequestOptions = RequestInit & {
  auth?: boolean
}

async function request<T>(path: string, init?: RequestOptions): Promise<ApiResponse<T>> {
  const useAuth = init?.auth !== false
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }

  if (useAuth) {
    const token = getStoredToken()
    if (token) headers.Authorization = `Bearer ${token}`
    headers['X-Workspace-ID'] = '00000000-0000-4000-8000-000000000001'
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  })

  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok) {
    if (response.status === 401 && useAuth) {
      clearStoredToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw new Error(payload.error?.message ?? 'Permintaan gagal')
  }
  return payload
}

export const api = {
  get: <T>(path: string, init?: RequestOptions) => request<T>(path, init),
  post: <T>(path: string, body: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown, init?: RequestOptions) =>
    request<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string, init?: RequestOptions) => request<null>(path, { ...init, method: 'DELETE' }),
}
