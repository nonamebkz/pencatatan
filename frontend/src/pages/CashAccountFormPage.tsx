import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'

import {
  createCashAccount,
  deleteCashAccount,
  getCashAccount,
  updateCashAccount,
} from '@/api/finance'
import { TextField } from '@/components/shared/Field'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { cn } from '@/lib/utils'

export function CashAccountFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { canPageAction } = useCatalogAccess()
  const canDeleteCash = canPageAction('page.finance.cash_accounts', 'delete')
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    setLoading(true)
    getCashAccount(id)
      .then((response) => {
        setName(response.data.name)
        setIsDefault(response.data.isDefault)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat akun kas'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isEdit && id) {
        await updateCashAccount(id, { name, isDefault })
      } else {
        await createCashAccount({ name, isDefault })
      }
      navigate('/finance/cash-accounts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan akun kas')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('Hapus akun kas ini?')) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteCashAccount(id)
      navigate('/finance/cash-accounts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus akun kas')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 md:space-y-8 md:pb-0">
      <BackLink to="/finance/cash-accounts" label="Kembali ke daftar kas" />

      <PageHeader
        title={isEdit ? 'Ubah Akun Kas' : 'Tambah Akun Kas'}
        description="Nama singkat yang mudah dikenali tim, misalnya Kas Utama atau Kas Operasional."
      />

      <PanelCard title="Detail akun">
        <form id="cash-account-form" className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            label="Nama kas"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kas Utama"
            required
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-muted/30 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-input"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium">Jadikan akun default</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Otomatis terpilih di form pembelian dan pengeluaran.
              </span>
            </span>
          </label>

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <div className="hidden flex-wrap gap-3 pt-2 md:flex">
            <Button type="submit" disabled={submitting}>
              <Save className="size-4" />
              Simpan
            </Button>
            {isEdit && canDeleteCash && (
              <Button type="button" variant="outline" disabled={submitting} onClick={() => void handleDelete()}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            )}
          </div>
        </form>
      </PanelCard>

      <MobileFormFooter maxWidthClassName="max-w-2xl">
        {isEdit && canDeleteCash && (
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            className={cn('flex-1')}
            onClick={() => void handleDelete()}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" form="cash-account-form" disabled={submitting} className="flex-[1.6]">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </div>
  )
}
