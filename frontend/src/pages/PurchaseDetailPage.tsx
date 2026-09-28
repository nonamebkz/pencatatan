import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'

import { deletePurchase, getPurchase, purchaseCategoryLabels, type Transaction } from '@/api/finance'
import { DeleteOutlineButton } from '@/components/shared/DeleteButton'
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
import { useCatalogAccess } from '@/hooks/useCatalogAccess'

export function PurchaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canPageAction } = useCatalogAccess()
  const canEdit = canPageAction('page.finance.purchases', 'update')
  const canDelete = canPageAction('page.finance.purchases', 'delete')
  const [item, setItem] = useState<Transaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getPurchase(id)
      .then((response) => setItem(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat pembelian'))
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
        <ErrorAlert>{error ?? 'Pembelian tidak ditemukan'}</ErrorAlert>
        <Button asChild variant="outline">
          <Link to="/finance">Kembali ke keuangan</Link>
        </Button>
      </PageShell>
    )
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    setError(null)
    try {
      await deletePurchase(id)
      navigate('/finance')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pembelian')
      setDeleting(false)
    }
  }

  return (
    <PageShell className={pageLayout.detail}>
      <BackLink to="/finance" label="Kembali ke keuangan" />

      <PageHeader
        title="Detail Pembelian"
        description={`${item.transactionDate} · ${item.cashAccountName ?? 'Kas'}`}
        actions={
          (canEdit || canDelete) && id
            ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                  {canEdit && (
                    <Button asChild size="lg" className="w-full md:w-auto">
                      <Link to={`/finance/purchases/${id}/edit`}>
                        <Pencil className="size-4" />
                        Ubah catatan
                      </Link>
                    </Button>
                  )}
                  {canDelete && (
                    <DeleteOutlineButton
                      className="w-full md:w-auto"
                      disabled={deleting}
                      confirmMessage="Hapus pembelian ini beserta semua baris nota? Tindakan tidak dapat dibatalkan."
                      onConfirm={handleDelete}
                    >
                      {deleting ? 'Menghapus…' : 'Hapus'}
                    </DeleteOutlineButton>
                  )}
                </div>
              )
            : undefined
        }
      />

      {item.description && (
        <PanelCard contentClassName="p-4 text-sm text-muted-foreground">{item.description}</PanelCard>
      )}

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
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3 sm:px-5">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-semibold">{formatIDR(item.amount)}</span>
        </div>
      </PanelCard>
    </PageShell>
  )
}
