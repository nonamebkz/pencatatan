import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, Plus } from 'lucide-react'

import { listPonds, listWaterQualityLogs, type Pond, type WaterQualityLog } from '@/api/water-quality'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { WaterQualityLogRow } from '@/components/water-quality/WaterQualityLogRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function WaterQualityListPage() {
  const [ponds, setPonds] = useState<Pond[]>([])
  const [logs, setLogs] = useState<WaterQualityLog[]>([])
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadLogs = (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    listWaterQualityLogs({ businessUnitId, from, to, limit: 100 })
      .then((response) => setLogs(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    listPonds('ACTIVE').then((response) => setPonds(response.data)).catch(() => undefined)
    loadLogs()
  }, [])

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Kualitas Air"
        description="Catatan observasi ammonia, pH, dan catatan operasional."
        actions={
          <Button asChild size="lg" className="hidden md:inline-flex">
            <Link to="/water-quality/new">
              <Plus className="size-4" />
              Tambah Catatan
            </Link>
          </Button>
        }
      />

      <MobileFilterPanel
        title="Filter Catatan"
        description="Kolam dan rentang tanggal"
        onApply={() => loadLogs()}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 xl:col-span-1">
            <Label htmlFor="filter-pond">Kolam</Label>
            <Select id="filter-pond" value={businessUnitId} onChange={(e) => setBusinessUnitId(e.target.value)}>
              <option value="">Semua kolam</option>
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>
                  {pond.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-from">Dari</Label>
            <Input id="filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-to">Sampai</Label>
            <Input id="filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </MobileFilterPanel>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="space-y-4">
        <MobileSectionHeader
          title="Daftar Catatan"
          action={
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {logs.length} entri
            </span>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
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
              <WaterQualityLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
