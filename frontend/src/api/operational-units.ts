import { api } from '@/api/client'

export type OperationalUnitStatus = 'ACTIVE' | 'INACTIVE'

export type OperationalUnit = {
  id: string
  workspaceId: string
  name: string
  location?: string
  notes?: string
  status: OperationalUnitStatus
  createdAt: string
  updatedAt: string
}

export type OperationalUnitInput = {
  name: string
  location?: string
  notes?: string
  status?: OperationalUnitStatus
}

export async function listOperationalUnits(status?: OperationalUnitStatus) {
  const query = status ? `?status=${status}` : ''
  return api.get<OperationalUnit[]>(`/operational-units${query}`)
}

export async function getOperationalUnit(id: string) {
  return api.get<OperationalUnit>(`/operational-units/${id}`)
}

export async function createOperationalUnit(body: OperationalUnitInput) {
  return api.post<OperationalUnit>('/operational-units', body)
}

export async function updateOperationalUnit(id: string, body: Partial<OperationalUnitInput>) {
  return api.put<OperationalUnit>(`/operational-units/${id}`, body)
}

export async function deleteOperationalUnit(id: string) {
  return api.delete(`/operational-units/${id}`)
}
