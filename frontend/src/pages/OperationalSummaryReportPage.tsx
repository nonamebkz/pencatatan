import { useEffect, useState } from 'react'
import { ShoppingCart, Wallet } from 'lucide-react'

import { getOperationalSummaryReport, type OperationalSummaryReport } from '@/api/reports'
import { purchaseCategoryLabels, transactionTypeLabel } from '@/api/finance'
import { ReportDataList, ReportDataListItem } from '@/components/reports/ReportDataList'
import { ReportPageIntro } from '@/components/reports/ReportPageIntro'
import { ReportPeriodFields } from '@/components/reports/ReportPeriodFields'
import { ReportSummaryFooter } from '@/components/reports/ReportSummaryFooter'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { MetricCard } from '@/components/shared/MetricCard'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageShell } from '@/components/shared/PageShell'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { defaultReportPeriod } from '@/lib/reportPeriod'
import { skeleton } from '@/lib/design'

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
      <ReportPageIntro
        title="Ringkasan operasional"
        description="Agregat pengeluaran dan breakdown per kategori."
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
            <section className="space-y-3">
              <MobileSectionHeader title="Top kategori pembelian" />
              <ReportDataList>
                {report.topPurchaseCategories.map((row) => (
                  <ReportDataListItem key={row.category}>
                    <div className="flex justify-between gap-2">
                      <span>
                        {purchaseCategoryLabels[row.category as keyof typeof purchaseCategoryLabels] ?? row.category}
                      </span>
                      <span className="tabular-nums font-medium">{formatIDR(row.amount)}</span>
                    </div>
                  </ReportDataListItem>
                ))}
              </ReportDataList>
            </section>
          )}

          {report.byTransactionType.length > 0 && (
            <section className="space-y-3">
              <MobileSectionHeader title="Per jenis transaksi" />
              <ReportDataList>
                {report.byTransactionType.map((row) => (
                  <ReportDataListItem key={row.transactionType}>
                    <div className="flex justify-between gap-2">
                      <span>
                        {transactionTypeLabel(row.transactionType)} ({row.count})
                      </span>
                      <span className="tabular-nums font-medium">{formatIDR(row.totalAmount)}</span>
                    </div>
                  </ReportDataListItem>
                ))}
              </ReportDataList>
            </section>
          )}

          <ReportSummaryFooter title="Total operasional">
            {formatIDR(report.grandTotalOperational)}
          </ReportSummaryFooter>
        </div>
      ) : null}
    </PageShell>
  )
}
