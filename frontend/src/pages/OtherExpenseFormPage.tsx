import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'

import { createOtherExpense } from '@/api/finance'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { useCashAccountAndPonds } from '@/hooks/useCashAccountAndPonds'
import { pageLayout } from '@/lib/design'
import { todayISO } from '@/lib/format'

export function OtherExpenseFormPage() {
  const navigate = useNavigate()
  const { accounts, ponds, cashAccountId, setCashAccountId, accountsError } = useCashAccountAndPonds()
  const [transactionDate, setTransactionDate] = useState(todayISO())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await createOtherExpense({
        cashAccountId: cashAccountId || undefined,
        transactionDate,
        amount: Number(amount),
        description,
        category: category || undefined,
        businessUnitId: businessUnitId || undefined,
      })
      navigate('/finance')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengeluaran')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell className={pageLayout.formSm}>
      <BackLink to="/finance" label="Kembali ke keuangan" />

      <PageHeader
        title="Pengeluaran Lain"
        description="Biaya operasional yang bukan pembelian barang (transport, listrik, dll.)."
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}
      {accountsError && <ErrorAlert>{accountsError}</ErrorAlert>}
      {!accountsError && accounts.length === 0 && (
        <ErrorAlert>
          Belum ada akun kas.{' '}
          <Link to="/finance/cash-accounts/new" className="font-medium underline">
            Tambah akun kas
          </Link>{' '}
          terlebih dahulu.
        </ErrorAlert>
      )}

      <form id="other-expense-form" onSubmit={handleSubmit}>
        <PanelCard className="overflow-hidden">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Tanggal"
                id="tx-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
              <TextField
                label="Nominal (Rp)"
                id="amount"
                type="number"
                min={1}
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <SelectField
              label="Kas"
              id="cash-account"
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectField>
            <TextareaField
              label="Deskripsi"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mis. biaya angkut pakan"
              rows={3}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Kategori (opsional)"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Transport"
              />
              <SelectField
                label="Kolam (opsional)"
                id="pond"
                value={businessUnitId}
                onChange={(e) => setBusinessUnitId(e.target.value)}
              >
                <option value="">Umum</option>
                {ponds.map((pond) => (
                  <option key={pond.id} value={pond.id}>
                    {pond.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button
              type="submit"
              size="lg"
              className="hidden w-full md:inline-flex"
              disabled={submitting || accounts.length === 0}
            >
              <Save className="size-4" />
              {submitting ? 'Menyimpan…' : 'Simpan pengeluaran'}
            </Button>
          </div>
        </PanelCard>
      </form>

      <MobileFormFooter maxWidthClassName="max-w-2xl">
        <Button
          type="submit"
          form="other-expense-form"
          size="lg"
          className="flex-1"
          disabled={submitting || accounts.length === 0}
        >
          <Save className="size-4" />
          {submitting ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </MobileFormFooter>
    </PageShell>
  )
}
