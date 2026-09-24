import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Shield } from 'lucide-react'

import { listRoles, type Role } from '@/api/roles'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { PermRoleRead } from '@/lib/permissions'

export function RoleListPage() {
  const { can: check } = useAuth()
  const { canPageAction } = useCatalogAccess()
  const canCreate = canPageAction('page.roles.list', 'create')
  const [roles, setRoles] = useState<Role[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listRoles()
      .then((response) => setRoles(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat peran'))
      .finally(() => setLoading(false))
  }, [])

  if (!check(PermRoleRead)) {
    return null
  }

  return (
    <PageShell>
      <PageHeader
        title="Peran"
        description="Paket permission untuk tim. Tambah peran custom atau ubah permission per role."
        actions={
          canCreate ? (
            <Button asChild size="lg" className="hidden md:inline-flex">
              <Link to="/roles/new">
                <Plus className="size-4" />
                Tambah Peran
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={3} />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Belum ada peran"
          description="Jalankan migrasi RBAC atau buat peran pertama."
          action={
            canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to="/roles/new">Tambah Peran</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <PanelCard key={role.id} title={role.name} contentClassName="p-0">
              <Link
                to={`/roles/${role.id}/edit`}
                className="flex flex-col gap-2 px-4 py-4 transition hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{role.code}</p>
                  {role.description && <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {role.isSystem && <Badge variant="secondary">Sistem</Badge>}
                  <Badge variant="outline">{role.permissions?.length ?? 0} permission</Badge>
                </div>
              </Link>
            </PanelCard>
          ))}
        </div>
      )}

      {canCreate && <MobileListFab to="/roles/new" ariaLabel="Tambah peran" />}
    </PageShell>
  )
}
