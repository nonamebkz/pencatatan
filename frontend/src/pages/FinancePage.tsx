import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Receipt, ShoppingCart, Wallet } from 'lucide-react'

import {
  getFinanceSummary,
  listTransactions,
  type FinanceSummary,
  type Transaction,
} from '@/api/finance'
import { FinanceShortcutGrid } from '@/components/finance/FinanceShortcutGrid'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { CountBadge } from '@/components/shared/CountBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { SelectField, TextField } from '@/components/shared/Field'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { RECORD_LIST_LIMIT } from '@/lib/listing'
import { skeleton } from '@/lib/design'

export function FinancePage() {
  const { canPageAction } = useCatalogAccess()
  const showPurchases = canPageAction('page.finance.purchases', 'create')
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionType, setTransactionType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = (opts?: { page?: number; append?: boolean; showLoading?: boolean }) => {
    const nextPage = opts?.page ?? 1
    const append = opts?.append ?? false
    const showLoading = opts?.showLoading ?? !append
    if (showLoading) setLoading(true)
    if (append) setLoadingMore(true)
    setError(null)
    Promise.all([
      getFinanceSummary(),
      listTransactions({
        transactionType: transactionType || undefined,
        from: from || undefined,
        to: to || undefined,
        page: nextPage,
        limit: RECORD_LIST_LIMIT,
      }),
    ])
      .then(([summaryRes, txRes]) => {
        setSummary(summaryRes.data)
        setTotal(Number(txRes.meta?.total ?? txRes.data.length))
        setPage(nextPage)
        setTransactions((prev) => (append ? [...prev, ...txRes.data] : txRes.data))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat keuangan'))
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Keuangan"
        description="Ringkasan bulan ini, arsip transaksi, dan menu terkait."
        actions={
          showPurchases ? (
            <Button asChild size="lg" className="hidden md:inline-flex">
              <Link to="/finance/purchases/new">
                <ShoppingCart className="size-4" />
                Catat pembelian
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="grid gap-3 sm:grid-cols-3">
        {loading && !summary ? (
          <>
            <Skeleton className={skeleton.block + ' h-24'} />
            <Skeleton className={skeleton.block + ' h-24'} />
            <Skeleton className={skeleton.block + ' h-24'} />
          </>
        ) : (
          <>
            <MetricCard
              label="Pembelian bulan ini"
              value={formatIDR(summary?.monthPurchases ?? 0)}
              icon={ShoppingCart}
              tone="default"
            />
            <MetricCard
              label="Pengeluaran lain"
              value={formatIDR(summary?.monthOtherExpenses ?? 0)}
              icon={Receipt}
              tone="warning"
            />
            <MetricCard
              label="Total keluar bulan ini"
              value={formatIDR(summary?.monthTotalOut ?? 0)}
              icon={Wallet}
              tone="danger"
            />
          </>
        )}
      </div>

      <FinanceShortcutGrid />

      <MobileFilterPanel title="Filter transaksi" onApply={() => load({ page: 1 })}>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Jenis"
            id="filter-type"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option value="">Semua</option>
            <option value="PURCHASE">Pembelian</option>
            <option value="OTHER_EXPENSE">Pengeluaran lain</option>
            <option value="RENT_PAYMENT">Bayar sewa</option>
          </SelectField>
          <TextField label="Dari" id="filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField label="Sampai" id="filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </MobileFilterPanel>

      <div className="space-y-4">
        <div className="flex justify-end">
          <CountBadge>
            {transactions.length}
            {total > transactions.length ? ` / ${total}` : ''} entri
          </CountBadge>
        </div>

        {loading ? (
          <ListSkeleton count={4} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Belum ada transaksi"
            description="Mulai dengan mencatat pembelian pakan, obat, atau pengeluaran operasional."
            action={
              showPurchases ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/finance/purchases/new">
                    <Plus className="size-4" />
                    Catat pembelian
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {transactions.map((item) => (
              <TransactionRow key={item.id} item={item} showDetailLink />
            ))}
            {transactions.length < total && (
              <Button
                type="button"
                variant="outline"
                className="w-full touch-target"
                disabled={loadingMore}
                onClick={() => load({ page: page + 1, append: true })}
              >
                {loadingMore ? 'Memuat…' : 'Muat lebih banyak'}
              </Button>
            )}
          </div>
        )}
      </div>

      {showPurchases && <MobileListFab to="/finance/purchases/new" ariaLabel="Catat pembelian" />}
    </PageShell>
  )
}
