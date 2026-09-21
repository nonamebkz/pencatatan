import { useCallback, useEffect, useState } from 'react'
import { Activity, Database, RefreshCw, Server } from 'lucide-react'

import { fetchHealth, type HealthData } from '@/api/health'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

function statusBadgeVariant(status: string): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'ok') return 'success'
  if (status === 'degraded') return 'warning'
  return 'destructive'
}

export function HomePage() {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [health, setHealth] = useState<HealthData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadHealth = useCallback(async () => {
    setLoadState('loading')
    setErrorMessage(null)

    try {
      const response = await fetchHealth()
      setHealth(response.data)
      setLoadState(response.success ? 'ready' : 'error')
    } catch (error) {
      setHealth(null)
      setLoadState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat health check')
    }
  }, [])

  useEffect(() => {
    void loadHealth()
  }, [loadHealth])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Pencatatan Usaha</p>
        <h1 className="text-4xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Halaman awal aplikasi dengan health check API (Fiber + MySQL) dan frontend React + shadcn/ui.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Status Sistem
            </CardTitle>
            <CardDescription>Data diambil dari endpoint `/health` backend.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadHealth()} disabled={loadState === 'loading'}>
            <RefreshCw className={`size-4 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadState === 'loading' && (
            <p className="text-sm text-muted-foreground">Memeriksa koneksi API dan database...</p>
          )}

          {loadState === 'error' && !health && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage ?? 'Health check gagal'}
            </div>
          )}

          {health && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Server className="size-4" />
                  API
                </div>
                <Badge variant={statusBadgeVariant(health.status)}>{health.status}</Badge>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="size-4" />
                  MySQL
                </div>
                <Badge variant={health.db === 'ok' ? 'success' : 'destructive'}>{health.db}</Badge>
              </div>
            </div>
          )}

          {health?.checks && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="mb-2 text-sm font-medium">Detail checks</p>
              <dl className="grid gap-2 text-sm">
                {Object.entries(health.checks).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-mono text-xs">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
