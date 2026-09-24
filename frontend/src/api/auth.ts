import { api } from '@/api/client'

const TOKEN_KEY = 'pencatatan_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export type UserRole = 'ADMIN' | 'USER'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type RoleSummary = {
  id?: string
  code: string
  name: string
}

export type AuthSession = {
  user: AuthUser
  permissions: string[]
  roles: RoleSummary[]
}

export type LoginResponse = AuthSession & {
  token: string
  expiresAt: string
}

export async function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password }, { auth: false })
}

export async function logout() {
  try {
    await api.post<{ message: string }>('/auth/logout', {})
  } finally {
    clearStoredToken()
  }
}

export async function fetchMe() {
  return api.get<AuthSession>('/auth/me')
}
