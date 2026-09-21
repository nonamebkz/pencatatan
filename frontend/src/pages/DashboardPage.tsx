import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'

import { getDashboardSummary, type WaterQualitySummary } from '@/api/water-quality'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function formatDateTime(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function DashboardPage() {
  const [summaries, setSummaries] = useState<WaterQualitySummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboardSummary()
      .then((response) => setSummaries(response.data.waterQualitySummary ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Ringkasan kualitas air per kolam aktif.</p>
        </div>
        <Button asChild>
          <Link to="/water-quality/new">
            <Plus className="size-4" />
            Catat Kualitas Air
          </Link>
        </Button>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      {summaries.length === 0 && !error ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada kolam aktif</CardTitle>
            <CardDescription>Tambah kolam dulu, lalu catat ammonia, pH, dan catatan observasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/ponds">Kelola Kolam</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((summary) => (
            <Card key={summary.businessUnitId}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{summary.businessUnitName}</CardTitle>
                    <CardDescription>Terakhir diukur: {formatDateTime(summary.lastMeasuredAt)}</CardDescription>
                  </div>
                  <WaterQualityStatusBadge status={summary.status} />
                </div>
                {summary.notMeasuredToday && (
                  <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle className="size-4" />
                    Belum diukur hari ini
                  </div>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Ammonia</p>
                  <p className="font-medium">{summary.ammoniaPpm ?? '-'} ppm</p>
                </div>
                <div>
                  <p className="text-muted-foreground">pH</p>
                  <p className="font-medium">{summary.ph ?? '-'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
