import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Droplets, FlaskConical, Pencil } from 'lucide-react'

import { getWaterQualityLog, type WaterQualityLog } from '@/api/water-quality'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { WaterQualityAdvicePanel } from '@/components/water-quality/WaterQualityAdvicePanel'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout, skeleton } from '@/lib/design'
import { formatDateTime } from '@/lib/format'

export function WaterQualityDetailPage() {
  const { id = '' } = useParams()
  const { canPageAction } = useCatalogAccess()
  const canUpdate = canPageAction('page.water_quality.form', 'update')
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
      <PageShell className={pageLayout.detail}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className={`${skeleton.block} h-64`} />
      </PageShell>
    )
  }

  if (error || !log) {
    return (
      <PageShell className={pageLayout.detail}>
        <ErrorAlert>{error ?? 'Catatan tidak ditemukan'}</ErrorAlert>
        <Button asChild variant="outline">
          <Link to="/water-quality">Kembali ke daftar</Link>
        </Button>
      </PageShell>
    )
  }

  return (
    <PageShell className={pageLayout.detail}>
      <BackLink to="/water-quality" label="Kembali ke catatan kualitas air" />

      <PageHeader
        title={log.businessUnitName ?? 'Catatan kualitas air'}
        description={formatDateTime(log.measuredAt)}
        actions={
          canUpdate ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={`/water-quality/${log.id}/edit`}>
                <Pencil className="size-4" />
                Ubah
              </Link>
            </Button>
          ) : undefined
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
    </PageShell>
  )
}
