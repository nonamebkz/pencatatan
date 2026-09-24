import { Link } from 'react-router-dom'
import { BarChart3, FileText, History, PieChart, Waves } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { interactive } from '@/lib/design'
import { cn } from '@/lib/utils'

const cards = [
  {
    slug: 'purchases',
    title: 'Pembelian barang',
    description: 'RPT-01 — detail baris pembelian per periode',
    icon: FileText,
    permission: 'finance.read' as const,
  },
  {
    slug: 'price-history',
    title: 'Histori harga',
    description: 'RPT-02 — tren harga per nama barang',
    icon: History,
    permission: 'finance.read' as const,
  },
  {
    slug: 'rent',
    title: 'Sewa kolam',
    description: 'RPT-03 — kontrak, dibayar, sisa tunggakan',
    icon: BarChart3,
    rent: true,
  },
  {
    slug: 'summary',
    title: 'Ringkasan operasional',
    description: 'RPT-06 — kartu agregat & per kategori',
    icon: PieChart,
    permission: 'finance.read' as const,
  },
]

export function ReportsHubPage() {
  const { canPageAction, canViewPageId } = useCatalogAccess()
  const canFinance = canPageAction('page.finance.home', 'read')
  const canRent = canPageAction('page.finance.rent', 'read')
  const canWqReport = canViewPageId('page.water_quality.report')

  const visible = cards.filter((c) => {
    if (c.rent) return canRent
    return canFinance
  })

  return (
    <PageShell>
      <PageHeader
        title="Laporan"
        description="Laporan keuangan dan operasional workspace bisnis."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.slug}
              to={`/finance/reports/${card.slug}`}
              className={cn(interactive.cardLink, 'flex gap-3')}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{card.title}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </Link>
          )
        })}
        {canWqReport && (
          <Link to="/water-quality/report" className={cn(interactive.cardLink, 'flex gap-3')}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Waves className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">Kualitas air</p>
              <p className="text-sm text-muted-foreground">RPT-07 — grafik tren 7/30 hari</p>
            </div>
          </Link>
        )}
      </div>

      {visible.length === 0 && !canWqReport && (
        <p className="text-sm text-muted-foreground">Tidak ada laporan yang dapat diakses dengan peran Anda.</p>
      )}
    </PageShell>
  )
}
