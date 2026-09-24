import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch } from 'lucide-react'

import { listPonds, type Pond } from '@/api/water-quality'
import { getPurchaseReport, type PurchaseReportRow } from '@/api/reports'
import { purchaseCategoryLabels } from '@/api/finance'
import { ReportPeriodFields } from '@/components/reports/ReportPeriodFields'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { SelectField } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { defaultReportPeriod } from '@/lib/reportPeriod'
import { skeleton } from '@/lib/design'

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
      <PageHeader
        title="Laporan pembelian"
        description="RPT-01 — baris item pembelian dalam periode."
        actions={
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link to="/finance/reports">Semua laporan</Link>
          </Button>
        }
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
        <div className="space-y-2">
          <Skeleton className={skeleton.block + ' h-16'} />
          <Skeleton className={skeleton.block + ' h-16'} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileSearch} title="Tidak ada data" description="Ubah periode atau filter kolam." />
      ) : (
        <>
          <ul className="divide-y rounded-xl border bg-card">
            {items.map((row, i) => (
              <li key={`${row.transactionId}-${i}`} className="space-y-1 p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.itemName}</p>
                    <p className="text-muted-foreground">
                      {row.transactionDate} · {purchaseCategoryLabels[row.category]}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatIDR(row.totalPrice)}</p>
                </div>
                <p className="text-muted-foreground">
                  {row.qty} {row.unit} × {formatIDR(row.unitPrice)}
                  {row.supplierName ? ` · ${row.supplierName}` : ''}
                  {row.pondName ? ` · ${row.pondName}` : ''}
                </p>
              </li>
            ))}
          </ul>
          {footer && (
            <footer className="rounded-xl border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Ringkasan</p>
              <p className="text-muted-foreground">
                Total {formatIDR(footer.totalAmount)} · {footer.transactionCount} transaksi · {footer.lineCount} baris
              </p>
            </footer>
          )}
        </>
      )}
    </PageShell>
  )
}
