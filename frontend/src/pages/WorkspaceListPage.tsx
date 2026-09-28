import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'

import { listAllWorkspaces, type Workspace } from '@/api/workspace'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { ListSkeleton } from '@/components/shared/ListSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { interactive, statusTone } from '@/lib/design'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { cn } from '@/lib/utils'

export function WorkspaceListPage() {
  const { canPageAction } = useCatalogAccess()
  const canCreate = canPageAction('page.workspaces.list', 'create')
  const [items, setItems] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAllWorkspaces()
      .then((res) => setItems(res.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat workspace'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <BackLink to="/" label="Beranda" shortLabel="Beranda" />
      <PageHeader
        title="Workspace"
        description="Kelola usaha dan workspace pribadi. Setelah dibuat, assign akses ke pengguna di menu Pengguna."
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      {loading ? (
        <ListSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada workspace"
          description="Tambah workspace usaha pertama Anda."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((ws) => (
            <li key={ws.id}>
              <Link
                to={`/settings/workspaces/${ws.id}/edit`}
                className={cn(interactive.listArticle, 'flex items-center gap-3 px-4 py-3')}
              >
                <Building2 className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{ws.name}</p>
                  <p className="text-xs text-muted-foreground">Template {ws.templateId}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    ws.type === 'PERSONAL' ? statusTone.muted : statusTone.success,
                  )}
                >
                  {ws.type === 'PERSONAL' ? 'Pribadi' : 'Usaha'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <MobileListFab to="/settings/workspaces/new" ariaLabel="Tambah workspace" />
      )}
    </PageShell>
  )
}
