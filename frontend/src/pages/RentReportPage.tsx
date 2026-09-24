import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch } from 'lucide-react'

import { getRentReport } from '@/api/reports'
import { paymentStatusLabel, timeStatusLabel, type PeriodicContract } from '@/api/rent'
import { ReportDataList, ReportDataListItem } from '@/components/reports/ReportDataList'
import { ReportPageIntro } from '@/components/reports/ReportPageIntro'
import { ReportSummaryFooter } from '@/components/reports/ReportSummaryFooter'
import { MobileFilterPanel } from '@/components/mobile/MobileFilterPanel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageShell } from '@/components/shared/PageShell'
import { SelectField } from '@/components/shared/Field'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'
import { skeleton } from '@/lib/design'

export function RentReportPage() {
  const [timeStatus, setTimeStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [contracts, setContracts] = useState<PeriodicContract[]>([])
  const [footer, setFooter] = useState<{ activeContractCount: number; totalRemaining: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getRentReport({
      timeStatus: timeStatus || undefined,
      paymentStatus: paymentStatus || undefined,
    })
      .then((res) => {
        setContracts(res.data.contracts)
        setFooter(res.data.footer)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat laporan sewa'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell>
      <ReportPageIntro
        title="Laporan sewa kolam"
        description="Kontrak aktif, pembayaran, dan sisa tunggakan."
      />

      <MobileFilterPanel title="Filter" onApply={load}>
        <SelectField label="Status waktu" value={timeStatus} onChange={(e) => setTimeStatus(e.target.value)}>
          <option value="">Semua</option>
          <option value="ACTIVE">Aktif</option>
          <option value="EXPIRING">Akan habis</option>
          <option value="ENDED">Berakhir</option>
        </SelectField>
        <SelectField label="Status bayar" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">Semua</option>
          <option value="UNPAID">Belum bayar</option>
          <option value="PARTIAL">Sebagian</option>
          <option value="PAID">Lunas</option>
        </SelectField>
      </MobileFilterPanel>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <Skeleton className={skeleton.block + ' h-24'} />
      ) : contracts.length === 0 ? (
        <EmptyState icon={FileSearch} title="Tidak ada kontrak" description="Ubah filter atau buat kontrak sewa baru." />
      ) : (
        <>
          <ReportDataList>
            {contracts.map((c) => (
              <ReportDataListItem key={c.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/finance/rent/${c.id}`} className="font-medium text-primary hover:underline">
                    {c.businessUnitName}
                  </Link>
                  <Badge variant="secondary">{timeStatusLabel[c.timeStatus]}</Badge>
                  <Badge variant="outline">{paymentStatusLabel[c.paymentStatus]}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {c.startDate} – {c.endDate}
                </p>
                <p className="mt-1">
                  Total {formatIDR(c.totalAmount)} · Dibayar {formatIDR(c.paidAmount)} · Sisa{' '}
                  <span className="font-medium">{formatIDR(c.remainingAmount)}</span>
                </p>
              </ReportDataListItem>
            ))}
          </ReportDataList>
          {footer && (
            <ReportSummaryFooter>
              Kontrak aktif/akan habis: {footer.activeContractCount} · Total sisa tunggakan{' '}
              {formatIDR(footer.totalRemaining)}
            </ReportSummaryFooter>
          )}
        </>
      )}
    </PageShell>
  )
}
