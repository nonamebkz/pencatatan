import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Fish, Plus } from 'lucide-react'

import { deletePond, listPonds, type Pond } from '@/api/water-quality'
import { PondCard } from '@/components/ponds/PondCard'
import { CountBadge } from '@/components/shared/CountBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileListFab } from '@/components/shared/MobileListFab'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { skeleton } from '@/lib/design'

export function PondListPage() {
  const { canPageAction } = useCatalogAccess()
  const canCreate = canPageAction('page.ponds.form', 'create')
  const canUpdate = canPageAction('page.ponds.form', 'update')
  const canRecordWQ = canPageAction('page.water_quality.form', 'create')
  const canDeletePond = canPageAction('page.ponds.detail', 'delete')
  const [ponds, setPonds] = useState<Pond[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listPonds()
      .then((response) => setPonds(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeletePond = async (pond: Pond) => {
    setDeletingId(pond.id)
    setError(null)
    try {
      await deletePond(pond.id)
      setPonds((prev) => prev.filter((item) => item.id !== pond.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kolam')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Kolam"
        description="Kelola master kolam sebelum mencatat kualitas air harian."
        actions={
          canCreate ? (
            <Button asChild size="lg" className="hidden md:inline-flex">
              <Link to="/ponds/new">
                <Plus className="size-4" />
                Tambah kolam
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="flex justify-end">
        <CountBadge>{ponds.length} kolam</CountBadge>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className={`${skeleton.block} h-44`} />
          ))}
        </div>
      ) : ponds.length === 0 ? (
        <EmptyState
          icon={Fish}
          title="Belum ada kolam"
          description="Tambah kolam pertama untuk mulai monitoring kualitas air."
          action={
            canCreate ? (
              <Button asChild className="w-full sm:w-auto">
                <Link to="/ponds/new">Tambah kolam</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ponds.map((pond) => (
            <PondCard
              key={pond.id}
              pond={pond}
              canUpdate={canUpdate}
              canRecordWaterQuality={canRecordWQ}
              canDelete={canDeletePond}
              deleting={deletingId === pond.id}
              onDelete={handleDeletePond}
            />
          ))}
        </div>
      )}

      {canCreate && <MobileListFab to="/ponds/new" ariaLabel="Tambah kolam" />}
    </PageShell>
  )
}
