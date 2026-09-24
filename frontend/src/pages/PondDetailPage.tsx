import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Droplets, Fish, MapPin, Plus } from 'lucide-react'

import {
  deletePond,
  deleteWaterQualityLog,
  getPond,
  listWaterQualityLogs,
  type Pond,
  type WaterQualityLog,
} from '@/api/water-quality'
import { DeleteOutlineButton } from '@/components/shared/DeleteButton'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageShell } from '@/components/shared/PageShell'
import { WaterQualityLogRow } from '@/components/water-quality/WaterQualityLogRow'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { RECORD_LIST_LIMIT } from '@/lib/listing'
import { pageLayout, skeleton, statusTone } from '@/lib/design'
import { cn } from '@/lib/utils'

export function PondDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { canPageAction } = useCatalogAccess()
  const canDeletePond = canPageAction('page.ponds.detail', 'delete')
  const canUpdateLog = canPageAction('page.water_quality.form', 'update')
  const canDeleteLog = canPageAction('page.water_quality.form', 'delete')
  const canRecordWQ = canPageAction('page.water_quality.form', 'create')
  const [pond, setPond] = useState<Pond | null>(null)
  const [logs, setLogs] = useState<WaterQualityLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingPond, setDeletingPond] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [loadingMoreLogs, setLoadingMoreLogs] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getPond(id),
      listWaterQualityLogs({ businessUnitId: id, page: 1, limit: RECORD_LIST_LIMIT }),
    ])
      .then(([pondResponse, logsResponse]) => {
        setPond(pondResponse.data)
        setLogs(logsResponse.data)
        setLogsTotal(Number(logsResponse.meta?.total ?? logsResponse.data.length))
        setLogsPage(1)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat detail kolam'))
      .finally(() => setLoading(false))
  }, [id])

  const loadMoreLogs = () => {
    setLoadingMoreLogs(true)
    listWaterQualityLogs({ businessUnitId: id, page: logsPage + 1, limit: RECORD_LIST_LIMIT })
      .then((response) => {
        setLogs((prev) => [...prev, ...response.data])
        setLogsPage((p) => p + 1)
        setLogsTotal(Number(response.meta?.total ?? 0))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
      .finally(() => setLoadingMoreLogs(false))
  }

  const handleDeletePond = async () => {
    if (!pond) return
    setDeletingPond(true)
    setError(null)
    try {
      await deletePond(pond.id)
      navigate('/ponds', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kolam')
    } finally {
      setDeletingPond(false)
    }
  }

  const handleDeleteLog = async (log: WaterQualityLog) => {
    setDeletingLogId(log.id)
    setError(null)
    try {
      await deleteWaterQualityLog(log.id)
      setLogs((prev) => prev.filter((item) => item.id !== log.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus catatan')
    } finally {
      setDeletingLogId(null)
    }
  }

  if (loading) {
    return (
      <PageShell className={pageLayout.detailLg}>
        <Skeleton className={`${skeleton.block} h-40`} />
        <Skeleton className={`${skeleton.block} h-64`} />
      </PageShell>
    )
  }

  if (error && !pond) {
    return (
      <PageShell className={pageLayout.detailLg}>
        <ErrorAlert>{error}</ErrorAlert>
      </PageShell>
    )
  }

  if (!pond) {
    return (
      <PageShell className={pageLayout.detailLg}>
        <ErrorAlert>Kolam tidak ditemukan</ErrorAlert>
      </PageShell>
    )
  }

  const isActive = pond.status === 'ACTIVE'

  return (
    <PageShell className={pageLayout.detailLg}>
      <BackLink to="/ponds" label="Kembali ke daftar kolam" />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-background p-4 shadow-sm sm:p-6 md:p-8">
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
                isActive ? statusTone.success : statusTone.muted,
              )}
            >
              Status {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
            {pond.notes && <p className="max-w-2xl text-sm text-muted-foreground">{pond.notes}</p>}
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto">
            {canRecordWQ && (
              <Button asChild size="lg" className="w-full lg:w-auto">
                <Link to={`/water-quality/new?pondId=${pond.id}`}>
                  <Plus className="size-4" />
                  Catat Kualitas Air
                </Link>
              </Button>
            )}
            {canDeletePond && (
              <DeleteOutlineButton
                className="w-full lg:w-auto"
                disabled={deletingPond}
                confirmMessage={`Hapus kolam "${pond.name}"? Semua data terkait ikut terhapus: catatan kualitas air, batch, dan transaksi keuangan yang terhubung ke kolam ini.`}
                onConfirm={handleDeletePond}
              >
                {deletingPond ? 'Menghapus…' : 'Hapus Kolam'}
              </DeleteOutlineButton>
            )}
          </div>
        </div>
      </section>

      <PanelCard title="Riwayat Kualitas Air">
        {logs.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Belum ada catatan"
            description="Mulai catat kualitas air untuk kolam ini."
            action={
              canRecordWQ ? (
                <Button asChild>
                  <Link to={`/water-quality/new?pondId=${pond.id}`}>Catat Sekarang</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <WaterQualityLogRow
                key={log.id}
                log={log}
                canUpdate={canUpdateLog}
                canDelete={canDeleteLog}
                deleting={deletingLogId === log.id}
                onDelete={handleDeleteLog}
              />
            ))}
            {logs.length < logsTotal && (
              <Button type="button" variant="outline" className="w-full" disabled={loadingMoreLogs} onClick={loadMoreLogs}>
                {loadingMoreLogs ? 'Memuat…' : 'Muat lebih banyak'}
              </Button>
            )}
          </div>
        )}
      </PanelCard>
    </PageShell>
  )
}
