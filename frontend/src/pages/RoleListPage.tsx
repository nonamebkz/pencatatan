import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

import { listRoles, type Role } from '@/api/roles'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { PermRoleRead } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'

export function RoleListPage() {
  const { can: check } = useAuth()
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
        description="Paket permission untuk tim. Role sistem tidak dapat diubah permission-nya."
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={3} />
      ) : roles.length === 0 ? (
        <EmptyState icon={Shield} title="Belum ada peran" description="Jalankan migrasi RBAC di backend." />
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
    </PageShell>
  )
}
