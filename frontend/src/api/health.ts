import { getHealthUrl } from '@/api/config'

export type HealthData = {
  status: string
  db: string
  checks?: Record<string, string>
}

export type HealthResponse = {
  success: boolean
  data: HealthData
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(getHealthUrl())

  const payload = (await response.json()) as HealthResponse

  if (!response.ok) {
    return payload
  }

  return payload
}
