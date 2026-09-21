import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getPond, listWaterQualityLogs, type Pond, type WaterQualityLog } from '@/api/water-quality'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PondDetailPage() {
  const { id = '' } = useParams()
  const [pond, setPond] = useState<Pond | null>(null)
  const [logs, setLogs] = useState<WaterQualityLog[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPond(id), listWaterQualityLogs({ businessUnitId: id, limit: 20 })])
      .then(([pondResponse, logsResponse]) => {
        setPond(pondResponse.data)
        setLogs(logsResponse.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat detail kolam'))
  }, [id])

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!pond) {
    return <p className="text-sm text-muted-foreground">Memuat detail kolam...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{pond.name}</h2>
          <p className="text-sm text-muted-foreground">{pond.location || 'Lokasi belum diisi'} · Status {pond.status}</p>
        </div>
        <Button asChild>
          <Link to={`/water-quality/new?pondId=${pond.id}`}>Catat Kualitas Air</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kualitas Air</CardTitle>
          <CardDescription>Tab riwayat untuk kolam ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada catatan kualitas air.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.measuredAt))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ammonia {log.ammoniaPpm ?? '-'} ppm · pH {log.ph ?? '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <WaterQualityStatusBadge status={log.status} />
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/water-quality/${log.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
