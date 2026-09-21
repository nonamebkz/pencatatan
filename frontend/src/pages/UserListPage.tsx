import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'

import type { AuthUser } from '@/api/auth'
import { listUsers } from '@/api/users'
import { UserCard } from '@/components/users/UserCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function UserListPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
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
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Pengguna"
        description="Kelola akun tim operasional kolam. Tidak ada pendaftaran mandiri."
        actions={
          <Button asChild size="lg" className="hidden md:inline-flex">
            <Link to="/users/new">
              <Plus className="size-4" />
              Tambah Pengguna
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:max-w-lg">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-semibold tabular-nums">{users.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total pengguna</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-semibold tabular-nums">{activeCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Aktif</p>
        </div>
      </div>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pengguna"
          description="Tambah pengguna pertama untuk memberi akses login ke tim."
          action={
            <Button asChild className="w-full sm:w-auto">
              <Link to="/users/new">Tambah Pengguna</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      <Button asChild size="lg" className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 size-14 rounded-full p-0 shadow-lg md:hidden">
        <Link to="/users/new" aria-label="Tambah pengguna">
          <Plus className="size-6" />
        </Link>
      </Button>
    </div>
  )
}
