import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, Plus } from 'lucide-react'

import { listCashAccounts, type CashAccount } from '@/api/finance'
import { CashAccountCard } from '@/components/finance/CashAccountCard'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { PermCashAccountCreate } from '@/lib/permissions'

export function CashAccountListPage() {
  const { can: check } = useAuth()
  const canCreate = check(PermCashAccountCreate)
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listCashAccounts()
      .then((response) => setAccounts(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat akun kas'))
      .finally(() => setLoading(false))
  }, [])

  const defaultCount = accounts.filter((item) => item.isDefault).length

  return (
    <PageShell>
      <BackLink to="/finance" label="Kembali ke keuangan" />

      <PageHeader
        title="Akun Kas"
        description="Kelola sumber dana untuk pembelian dan pengeluaran. Minimal satu akun harus ada."
        actions={
          canCreate ? (
            <Button asChild size="lg" className="hidden w-full md:inline-flex md:w-auto">
              <Link to="/finance/cash-accounts/new">
                <Plus className="size-4" />
                Tambah kas
              </Link>
            </Button>
          ) : undefined
        }
      />

      <InfoCallout>
        Akun bertanda <strong>Default</strong> otomatis terpilih di form pembelian dan pengeluaran. Hapus akun hanya untuk
        admin dan hanya jika belum ada transaksi.
      </InfoCallout>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={3} className="h-28 rounded-2xl" />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Belum ada akun kas"
          description="Tambahkan akun kas pertama agar transaksi keuangan bisa dicatat."
          action={
            canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to="/finance/cash-accounts/new">
                  <Plus className="size-4" />
                  Tambah kas
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {defaultCount === 0 && (
            <ErrorAlert>Pilih satu akun sebagai default agar form keuangan tidak kosong.</ErrorAlert>
          )}
          {accounts.map((account) => (
            <CashAccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {canCreate && (
        <Button
          asChild
          size="lg"
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 size-14 rounded-full p-0 shadow-lg md:hidden"
        >
          <Link to="/finance/cash-accounts/new" aria-label="Tambah akun kas">
            <Plus className="size-6" />
          </Link>
        </Button>
      )}
    </PageShell>
  )
}
