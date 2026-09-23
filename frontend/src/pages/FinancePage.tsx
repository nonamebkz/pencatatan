import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Receipt, ShoppingCart, Wallet } from 'lucide-react'

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
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { SelectField, TextField } from '@/components/shared/Field'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { skeleton } from '@/lib/design'

export function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionType, setTransactionType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    Promise.all([
      getFinanceSummary(),
      listTransactions({
        transactionType: transactionType || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: 100,
      }),
    ])
      .then(([summaryRes, txRes]) => {
        setSummary(summaryRes.data)
        setTransactions(txRes.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat keuangan'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Keuangan"
        description="Catat pembelian barang dan pengeluaran operasional."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/finance/expenses/new">
                <Receipt className="size-4" />
                Pengeluaran lain
              </Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/finance/purchases/new">
                <ShoppingCart className="size-4" />
                Catat pembelian
              </Link>
            </Button>
          </div>
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

      <MobileFilterPanel title="Filter transaksi" description="Jenis dan tanggal" onApply={() => load()}>
        <div className="grid gap-4 sm:grid-cols-3">
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
        <MobileSectionHeader
          title="Riwayat transaksi"
          action={
            <CountBadge>{transactions.length} entri</CountBadge>
          }
        />

        {loading ? (
          <ListSkeleton count={4} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Belum ada transaksi"
            description="Mulai dengan mencatat pembelian pakan, obat, atau pengeluaran operasional."
            action={
              <Button asChild>
                <Link to="/finance/purchases/new">
                  <Plus className="size-4" />
                  Catat pembelian
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {transactions.map((item) => (
              <TransactionRow key={item.id} item={item} showDetailLink />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
