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
  waterQualityConfig: WaterQualityConfig
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
  advice?: WaterQualityAdviceItem[]
  createdAt: string
  updatedAt: string
}

export type WaterQualityAdviceItem = {
  code: string
  title: string
  steps: string[]
}

export type WaterQualityConfig = {
  ammoniaWarnPpm: number
  ammoniaDangerPpm: number
  phMinNormal: number
  phMaxNormal: number
  ammoniaAnalyteNote: string
  advicePhLow: string[]
  advicePhHigh: string[]
  adviceAmmoniaWarn: string[]
  adviceAmmoniaDanger: string[]
}

export type WaterQualityEvaluation = {
  status: WaterQualityStatus
  advice: WaterQualityAdviceItem[]
}

export type WaterQualitySummary = {
  businessUnitId: string
  businessUnitName: string
  lastMeasuredAt?: string
  ammoniaPpm?: number
  ph?: number
  status: WaterQualityStatus
  advice?: WaterQualityAdviceItem[]
  notMeasuredToday: boolean
}

export type WaterQualityInput = {
  businessUnitId: string
  batchId?: string
  measuredAt: string
  ammoniaPpm?: number
  ph?: number
  notes?: string
}

export type Batch = {
  id: string
  name: string
  businessUnitId?: string
  status: 'ACTIVE' | 'COMPLETED'
}

export function listBatches(params?: { businessUnitId?: string; status?: string }) {
  const search = new URLSearchParams()
  if (params?.businessUnitId) search.set('businessUnitId', params.businessUnitId)
  if (params?.status) search.set('status', params.status)
  const query = search.toString()
  return api.get<Batch[]>(`/batches${query ? `?${query}` : ''}`)
}

export function listPonds(status?: string) {
  const query = status ? `?status=${status}` : ''
  return api.get<Pond[]>(`/ponds${query}`)
}

export type PondInput = {
  name: string
  location?: string
  notes?: string
  status?: Pond['status']
  waterQualityConfig?: WaterQualityConfig
}

export function createPond(body: PondInput) {
  return api.post<Pond>('/ponds', body)
}

export function updatePond(id: string, body: PondInput) {
  return api.put<Pond>(`/ponds/${id}`, body)
}

export function getPond(id: string) {
  return api.get<Pond>(`/ponds/${id}`)
}

export function deletePond(id: string) {
  return api.delete(`/ponds/${id}`)
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

export function getDashboardSummary() {
  return api.get<{ waterQualitySummary: WaterQualitySummary[] }>('/dashboard')
}

export function getWaterQualityConfig() {
  return api.get<WaterQualityConfig>('/water-quality/config')
}

export function updateWaterQualityConfig(body: WaterQualityConfig) {
  return api.put<WaterQualityConfig>('/water-quality/config', body)
}

export function evaluateWaterQuality(body: Pick<WaterQualityInput, 'businessUnitId' | 'ammoniaPpm' | 'ph'>) {
  return api.post<WaterQualityEvaluation>('/water-quality/evaluate', body)
}
