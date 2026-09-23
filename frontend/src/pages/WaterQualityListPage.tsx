import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, LineChart, Plus } from 'lucide-react'

import { listPonds, listWaterQualityLogs, deleteWaterQualityLog, type Pond, type WaterQualityLog } from '@/api/water-quality'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { EmptyState } from '@/components/shared/EmptyState'
import { CountBadge } from '@/components/shared/CountBadge'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { SelectField, TextField } from '@/components/shared/Field'
import { WaterQualityLogRow } from '@/components/water-quality/WaterQualityLogRow'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { RECORD_LIST_LIMIT } from '@/lib/listing'

export function WaterQualityListPage() {
  const { canDelete } = useAuth()
  const [ponds, setPonds] = useState<Pond[]>([])
  const [logs, setLogs] = useState<WaterQualityLog[]>([])
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null)

  const loadLogs = (opts?: { page?: number; append?: boolean; showLoading?: boolean }) => {
    const nextPage = opts?.page ?? 1
    const append = opts?.append ?? false
    const showLoading = opts?.showLoading ?? !append
    if (showLoading) setLoading(true)
    if (append) setLoadingMore(true)
    setError(null)
    listWaterQualityLogs({
      businessUnitId,
      from,
      to,
      page: nextPage,
      limit: RECORD_LIST_LIMIT,
    })
      .then((response) => {
        setTotal(Number(response.meta?.total ?? response.data.length))
        setPage(nextPage)
        setLogs((prev) => (append ? [...prev, ...response.data] : response.data))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }

  useEffect(() => {
    listPonds().then((response) => setPonds(response.data)).catch(() => undefined)
    loadLogs({ page: 1 })
  }, [])

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

  return (
    <PageShell>
      <PageHeader
        title="Kualitas Air"
        description="Catatan observasi ammonia, pH, dan catatan operasional."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/water-quality/report">
                <LineChart className="size-4" />
                Laporan tren
              </Link>
            </Button>
            <Button asChild size="lg" className="hidden w-full md:inline-flex md:w-auto">
              <Link to="/water-quality/new">
                <Plus className="size-4" />
                Tambah Catatan
              </Link>
            </Button>
          </div>
        }
      />

      <MobileFilterPanel title="Filter" onApply={() => loadLogs({ page: 1 })}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Kolam"
            id="filter-pond"
            value={businessUnitId}
            onChange={(e) => setBusinessUnitId(e.target.value)}
          >
            <option value="">Semua kolam</option>
            {ponds.map((pond) => (
              <option key={pond.id} value={pond.id}>
                {pond.name}
              </option>
            ))}
          </SelectField>
          <TextField label="Dari" id="filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField label="Sampai" id="filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </MobileFilterPanel>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="space-y-4">
        <div className="flex justify-end">
          <CountBadge>
            {logs.length}
            {total > logs.length ? ` / ${total}` : ''} entri
          </CountBadge>
        </div>

        {loading ? (
          <ListSkeleton count={3} className="h-28 rounded-2xl" />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Belum ada catatan"
            description="Tambah catatan kualitas air untuk mulai memantau kondisi kolam."
            action={
              <Button asChild className="w-full sm:w-auto">
                <Link to="/water-quality/new">Tambah Catatan</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <WaterQualityLogRow
                key={log.id}
                log={log}
                canDelete={canDelete}
                deleting={deletingLogId === log.id}
                onDelete={handleDeleteLog}
              />
            ))}
            {logs.length < total && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loadingMore}
                onClick={() => loadLogs({ page: page + 1, append: true })}
              >
                {loadingMore ? 'Memuat…' : 'Muat lebih banyak'}
              </Button>
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}
