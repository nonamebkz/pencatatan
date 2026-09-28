import { getApiBase } from '@/api/config'
import { clearStoredToken, getStoredToken } from '@/api/auth'
import { clearStoredWorkspaceId, resolveWorkspaceId } from '@/lib/workspace-storage'

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
  /** Kirim header X-Workspace-ID (default true jika auth). */
  workspace?: boolean
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
    const useWorkspace = init?.workspace !== false
    if (useWorkspace) {
      headers['X-Workspace-ID'] = resolveWorkspaceId()
    }
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  })

  let payload: ApiResponse<T>
  if (response.status === 204 || response.status === 205) {
    payload = { success: true, data: null as T }
  } else {
    const text = await response.text()
    if (!text) {
      payload = { success: response.ok, data: null as T }
    } else {
      payload = JSON.parse(text) as ApiResponse<T>
    }
  }
  if (!response.ok) {
    if (response.status === 401 && useAuth) {
      clearStoredToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    if (response.status === 403 && payload.error?.code === 'WORKSPACE_FORBIDDEN') {
      clearStoredWorkspaceId()
      if (window.location.pathname !== '/login') {
        window.location.href = '/'
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
