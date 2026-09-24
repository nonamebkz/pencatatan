import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOperationalSummaryReport, type OperationalSummaryReport } from '@/api/reports'
import { purchaseCategoryLabels, transactionTypeLabel } from '@/api/finance'
import { ReportPeriodFields } from '@/components/reports/ReportPeriodFields'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { MetricCard } from '@/components/shared/MetricCard'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { defaultReportPeriod } from '@/lib/reportPeriod'
import { skeleton } from '@/lib/design'
import { ShoppingCart, Wallet } from 'lucide-react'

export function OperationalSummaryReportPage() {
  const defaults = defaultReportPeriod()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [report, setReport] = useState<OperationalSummaryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getOperationalSummaryReport({ from, to })
      .then((res) => setReport(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Ringkasan operasional"
        description="RPT-06 — agregat pengeluaran dan breakdown kategori."
        actions={
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link to="/finance/reports">Semua laporan</Link>
          </Button>
        }
      />

      <MobileFilterPanel title="Periode" onApply={load}>
        <ReportPeriodFields from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </MobileFilterPanel>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading && !report ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className={skeleton.block + ' h-24'} />
          <Skeleton className={skeleton.block + ' h-24'} />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Periode {report.periodFrom} s/d {report.periodTo}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Total belanja" value={formatIDR(report.totalPurchases)} icon={ShoppingCart} />
            <MetricCard label="Biaya pakan (baris FEED)" value={formatIDR(report.totalFeed)} icon={ShoppingCart} />
            <MetricCard label="Beban sewa dibayar" value={formatIDR(report.totalRentPaid)} icon={Wallet} />
            <MetricCard label="Bagi hasil dibayar" value={formatIDR(report.totalProfitSharePaid)} icon={Wallet} />
          </div>

          {report.topPurchaseCategories.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Top kategori pembelian</h2>
              <ul className="divide-y rounded-xl border bg-card text-sm">
                {report.topPurchaseCategories.map((row) => (
                  <li key={row.category} className="flex justify-between p-3">
                    <span>
                      {purchaseCategoryLabels[row.category as keyof typeof purchaseCategoryLabels] ?? row.category}
                    </span>
                    <span className="tabular-nums font-medium">{formatIDR(row.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.byTransactionType.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Per jenis transaksi</h2>
              <ul className="divide-y rounded-xl border bg-card text-sm">
                {report.byTransactionType.map((row) => (
                  <li key={row.transactionType} className="flex justify-between gap-2 p-3">
                    <span>
                      {transactionTypeLabel(row.transactionType)} ({row.count})
                    </span>
                    <span className="tabular-nums font-medium">{formatIDR(row.totalAmount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="rounded-xl border bg-muted/40 p-4 text-sm font-medium">
            Grand total operasional {formatIDR(report.grandTotalOperational)}
          </footer>
        </div>
      ) : null}
    </PageShell>
  )
}
