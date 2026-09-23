import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Filter } from 'lucide-react'

import { listPonds, getWaterQualityTrends, type Pond } from '@/api/water-quality'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { SelectField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { WaterQualityTrendChart } from '@/components/water-quality/WaterQualityTrendChart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { skeleton } from '@/lib/design'

export function WaterQualityReportPage() {
  const [ponds, setPonds] = useState<Pond[]>([])
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [days, setDays] = useState('7')
  const [points, setPoints] = useState<Array<{ measuredAt: string; ammoniaPpm?: number; ph?: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTrends = () => {
    setLoading(true)
    setError(null)
    getWaterQualityTrends(businessUnitId || undefined, Number(days))
      .then((response) => setPoints(response.data.points ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat tren'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    listPonds('ACTIVE').then((response) => setPonds(response.data)).catch(() => undefined)
    loadTrends()
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Laporan Kualitas Air"
        description="Grafik tren ammonia dan pH (RPT-07) — periode 7 atau 30 hari."
        actions={
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link to="/water-quality">Daftar catatan</Link>
          </Button>
        }
      />

      <MobileFilterPanel title="Filter tren" description="Kolam dan rentang hari" onApply={loadTrends} applyLabel="Muat grafik">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Kolam"
            id="trend-pond"
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
          <SelectField label="Periode" id="trend-days" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 hari</option>
            <option value="30">30 hari</option>
          </SelectField>
        </div>
      </MobileFilterPanel>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className={`h-48 ${skeleton.block}`} />
          <Skeleton className={`h-48 ${skeleton.block}`} />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <MobileSectionHeader
              title="Ammonia (ppm)"
              action={
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <BarChart3 className="size-3.5" />
                  {days} hari
                </span>
              }
            />
            <WaterQualityTrendChart points={points} metric="ammonia" />
          </section>
          <section className="space-y-3">
            <MobileSectionHeader title="pH" />
            <WaterQualityTrendChart points={points} metric="ph" />
          </section>
        </div>
      )}

      <Button asChild variant="outline" className="w-full md:hidden">
        <Link to="/water-quality">
          <Filter className="size-4" />
          Kembali ke daftar catatan
        </Link>
      </Button>
    </PageShell>
  )
}
