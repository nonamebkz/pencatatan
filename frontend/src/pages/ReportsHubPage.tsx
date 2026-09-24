import { BarChart3, FileText, History, PieChart, Waves } from 'lucide-react'

import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { BackLink } from '@/components/shared/BackLink'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { ShortcutLinkCard } from '@/components/shared/ShortcutLinkCard'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'

const financeReports = [
  {
    slug: 'purchases',
    title: 'Pembelian barang',
    description: 'Detail baris pembelian per periode',
    icon: FileText,
  },
  {
    slug: 'price-history',
    title: 'Histori harga',
    description: 'Perubahan harga satuan per barang',
    icon: History,
  },
  {
    slug: 'rent',
    title: 'Sewa kolam',
    description: 'Kontrak, dibayar, dan sisa tunggakan',
    icon: BarChart3,
    rent: true,
  },
  {
    slug: 'summary',
    title: 'Ringkasan operasional',
    description: 'Agregat pengeluaran dan kategori',
    icon: PieChart,
  },
]

export function ReportsHubPage() {
  const { canPageAction, canViewPageId } = useCatalogAccess()
  const canFinance = canPageAction('page.finance.home', 'read')
  const canRent = canPageAction('page.finance.rent', 'read')
  const canWqReport = canViewPageId('page.water_quality.report')

  const visible = financeReports.filter((c) => (c.rent ? canRent : canFinance))

  return (
    <PageShell>
      <div className="space-y-2">
        <BackLink to="/finance" label="Keuangan" shortLabel="Keuangan" />
        <PageHeader title="Laporan" description="Laporan keuangan dan operasional workspace bisnis." />
      </div>

      {visible.length > 0 && (
        <section className="space-y-3">
          <MobileSectionHeader title="Keuangan & operasional" />
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((card) => (
              <ShortcutLinkCard
                key={card.slug}
                to={`/finance/reports/${card.slug}`}
                title={card.title}
                description={card.description}
                icon={card.icon}
              />
            ))}
          </div>
        </section>
      )}

      {canWqReport && (
        <section className="space-y-3">
          <MobileSectionHeader title="Kualitas air" />
          <ShortcutLinkCard
            to="/water-quality/report"
            title="Tren kualitas air"
            description="Grafik ammonia dan pH (7 atau 30 hari)"
            icon={Waves}
          />
        </section>
      )}

      {visible.length === 0 && !canWqReport && (
        <p className="text-sm text-muted-foreground">Tidak ada laporan yang dapat diakses dengan peran Anda.</p>
      )}
    </PageShell>
  )
}
