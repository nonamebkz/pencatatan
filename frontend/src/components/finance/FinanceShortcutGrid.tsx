import { useMemo } from 'react'
import { BarChart3, FileText, Landmark, Receipt, type LucideIcon } from 'lucide-react'

import { ShortcutLinkCard } from '@/components/shared/ShortcutLinkCard'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'

type Shortcut = {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

export function FinanceShortcutGrid() {
  const { canViewPageId, canPageAction } = useCatalogAccess()

  const shortcuts = useMemo(() => {
    const items: Shortcut[] = []
    if (canPageAction('page.finance.expenses', 'create')) {
      items.push({
        to: '/finance/expenses/new',
        title: 'Pengeluaran lain',
        description: 'Beban operasional di luar pembelian',
        icon: Receipt,
      })
    }
    if (canViewPageId('page.finance.cash_accounts')) {
      items.push({
        to: '/finance/cash-accounts',
        title: 'Akun kas',
        description: 'Daftar kas untuk transaksi',
        icon: Landmark,
      })
    }
    if (canPageAction('page.finance.rent', 'read')) {
      items.push({
        to: '/finance/rent',
        title: 'Sewa kolam',
        description: 'Kontrak & jadwal pembayaran',
        icon: FileText,
      })
    }
    if (canPageAction('page.finance.reports', 'read')) {
      items.push({
        to: '/finance/reports',
        title: 'Laporan',
        description: 'Pembelian, harga, sewa, ringkasan',
        icon: BarChart3,
      })
    }
    return items
  }, [canPageAction, canViewPageId])

  if (shortcuts.length === 0) return null

  return (
    <section className="space-y-3">
      <MobileSectionHeader title="Kelola keuangan" />
      <div className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <ShortcutLinkCard key={item.to} {...item} />
        ))}
      </div>
    </section>
  )
}
