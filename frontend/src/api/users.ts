import { api } from '@/api/client'
import type { RoleSummary } from '@/api/auth'

export type UserRole = 'ADMIN' | 'USER'

export type UserRecord = {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
  roleIds: string[]
  roles: RoleSummary[]
}

export type UserInput = {
  email: string
  name: string
  roleIds: string[]
  isActive: boolean
  password?: string
}

export function listUsers() {
  return api.get<UserRecord[]>('/users')
}

export function getUser(id: string) {
  return api.get<UserRecord>(`/users/${id}`)
}

export function createUser(body: UserInput & { password: string }) {
  return api.post<UserRecord>('/users', body)
}

export function updateUser(id: string, body: Omit<UserInput, 'password'>) {
  return api.put<UserRecord>(`/users/${id}`, body)
}

export function setUserRoles(id: string, roleIds: string[]) {
  return api.put<UserRecord>(`/users/${id}/roles`, { roleIds })
}

export function resetUserPassword(id: string, password: string) {
  return api.put<{ message: string }>(`/users/${id}/reset-password`, { password })
}

export function deleteUser(id: string) {
  return api.delete(`/users/${id}`)
}
