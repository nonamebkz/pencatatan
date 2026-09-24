import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart3, FileText, Wallet } from 'lucide-react'

import {
  getRentContract,
  payRentSchedule,
  paymentSchemeLabel,
  paymentStatusLabel,
  timeStatusLabel,
  type PeriodicContract,
  type PaymentSchedule,
} from '@/api/rent'
import { RentScheduleList } from '@/components/finance/RentScheduleList'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { ShortcutLinkCard } from '@/components/shared/ShortcutLinkCard'
import { Badge } from '@/components/ui/badge'
import { useCashAccountAndPonds } from '@/hooks/useCashAccountAndPonds'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout, surface } from '@/lib/design'
import { formatIDR, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'

export function RentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { canPageAction } = useCatalogAccess()
  const canPay = canPageAction('page.finance.rent', 'pay')
  const canReport = canPageAction('page.finance.reports', 'read')
  const { accounts, cashAccountId, setCashAccountId, accountsError } = useCashAccountAndPonds()
  const [contract, setContract] = useState<PeriodicContract | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState(todayISO())

  const load = () => {
    setLoading(true)
    getRentContract(id)
      .then((res) => setContract(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kontrak'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const handlePay = async (schedule: PaymentSchedule) => {
    if (!canPay || schedule.isPaid) return
    if (!cashAccountId) {
      setError('Pilih akun kas')
      return
    }
    setPayingId(schedule.id)
    setError(null)
    try {
      const res = await payRentSchedule(schedule.id, {
        paymentDate,
        cashAccountId,
      })
      navigate(`/finance/transactions/${res.data.transaction.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat pembayaran')
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <PageShell className={pageLayout.detailLg}>
        <BackLink to="/finance/rent" label="Daftar sewa" shortLabel="Sewa" />
        <ListSkeleton count={2} />
      </PageShell>
    )
  }

  if (!contract) {
    return (
      <PageShell className={pageLayout.detailLg}>
        <BackLink to="/finance/rent" label="Daftar sewa" shortLabel="Sewa" />
        <ErrorAlert>{error ?? 'Kontrak tidak ditemukan'}</ErrorAlert>
      </PageShell>
    )
  }

  return (
    <PageShell className={pageLayout.detailLg}>
      <div className="space-y-2">
        <BackLink to="/finance/rent" label="Daftar sewa" shortLabel="Sewa" />
        <PageHeader
          title={contract.businessUnitName ?? 'Kontrak sewa'}
          description={`${contract.startDate} — ${contract.endDate} · ${paymentSchemeLabel[contract.paymentScheme]}`}
        />
      </div>

      {error && <ErrorAlert>{error}</ErrorAlert>}
      {accountsError && <ErrorAlert>{accountsError}</ErrorAlert>}

      <div className="flex flex-wrap gap-2">
        <Badge>{timeStatusLabel[contract.timeStatus]}</Badge>
        <Badge variant="outline">{paymentStatusLabel[contract.paymentStatus]}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total kontrak" value={formatIDR(contract.totalAmount)} icon={FileText} />
        <MetricCard label="Sudah dibayar" value={formatIDR(contract.paidAmount)} icon={Wallet} tone="success" />
        <MetricCard
          label="Sisa"
          value={formatIDR(contract.remainingAmount)}
          icon={Wallet}
          tone={contract.remainingAmount > 0 ? 'danger' : 'default'}
        />
      </div>

      {contract.notes && (
        <p className={cn(surface.panel, 'p-4 text-sm text-muted-foreground')}>{contract.notes}</p>
      )}

      {canReport && (
        <ShortcutLinkCard
          to="/finance/reports/rent"
          title="Laporan sewa"
          description="Lihat semua kontrak dan tunggakan"
          icon={BarChart3}
        />
      )}

      {canPay && accounts.length > 0 && contract.remainingAmount > 0 && (
        <PanelCard title="Opsi pembayaran" contentClassName="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Tanggal bayar"
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
            <SelectField
              label="Akun kas"
              id="pay-cash"
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </SelectField>
          </div>
        </PanelCard>
      )}

      <section className="space-y-3">
        <MobileSectionHeader title="Jadwal pembayaran" />
        <RentScheduleList
          schedules={contract.schedules ?? []}
          canPay={canPay}
          payingId={payingId}
          onPay={(schedule) => void handlePay(schedule)}
        />
      </section>
    </PageShell>
  )
}
