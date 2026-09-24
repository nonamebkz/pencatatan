import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'

import { createRentContract, type PaymentScheme } from '@/api/rent'
import { listPonds, type Pond } from '@/api/water-quality'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { pageLayout } from '@/lib/design'
import { todayISO } from '@/lib/format'
export function RentFormPage() {
  const navigate = useNavigate()
  const [ponds, setPonds] = useState<Pond[]>([])
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [durationMonths, setDurationMonths] = useState('12')
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>('INSTALLMENT')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listPonds().then((res) => setPonds(res.data)).catch(() => undefined)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const months = Number(durationMonths)
    const total = Number(totalAmount.replace(/\./g, '').replace(',', '.'))
    if (!businessUnitId) {
      setError('Pilih kolam')
      setSubmitting(false)
      return
    }
    if (!Number.isFinite(months) || months < 1) {
      setError('Durasi minimal 1 bulan')
      setSubmitting(false)
      return
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError('Total sewa harus lebih dari 0')
      setSubmitting(false)
      return
    }
    try {
      const res = await createRentContract({
        businessUnitId,
        startDate,
        durationMonths: months,
        totalAmount: total,
        paymentScheme,
        notes: notes.trim() || undefined,
      })
      navigate(`/finance/rent/${res.data.contract.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kontrak')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell className={pageLayout.formLg}>
      <BackLink to="/finance/rent" label="Daftar sewa" shortLabel="Sewa" />

      <PageHeader
        title="Kontrak sewa baru"
        description="Jadwal pembayaran dibuat otomatis (sekaligus atau cicilan per bulan)."
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <form id="rent-form" className="space-y-6" onSubmit={handleSubmit}>
        <PanelCard title="Detail kontrak">
          <div className="space-y-4">
            <SelectField
              label="Kolam"
              id="rent-pond"
              value={businessUnitId}
              onChange={(e) => setBusinessUnitId(e.target.value)}
              required
            >
              <option value="">Pilih kolam</option>
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>
                  {pond.name}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Tanggal mulai sewa"
              id="rent-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <TextField
              label="Durasi (bulan)"
              id="rent-duration"
              type="number"
              min={1}
              inputMode="numeric"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              required
            />
            <TextField
              label="Total nilai sewa (Rp)"
              id="rent-total"
              type="number"
              min={0}
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
            <SelectField
              label="Skema bayar"
              id="rent-scheme"
              value={paymentScheme}
              onChange={(e) => setPaymentScheme(e.target.value as PaymentScheme)}
            >
              <option value="INSTALLMENT">Cicilan bulanan</option>
              <option value="LUMP_SUM">Sekaligus di awal</option>
            </SelectField>
            <TextareaField
              label="Catatan"
              id="rent-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </PanelCard>

        <div className="hidden md:block">
          <Button type="submit" size="lg" disabled={submitting}>
            <Save className="size-4" />
            {submitting ? 'Menyimpan…' : 'Buat kontrak'}
          </Button>
        </div>
      </form>

      <MobileFormFooter>
        <Button type="submit" form="rent-form" className="w-full" disabled={submitting}>
          <Save className="size-4" />
          {submitting ? 'Menyimpan…' : 'Buat kontrak'}
        </Button>
      </MobileFormFooter>
    </PageShell>
  )
}
