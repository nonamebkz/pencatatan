import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Droplets, Fish, MapPin, Plus } from 'lucide-react'

import { getPond, listWaterQualityLogs, type Pond, type WaterQualityLog } from '@/api/water-quality'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert, PanelCard } from '@/components/shared/PanelCard'
import { WaterQualityLogRow } from '@/components/water-quality/WaterQualityLogRow'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function PondDetailPage() {
  const { id = '' } = useParams()
  const [pond, setPond] = useState<Pond | null>(null)
  const [logs, setLogs] = useState<WaterQualityLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getPond(id), listWaterQualityLogs({ businessUnitId: id, limit: 20 })])
      .then(([pondResponse, logsResponse]) => {
        setPond(pondResponse.data)
        setLogs(logsResponse.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat detail kolam'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (error || !pond) {
    return <ErrorAlert>{error ?? 'Kolam tidak ditemukan'}</ErrorAlert>
  }

  const isActive = pond.status === 'ACTIVE'

  return (
    <div className="space-y-6 md:space-y-8">
      <Button asChild variant="ghost" className="-ml-1 h-auto px-1 py-1 text-sm hover:bg-transparent sm:px-0">
        <Link to="/ponds">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Kembali ke daftar kolam</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
      </Button>

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-background p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 rounded-2xl bg-primary p-2.5 text-primary-foreground shadow-sm sm:p-3">
                <Fish className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{pond.name}</h2>
                <p className="mt-1 inline-flex items-start gap-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  {pond.location || 'Lokasi belum diisi'}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground',
              )}
            >
              Status {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
            {pond.notes && <p className="max-w-2xl text-sm text-muted-foreground">{pond.notes}</p>}
          </div>

          <Button asChild size="lg" className="w-full lg:w-auto">
            <Link to={`/water-quality/new?pondId=${pond.id}`}>
              <Plus className="size-4" />
              Catat Kualitas Air
            </Link>
          </Button>
        </div>
      </section>

      <PanelCard title="Riwayat Kualitas Air" description="Semua observasi ammonia, pH, dan catatan untuk kolam ini.">
        {logs.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Belum ada catatan"
            description="Mulai catat kualitas air untuk kolam ini."
            action={
              <Button asChild>
                <Link to={`/water-quality/new?pondId=${pond.id}`}>Catat Sekarang</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <WaterQualityLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </PanelCard>
    </div>
  )
}
