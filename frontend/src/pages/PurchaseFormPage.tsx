import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'

import {
  createPurchase,
  purchaseCategoryLabels,
  type PurchaseCategory,
  type PurchaseItemInput,
} from '@/api/finance'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
import { BackLink } from '@/components/shared/BackLink'
import { Field, SelectField, TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCashAccountAndPonds } from '@/hooks/useCashAccountAndPonds'
import { pageLayout } from '@/lib/design'
import { formatIDR, todayISO } from '@/lib/format'

type LineDraft = PurchaseItemInput & { key: string }

function emptyLine(): LineDraft {
  return {
    key: crypto.randomUUID(),
    itemName: '',
    category: 'FEED',
    qty: 1,
    unit: 'kg',
    unitPrice: 0,
  }
}

export function PurchaseFormPage() {
  const navigate = useNavigate()
  const { accounts, ponds, cashAccountId, setCashAccountId, accountsError } = useCashAccountAndPonds()
  const [transactionDate, setTransactionDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
    [lines],
  )

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await createPurchase({
        cashAccountId: cashAccountId || undefined,
        transactionDate,
        description: description || undefined,
        businessUnitId: businessUnitId || undefined,
        items: lines.map(({ key: _key, ...item }) => item),
      })
      navigate('/finance')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pembelian')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell className={pageLayout.formLg}>
      <BackLink to="/finance" label="Kembali ke keuangan" />

      <PageHeader
        title="Catat Pembelian"
        description="Satu transaksi bisa berisi beberapa barang; total dihitung otomatis."
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

      <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
        <PanelCard title="Informasi transaksi" className="overflow-hidden" contentClassName="p-0">
          <div className="space-y-4 p-4 sm:p-5 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Tanggal"
                id="tx-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
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
            </div>
            <SelectField
              label="Kolam (opsional)"
              id="pond"
              value={businessUnitId}
              onChange={(e) => setBusinessUnitId(e.target.value)}
            >
              <option value="">Tidak terkait kolam</option>
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>
                  {pond.name}
                </option>
              ))}
            </SelectField>
            <TextareaField
              label="Catatan transaksi"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mis. belanja pakan minggu ini"
              rows={2}
            />
          </div>
        </PanelCard>

        <MobileSectionHeader
          title="Barang dibeli"
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
              <Plus className="size-4" />
              Tambah baris
            </Button>
          }
        />

        {lines.map((line, index) => (
            <PanelCard key={line.key} className="overflow-hidden" contentClassName="p-0">
              <div className="flex items-center justify-between border-b px-4 py-2 sm:px-5">
                <span className="text-sm font-medium text-muted-foreground">Baris {index + 1}</span>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setLines((prev) => prev.filter((row) => row.key !== line.key))}
                  >
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                )}
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <Field label="Nama barang">
                  <Input
                    value={line.itemName}
                    onChange={(e) => updateLine(line.key, { itemName: e.target.value })}
                    placeholder="Pakan lele premium"
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Kategori">
                    <Select
                      value={line.category}
                      onChange={(e) => updateLine(line.key, { category: e.target.value as PurchaseCategory })}
                    >
                      {Object.entries(purchaseCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Supplier (opsional)">
                    <Input
                      value={line.supplierName ?? ''}
                      onChange={(e) => updateLine(line.key, { supplierName: e.target.value || undefined })}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Qty">
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: Number(e.target.value) })}
                      required
                    />
                  </Field>
                  <Field label="Satuan">
                    <Input
                      value={line.unit}
                      onChange={(e) => updateLine(line.key, { unit: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Harga/satuan">
                    <Input
                      type="number"
                      min={0}
                      step="100"
                      value={line.unitPrice || ''}
                      onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                      required
                    />
                  </Field>
                </div>
                <p className="text-right text-sm text-muted-foreground">
                  Subtotal: <span className="font-medium text-foreground">{formatIDR(line.qty * line.unitPrice)}</span>
                </p>
              </div>
            </PanelCard>
          ))}

        <PanelCard contentClassName="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total pembelian</p>
              <p className="text-2xl font-semibold">{formatIDR(total)}</p>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitting || accounts.length === 0}
              className="hidden w-full sm:w-auto md:inline-flex"
            >
              <Save className="size-4" />
              {submitting ? 'Menyimpan…' : 'Simpan pembelian'}
            </Button>
          </div>
        </PanelCard>
      </form>

      <MobileFormFooter>
        <Button
          type="submit"
          form="purchase-form"
          size="lg"
          className="flex-1"
          disabled={submitting || accounts.length === 0}
        >
          <Save className="size-4" />
          {submitting ? 'Menyimpan…' : `Simpan · ${formatIDR(total)}`}
        </Button>
      </MobileFormFooter>
    </PageShell>
  )
}
