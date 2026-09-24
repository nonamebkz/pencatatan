import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { PermUserCreate } from '@/lib/permissions'
import type { UserRecord } from '@/api/users'
import { listUsers } from '@/api/users'
import { UserCard } from '@/components/users/UserCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'

export function UserListPage() {
  const { can: check } = useAuth()
  const canCreate = check(PermUserCreate)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listUsers()
      .then((response) => setUsers(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat pengguna'))
      .finally(() => setLoading(false))
  }, [])

  const activeCount = users.filter((user) => user.isActive).length

  return (
    <PageShell>
      <PageHeader
        title="Pengguna"
        description="Kelola akun tim operasional kolam. Tidak ada pendaftaran mandiri."
        actions={
          canCreate ? (
            <Button asChild size="lg" className="hidden md:inline-flex">
              <Link to="/users/new">
                <Plus className="size-4" />
                Tambah Pengguna
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 md:max-w-lg">
        <MetricCard label="Total pengguna" value={users.length} layout="simple" />
        <MetricCard label="Aktif" value={activeCount} layout="simple" />
      </div>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={3} className="h-28 rounded-2xl" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pengguna"
          description="Tambah pengguna pertama untuk memberi akses login ke tim."
          action={
            canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to="/users/new">Tambah Pengguna</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {canCreate && (
        <Button asChild size="lg" className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 size-14 rounded-full p-0 shadow-lg md:hidden">
          <Link to="/users/new" aria-label="Tambah pengguna">
            <Plus className="size-6" />
          </Link>
        </Button>
      )}
    </PageShell>
  )
}
