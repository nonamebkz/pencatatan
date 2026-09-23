import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Droplets, FlaskConical, Pencil } from 'lucide-react'

import { getWaterQualityLog, type WaterQualityLog } from '@/api/water-quality'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { WaterQualityAdvicePanel } from '@/components/water-quality/WaterQualityAdvicePanel'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'

export function WaterQualityDetailPage() {
  const { id = '' } = useParams()
  const [log, setLog] = useState<WaterQualityLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWaterQualityLog(id)
      .then((response) => setLog(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <ErrorAlert>{error ?? 'Catatan tidak ditemukan'}</ErrorAlert>
        <Button asChild variant="outline">
          <Link to="/water-quality">Kembali ke daftar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <BackLink to="/water-quality" label="Kembali ke catatan kualitas air" />

      <PageHeader
        title={log.businessUnitName ?? 'Catatan kualitas air'}
        description={formatDateTime(log.measuredAt)}
        actions={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to={`/water-quality/${log.id}/edit`}>
              <Pencil className="size-4" />
              Ubah
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <WaterQualityStatusBadge status={log.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PanelCard title="Ammonia" contentClassName="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FlaskConical className="size-4" />
            <span className="text-xs">ppm</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{log.ammoniaPpm ?? '—'}</p>
        </PanelCard>
        <PanelCard title="pH" contentClassName="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="size-4" />
            <span className="text-xs">skala</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{log.ph ?? '—'}</p>
        </PanelCard>
      </div>

      {log.notes && (
        <PanelCard title="Catatan lapangan" contentClassName="p-4 text-sm text-muted-foreground">
          {log.notes}
        </PanelCard>
      )}

      <WaterQualityAdvicePanel advice={log.advice} status={log.status} />
    </div>
  )
}
