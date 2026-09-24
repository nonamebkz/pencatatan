import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, FileText, Landmark, Plus, Receipt, ShoppingCart, Wallet } from 'lucide-react'

import {
  getFinanceSummary,
  listTransactions,
  type FinanceSummary,
  type Transaction,
} from '@/api/finance'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
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
  const { canViewPageId, canPageAction } = useCatalogAccess()
  const showCashAccounts = canViewPageId('page.finance.cash_accounts')
  const showPurchases = canPageAction('page.finance.purchases', 'create')
  const showRent = canPageAction('page.finance.rent', 'read')
  const showExpenses = canPageAction('page.finance.expenses', 'create')
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

  const showReports = canPageAction('page.finance.reports', 'read')
  const showQuickActions = showCashAccounts || showExpenses || showPurchases || showRent || showReports

  return (
    <PageShell>
      <PageHeader
        title="Keuangan"
        description="Catat pembelian barang dan pengeluaran operasional."
        actions={
          showQuickActions ? (
            <div className="hidden flex-col gap-2 md:flex md:flex-row">
              {showCashAccounts && (
                <Button asChild variant="outline">
                  <Link to="/finance/cash-accounts">
                    <Landmark className="size-4" />
                    Akun kas
                  </Link>
                </Button>
              )}
              {showExpenses && (
                <Button asChild variant="outline">
                  <Link to="/finance/expenses/new">
                    <Receipt className="size-4" />
                    Pengeluaran lain
                  </Link>
                </Button>
              )}
              {showRent && (
                <Button asChild variant="outline">
                  <Link to="/finance/rent">
                    <FileText className="size-4" />
                    Sewa kolam
                  </Link>
                </Button>
              )}
              {showReports && (
                <Button asChild variant="outline">
                  <Link to="/finance/reports">
                    <BarChart3 className="size-4" />
                    Laporan
                  </Link>
                </Button>
              )}
              {showPurchases && (
                <Button asChild size="lg">
                  <Link to="/finance/purchases/new">
                    <ShoppingCart className="size-4" />
                    Catat pembelian
                  </Link>
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {showQuickActions && (
        <section className="space-y-3 md:hidden">
          <MobileSectionHeader title="Aksi cepat" />
          <div className="grid gap-2">
            {showExpenses && (
              <Button asChild variant="outline" className="h-11 w-full touch-target">
                <Link to="/finance/expenses/new">
                  <Receipt className="size-4" />
                  Pengeluaran lain
                </Link>
              </Button>
            )}
            {showCashAccounts && (
              <Button asChild variant="outline" className="h-11 w-full touch-target">
                <Link to="/finance/cash-accounts">
                  <Landmark className="size-4" />
                  Akun kas
                </Link>
              </Button>
            )}
            {showRent && (
              <Button asChild variant="outline" className="h-11 w-full touch-target">
                <Link to="/finance/rent">
                  <FileText className="size-4" />
                  Sewa kolam
                </Link>
              </Button>
            )}
            {showReports && (
              <Button asChild variant="outline" className="h-11 w-full touch-target">
                <Link to="/finance/reports">
                  <BarChart3 className="size-4" />
                  Laporan
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}

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

      <MobileFilterPanel title="Filter" onApply={() => load({ page: 1 })}>
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
                className="w-full"
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
