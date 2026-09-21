import { api } from '@/api/client'
import type { AuthUser, UserRole } from '@/api/auth'

export type UserInput = {
  email: string
  name: string
  role: UserRole
  isActive: boolean
  password?: string
}

export function listUsers() {
  return api.get<AuthUser[]>('/users')
}

export function getUser(id: string) {
  return api.get<AuthUser>(`/users/${id}`)
}

export function createUser(body: UserInput & { password: string }) {
  return api.post<AuthUser>('/users', body)
}

export function updateUser(id: string, body: Omit<UserInput, 'password'>) {
  return api.put<AuthUser>(`/users/${id}`, body)
}

export function resetUserPassword(id: string, password: string) {
  return api.put<{ message: string }>(`/users/${id}/reset-password`, { password })
}

export function deleteUser(id: string) {
  return api.delete(`/users/${id}`)
}
