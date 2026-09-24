import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'

import {
  listRentContracts,
  paymentSchemeLabel,
  paymentStatusLabel,
  timeStatusLabel,
  type PeriodicContract,
} from '@/api/rent'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout } from '@/lib/design'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

function statusBadgeVariant(time: PeriodicContract['timeStatus'], pay: PeriodicContract['paymentStatus']) {
  if (pay === 'PAID') return 'secondary'
  if (time === 'ENDED') return 'outline'
  if (time === 'EXPIRING' || pay === 'PARTIAL') return 'default'
  return 'outline'
}

export function RentListPage() {
  const { canPageAction } = useCatalogAccess()
  const canCreate = canPageAction('page.finance.rent', 'create')
  const [items, setItems] = useState<PeriodicContract[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listRentContracts()
      .then((res) => setItems(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kontrak sewa'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell className={pageLayout.detailLg}>
      <BackLink to="/finance" label="Kembali ke keuangan" />

      <PageHeader
        title="Sewa kolam"
        description="Kontrak sewa per kolam dengan jadwal cicilan otomatis."
        actions={
          canCreate ? (
            <Button asChild size="lg" className="hidden md:inline-flex">
              <Link to="/finance/rent/new">
                <Plus className="size-4" />
                Kontrak baru
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={3} className="h-28 rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada kontrak sewa"
          description="Buat kontrak untuk mencatat komitmen sewa kolam dan jadwal bayarnya."
          action={
            canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to="/finance/rent/new">Kontrak baru</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <PanelCard key={item.id} title={item.businessUnitName ?? 'Kolam'} contentClassName="p-0">
              <Link
                to={`/finance/rent/${item.id}`}
                className="block space-y-3 px-4 py-4 transition hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant(item.timeStatus, item.paymentStatus)}>
                    {timeStatusLabel[item.timeStatus]}
                  </Badge>
                  <Badge variant="outline">{paymentStatusLabel[item.paymentStatus]}</Badge>
                  <span className="text-xs text-muted-foreground">{paymentSchemeLabel[item.paymentScheme]}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.startDate} — {item.endDate} · {item.durationMonths} bulan
                </p>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>
                    Total <span className="font-semibold tabular-nums">{formatIDR(item.totalAmount)}</span>
                  </span>
                  <span className={cn(item.remainingAmount > 0 && 'text-destructive')}>
                    Sisa{' '}
                    <span className="font-semibold tabular-nums">{formatIDR(item.remainingAmount)}</span>
                  </span>
                </div>
              </Link>
            </PanelCard>
          ))}
        </div>
      )}

      {canCreate && <MobileListFab to="/finance/rent/new" ariaLabel="Kontrak sewa baru" />}
    </PageShell>
  )
}
