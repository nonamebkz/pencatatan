export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api/v1'
}

export function getApiOrigin(): string {
  return getApiBase().replace(/\/api\/v1\/?$/, '')
}

export function getHealthUrl(): string {
  return `${getApiOrigin()}/health`
}
