import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, FileText, Plus } from 'lucide-react'

import { listRentContracts, type PeriodicContract } from '@/api/rent'
import { RentContractCard } from '@/components/finance/RentContractCard'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { ShortcutLinkCard } from '@/components/shared/ShortcutLinkCard'
import { Button } from '@/components/ui/button'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout } from '@/lib/design'

export function RentListPage() {
  const { canPageAction } = useCatalogAccess()
  const canCreate = canPageAction('page.finance.rent', 'create')
  const canReport = canPageAction('page.finance.reports', 'read')
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
      <div className="space-y-2">
        <BackLink to="/finance" label="Keuangan" shortLabel="Keuangan" />
        <PageHeader
          title="Sewa kolam"
          description="Kontrak per kolam dengan jadwal cicilan otomatis."
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
      </div>

      {canReport && (
        <ShortcutLinkCard
          to="/finance/reports/rent"
          title="Laporan sewa"
          description="Tunggakan dan status kontrak"
          icon={BarChart3}
        />
      )}

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <section className="space-y-3">
        <MobileSectionHeader title="Daftar kontrak" />
        {loading ? (
          <ListSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada kontrak sewa"
            description="Buat kontrak untuk mencatat komitmen sewa kolam dan jadwal bayarnya."
            action={
              canCreate ? (
                <Button asChild className="w-full touch-target sm:w-auto">
                  <Link to="/finance/rent/new">Kontrak baru</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <RentContractCard key={item.id} contract={item} />
            ))}
          </div>
        )}
      </section>

      {canCreate && <MobileListFab to="/finance/rent/new" ariaLabel="Kontrak sewa baru" />}
    </PageShell>
  )
}
