import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getTransaction, purchaseCategoryLabels, transactionTypeLabel, type Transaction } from '@/api/finance'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pageLayout, skeleton } from '@/lib/design'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

export function TransactionDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Transaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getTransaction(id)
      .then((response) => setItem(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat transaksi'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <PageShell className={pageLayout.detail}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className={cn(skeleton.block, 'h-64')} />
      </PageShell>
    )
  }

  if (error || !item) {
    return (
      <PageShell className={pageLayout.detail}>
        <ErrorAlert>{error ?? 'Transaksi tidak ditemukan'}</ErrorAlert>
        <Button asChild variant="outline">
          <Link to="/finance">Kembali ke keuangan</Link>
        </Button>
      </PageShell>
    )
  }

  const isPurchase = item.transactionType === 'PURCHASE'

  return (
    <PageShell className={pageLayout.detail}>
      <BackLink to="/finance" label="Kembali ke keuangan" />

      <PageHeader
        title={transactionTypeLabel(item.transactionType)}
        description={`${item.transactionDate} · ${item.cashAccountName ?? 'Kas'}`}
      />

      <PanelCard contentClassName="space-y-3 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Nominal</span>
          <span className="font-semibold text-destructive">-{formatIDR(item.amount)}</span>
        </div>
        {item.businessUnitName && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Kolam</span>
            <span className="text-right font-medium">{item.businessUnitName}</span>
          </div>
        )}
        {item.category && !isPurchase && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Kategori</span>
            <span className="font-medium">{item.category}</span>
          </div>
        )}
        {item.description && (
          <div>
            <p className="text-muted-foreground">Keterangan</p>
            <p className="mt-1">{item.description}</p>
          </div>
        )}
      </PanelCard>

      {isPurchase && (
        <PanelCard title="Barang" className="overflow-hidden" contentClassName="p-0">
          <ul className="divide-y">
            {(item.items ?? []).map((line) => (
              <li key={line.id} className="space-y-1 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{line.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {purchaseCategoryLabels[line.category]} · {line.qty} {line.unit} × {formatIDR(line.unitPrice)}
                    </p>
                    {line.supplierName && (
                      <p className="text-xs text-muted-foreground">Supplier: {line.supplierName}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatIDR(line.totalPrice)}</p>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}
    </PageShell>
  )
}
