import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getRole, listPermissions, type Permission, type Role } from '@/api/roles'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export function RoleFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getRole(id), listPermissions()])
      .then(([roleRes, permRes]) => {
        setRole(roleRes.data)
        setPermissions(permRes.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat peran'))
      .finally(() => setLoading(false))
  }, [id])

  const assigned = useMemo(() => new Set(role?.permissions ?? []), [role])

  if (loading) {
    return (
      <PageShell>
        <Skeleton className="h-64 rounded-2xl" />
      </PageShell>
    )
  }

  if (!role) {
    return (
      <PageShell>
        <ErrorAlert>Peran tidak ditemukan</ErrorAlert>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <BackLink to="/roles" label="Kembali ke daftar peran" />
      <PageHeader title={role.name} description={`Kode: ${role.code}`} />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {role.isSystem && (
        <InfoCallout>
          Role sistem — permission dikelola lewat seed. Ubah assignment user di halaman Pengguna (peran legacy ADMIN/USER).
        </InfoCallout>
      )}

      <PanelCard title="Permission">
        <ul className="divide-y">
          {permissions.map((perm) => {
            const active = assigned.has(perm.code)
            return (
              <li key={perm.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{perm.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{perm.code}</p>
                </div>
                <Badge variant={active ? 'default' : 'outline'}>{active ? 'Aktif' : '—'}</Badge>
              </li>
            )
          })}
        </ul>
      </PanelCard>

      <button type="button" className="sr-only" onClick={() => navigate('/roles')}>
        Kembali
      </button>
    </PageShell>
  )
}
