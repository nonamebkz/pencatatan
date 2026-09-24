import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Wallet } from 'lucide-react'

import {
  getRentContract,
  payRentSchedule,
  paymentSchemeLabel,
  paymentStatusLabel,
  timeStatusLabel,
  type PeriodicContract,
  type PaymentSchedule,
} from '@/api/rent'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCashAccountAndPonds } from '@/hooks/useCashAccountAndPonds'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout } from '@/lib/design'
import { formatIDR, todayISO } from '@/lib/format'

export function RentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { canPageAction } = useCatalogAccess()
  const canPay = canPageAction('page.finance.rent', 'pay')
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
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </PageShell>
    )
  }

  if (!contract) {
    return (
      <PageShell className={pageLayout.detailLg}>
        <ErrorAlert>{error ?? 'Kontrak tidak ditemukan'}</ErrorAlert>
      </PageShell>
    )
  }

  return (
    <PageShell className={pageLayout.detailLg}>
      <BackLink to="/finance/rent" label="Kembali ke daftar sewa" />

      <PageHeader
        title={contract.businessUnitName ?? 'Kontrak sewa'}
        description={`${contract.startDate} — ${contract.endDate} · ${paymentSchemeLabel[contract.paymentScheme]}`}
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}
      {accountsError && <ErrorAlert>{accountsError}</ErrorAlert>}

      <div className="flex flex-wrap gap-2">
        <Badge>{timeStatusLabel[contract.timeStatus]}</Badge>
        <Badge variant="outline">{paymentStatusLabel[contract.paymentStatus]}</Badge>
      </div>

      <PanelCard title="Ringkasan" contentClassName="space-y-2 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total kontrak</span>
          <span className="font-semibold tabular-nums">{formatIDR(contract.totalAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sudah dibayar</span>
          <span className="tabular-nums">{formatIDR(contract.paidAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sisa</span>
          <span className="font-semibold tabular-nums text-destructive">{formatIDR(contract.remainingAmount)}</span>
        </div>
        {contract.notes && <p className="pt-2 text-muted-foreground">{contract.notes}</p>}
      </PanelCard>

      {canPay && accounts.length > 0 && contract.remainingAmount > 0 && (
        <PanelCard title="Bayar jadwal" contentClassName="space-y-4 p-4">
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

      <PanelCard title="Jadwal pembayaran" contentClassName="p-0">
        <ul className="divide-y">
          {(contract.schedules ?? []).map((schedule) => (
            <li key={schedule.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium tabular-nums">{formatIDR(schedule.amount)}</p>
                <p className="text-xs text-muted-foreground">Jatuh tempo {schedule.dueDate}</p>
              </div>
              {schedule.isPaid ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  Lunas
                </span>
              ) : canPay ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full touch-target sm:w-auto"
                  disabled={payingId === schedule.id}
                  onClick={() => void handlePay(schedule)}
                >
                  <Wallet className="size-4" />
                  {payingId === schedule.id ? 'Memproses…' : 'Catat bayar'}
                </Button>
              ) : (
                <Badge variant="outline">Belum bayar</Badge>
              )}
            </li>
          ))}
        </ul>
      </PanelCard>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link to="/finance">Lihat semua transaksi</Link>
      </Button>
    </PageShell>
  )
}
