export type HealthData = {
  status: string
  db: string
  checks?: Record<string, string>
}

export type HealthResponse = {
  success: boolean
  data: HealthData
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`)

  const payload = (await response.json()) as HealthResponse

  if (!response.ok) {
    return payload
  }

  return payload
}
