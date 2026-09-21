import { api } from '@/api/client'

export type WaterQualityStatus = 'NORMAL' | 'WARNING' | 'DANGER'

export type Pond = {
  id: string
  name: string
  location?: string
  size?: string
  ownerName?: string
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
}

export type WaterQualityLog = {
  id: string
  businessUnitId: string
  businessUnitName?: string
  batchId?: string
  measuredAt: string
  ammoniaPpm?: number
  ph?: number
  notes?: string
  status: WaterQualityStatus
  createdAt: string
  updatedAt: string
}

export type WaterQualitySummary = {
  businessUnitId: string
  businessUnitName: string
  lastMeasuredAt?: string
  ammoniaPpm?: number
  ph?: number
  status: WaterQualityStatus
  notMeasuredToday: boolean
}

export type WaterQualityInput = {
  businessUnitId: string
  measuredAt: string
  ammoniaPpm?: number
  ph?: number
  notes?: string
}

export function listPonds(status?: string) {
  const query = status ? `?status=${status}` : ''
  return api.get<Pond[]>(`/ponds${query}`)
}

export function createPond(body: Pick<Pond, 'name' | 'location' | 'notes'>) {
  return api.post<Pond>('/ponds', body)
}

export function getPond(id: string) {
  return api.get<Pond>(`/ponds/${id}`)
}

export function listWaterQualityLogs(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  })
  const query = search.toString()
  return api.get<WaterQualityLog[]>(`/water-quality-logs${query ? `?${query}` : ''}`)
}

export function getWaterQualityLog(id: string) {
  return api.get<WaterQualityLog>(`/water-quality-logs/${id}`)
}

export function createWaterQualityLog(body: WaterQualityInput) {
  return api.post<WaterQualityLog>('/water-quality-logs', body)
}

export function updateWaterQualityLog(id: string, body: WaterQualityInput) {
  return api.put<WaterQualityLog>(`/water-quality-logs/${id}`, body)
}

export function deleteWaterQualityLog(id: string) {
  return api.delete(`/water-quality-logs/${id}`)
}

export function getWaterQualityTrends(businessUnitId?: string, days = 7) {
  const search = new URLSearchParams({ days: String(days) })
  if (businessUnitId) search.set('businessUnitId', businessUnitId)
  return api.get<{ points: Array<{ measuredAt: string; ammoniaPpm?: number; ph?: number; status: WaterQualityStatus }> }>(
    `/water-quality-logs/trends?${search.toString()}`,
  )
}

export function getDashboardSummary() {
  return api.get<{ waterQualitySummary: WaterQualitySummary[] }>('/dashboard')
}

export function getWaterQualityReport(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  })
  const query = search.toString()
  return api.get<{
    logs: WaterQualityLog[]
    trends: Array<{ measuredAt: string; ammoniaPpm?: number; ph?: number; status: WaterQualityStatus }>
    notMeasuredToday: WaterQualitySummary[]
  }>(`/reports/water-quality${query ? `?${query}` : ''}`)
}
