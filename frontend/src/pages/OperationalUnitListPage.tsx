import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'

import { listOperationalUnits, type OperationalUnit } from '@/api/operational-units'
import { CountBadge } from '@/components/shared/CountBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { skeleton } from '@/lib/design'
import { cn } from '@/lib/utils'

export function OperationalUnitListPage() {
  const { canPageAction } = useCatalogAccess()
  const canCreate = canPageAction('page.operational_units.form', 'create')
  const [units, setUnits] = useState<OperationalUnit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listOperationalUnits()
      .then((response) => setUnits(response.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat unit'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Unit"
        description="Kelola lokasi atau cabang untuk mengelompokkan pembelian."
        actions={
          canCreate ? (
            <Button asChild size="lg" className="hidden md:inline-flex">
              <Link to="/operational-units/new">
                <Plus className="size-4" />
                Tambah unit
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="flex justify-end">
        <CountBadge>{units.length} unit</CountBadge>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className={`${skeleton.block} h-32`} />
          ))}
        </div>
      ) : units.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada unit"
          description="Tambah unit pertama untuk mengaitkan transaksi keuangan."
          action={
            canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to="/operational-units/new">Tambah unit</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {units.map((unit) => (
            <Link key={unit.id} to={`/operational-units/${unit.id}`} className="block">
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{unit.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {unit.location && <p>{unit.location}</p>}
                  <p
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      unit.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {unit.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {canCreate && <MobileListFab to="/operational-units/new" ariaLabel="Tambah unit" />}
    </PageShell>
  )
}
