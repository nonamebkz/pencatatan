import { api } from '@/api/client'

export type WorkspaceType = 'BUSINESS' | 'PERSONAL'

export type Workspace = {
  id: string
  name: string
  type: WorkspaceType
  templateId: string
  createdAt: string
  updatedAt: string
}

export async function listWorkspaces() {
  return api.get<Workspace[]>('/workspaces', { workspace: false })
}

/** Semua workspace — untuk form assign pengguna (butuh `user.assign_workspace`). */
export async function listAllWorkspaces() {
  return api.get<Workspace[]>('/workspaces/all', { workspace: false })
}

export type CreateWorkspaceInput = {
  name: string
  type: WorkspaceType
  templateId?: string
}

export async function createWorkspace(body: CreateWorkspaceInput) {
  return api.post<Workspace>('/workspaces', body, { workspace: false })
}

export async function updateWorkspace(id: string, name: string) {
  return api.put<Workspace>(`/workspaces/${id}`, { name }, { workspace: false })
}

export async function deleteWorkspace(id: string) {
  return api.delete(`/workspaces/${id}`, { workspace: false })
}
