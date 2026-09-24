import { api } from '@/api/client'

export type Role = {
  id: string
  name: string
  code: string
  description?: string
  isSystem: boolean
  permissions?: string[]
}

export type Permission = {
  id: string
  name: string
  code: string
  resource: string
  action: string
  description?: string
}

export async function listRoles() {
  return api.get<Role[]>('/roles')
}

export type RoleCreateInput = {
  name: string
  code: string
  description?: string
  permissionIds: string[]
}

export async function createRole(body: RoleCreateInput) {
  return api.post<Role>('/roles', body)
}

export async function deleteRole(id: string) {
  return api.delete(`/roles/${id}`)
}

export async function getRole(id: string) {
  return api.get<Role>(`/roles/${id}`)
}

export async function updateRole(id: string, body: { name: string; description?: string }) {
  return api.put<Role>(`/roles/${id}`, body)
}

export async function setRolePermissions(id: string, permissionIds: string[]) {
  return api.put<Role>(`/roles/${id}/permissions`, { permissionIds })
}

export async function listPermissions() {
  return api.get<Permission[]>('/permissions')
}
