import { useEffect, useState } from 'react'
import { FileSearch } from 'lucide-react'

import { listPonds, type Pond } from '@/api/water-quality'
import { getPurchaseReport, type PurchaseReportRow } from '@/api/reports'
import { purchaseCategoryLabels } from '@/api/finance'
import { ReportDataList, ReportDataListItem } from '@/components/reports/ReportDataList'
import { ReportPageIntro } from '@/components/reports/ReportPageIntro'
import { ReportPeriodFields } from '@/components/reports/ReportPeriodFields'
import { ReportSummaryFooter } from '@/components/reports/ReportSummaryFooter'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { PageShell } from '@/components/shared/PageShell'
import { SelectField } from '@/components/shared/Field'
import { formatIDR } from '@/lib/format'
import { defaultReportPeriod } from '@/lib/reportPeriod'

export function PurchaseReportPage() {
  const defaults = defaultReportPeriod()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [ponds, setPonds] = useState<Pond[]>([])
  const [items, setItems] = useState<PurchaseReportRow[]>([])
  const [footer, setFooter] = useState<{ totalAmount: number; transactionCount: number; lineCount: number } | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getPurchaseReport({
      from,
      to,
      businessUnitId: businessUnitId || undefined,
    })
      .then((res) => {
        setItems(res.data.items)
        setFooter(res.data.footer)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat laporan'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    listPonds().then((r) => setPonds(r.data)).catch(() => undefined)
    load()
  }, [])

  return (
    <PageShell>
      <ReportPageIntro
        title="Laporan pembelian"
        description="Baris item pembelian dalam periode yang dipilih."
      />

      <MobileFilterPanel title="Filter" onApply={load}>
        <ReportPeriodFields from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <SelectField
          label="Kolam (opsional)"
          value={businessUnitId}
          onChange={(e) => setBusinessUnitId(e.target.value)}
        >
          <option value="">Semua kolam</option>
          {ponds.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </SelectField>
      </MobileFilterPanel>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState icon={FileSearch} title="Tidak ada data" description="Ubah periode atau filter kolam." />
      ) : (
        <>
          <ReportDataList>
            {items.map((row, i) => (
              <ReportDataListItem key={`${row.transactionId}-${i}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.itemName}</p>
                    <p className="text-muted-foreground">
                      {row.transactionDate} · {purchaseCategoryLabels[row.category]}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatIDR(row.totalPrice)}</p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {row.qty} {row.unit} × {formatIDR(row.unitPrice)}
                  {row.supplierName ? ` · ${row.supplierName}` : ''}
                  {row.pondName ? ` · ${row.pondName}` : ''}
                </p>
              </ReportDataListItem>
            ))}
          </ReportDataList>
          {footer && (
            <ReportSummaryFooter>
              Total {formatIDR(footer.totalAmount)} · {footer.transactionCount} transaksi · {footer.lineCount} baris
            </ReportSummaryFooter>
          )}
        </>
      )}
    </PageShell>
  )
}
