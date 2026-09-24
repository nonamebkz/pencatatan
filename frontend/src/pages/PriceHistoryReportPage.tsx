import { useEffect, useState } from 'react'
import { FileSearch } from 'lucide-react'

import { getPriceHistoryReport, searchPriceHistoryItems, type PriceHistoryEntry } from '@/api/reports'
import { ReportDataList, ReportDataListItem } from '@/components/reports/ReportDataList'
import { ReportPageIntro } from '@/components/reports/ReportPageIntro'
import { ReportSummaryFooter } from '@/components/reports/ReportSummaryFooter'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageShell } from '@/components/shared/PageShell'
import { TextField } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { skeleton, surface } from '@/lib/design'
import { cn } from '@/lib/utils'

export function PriceHistoryReportPage() {
  const [itemName, setItemName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [entries, setEntries] = useState<PriceHistoryEntry[]>([])
  const [footer, setFooter] = useState<{ minPrice: number; maxPrice: number; lastPrice: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = itemName.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const t = window.setTimeout(() => {
      searchPriceHistoryItems(q)
        .then((res) => setSuggestions(res.data.items))
        .catch(() => setSuggestions([]))
    }, 300)
    return () => window.clearTimeout(t)
  }, [itemName])

  const load = () => {
    const name = itemName.trim()
    if (!name) {
      setError('Nama barang wajib diisi')
      return
    }
    setLoading(true)
    setError(null)
    getPriceHistoryReport(name)
      .then((res) => {
        setEntries(res.data.entries)
        setFooter(res.data.footer)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat histori'))
      .finally(() => setLoading(false))
  }

  return (
    <PageShell>
      <ReportPageIntro title="Histori harga" description="Perubahan harga satuan dari setiap pembelian." />

      <div className={cn(surface.panel, 'space-y-3 p-4')}>
        <TextField
          label="Nama barang"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Ketik minimal 2 huruf…"
          list="price-history-items"
        />
        <datalist id="price-history-items">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Button type="button" onClick={load} disabled={loading} className="w-full touch-target sm:w-auto">
          Tampilkan
        </Button>
      </div>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <Skeleton className={skeleton.block + ' h-24'} />
      ) : entries.length === 0 && itemName && !loading ? (
        <EmptyState icon={FileSearch} title="Belum ada data" description="Coba nama barang lain atau pastikan sudah ada pembelian." />
      ) : entries.length > 0 ? (
        <>
          <ReportDataList>
            {entries.map((row, i) => (
              <ReportDataListItem key={i}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.transactionDate}</p>
                    {row.supplierName && <p className="text-muted-foreground">{row.supplierName}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{formatIDR(row.unitPrice)}</p>
                    {row.priceDelta !== 0 && (
                      <p className={row.priceDelta > 0 ? 'text-destructive' : 'text-emerald-600'}>
                        {row.priceDelta > 0 ? '+' : ''}
                        {formatIDR(row.priceDelta)}
                      </p>
                    )}
                  </div>
                </div>
              </ReportDataListItem>
            ))}
          </ReportDataList>
          {footer && (
            <ReportSummaryFooter title="Statistik harga">
              Terendah {formatIDR(footer.minPrice)} · Tertinggi {formatIDR(footer.maxPrice)} · Terakhir{' '}
              {formatIDR(footer.lastPrice)}
            </ReportSummaryFooter>
          )}
        </>
      ) : null}
    </PageShell>
  )
}
