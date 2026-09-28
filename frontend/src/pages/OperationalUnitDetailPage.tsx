import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

import { deleteOperationalUnit, getOperationalUnit, type OperationalUnit } from '@/api/operational-units'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'

export function OperationalUnitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canPageAction } = useCatalogAccess()
  const canUpdate = canPageAction('page.operational_units.form', 'update')
  const canDelete = canPageAction('page.operational_units.detail', 'delete')
  const [unit, setUnit] = useState<OperationalUnit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getOperationalUnit(id)
      .then((response) => setUnit(response.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat unit'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!id || !window.confirm('Hapus unit ini? Transaksi terkait tidak ikut terhapus.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteOperationalUnit(id)
      navigate('/operational-units')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus unit')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </PageShell>
    )
  }

  if (!unit) {
    return (
      <PageShell>
        <ErrorAlert>Unit tidak ditemukan</ErrorAlert>
        <BackLink to="/operational-units" label="Kembali ke daftar unit" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <BackLink to="/operational-units" label="Kembali ke daftar unit" />
      <PageHeader
        title={unit.name}
        actions={
          <div className="flex gap-2">
            {canUpdate && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/operational-units/${unit.id}/edit`}>
                  <Pencil className="size-4" />
                  Ubah
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => void handleDelete()}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <PanelCard title="Ringkasan">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{unit.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}</dd>
          </div>
          {unit.location && (
            <div>
              <dt className="text-muted-foreground">Lokasi</dt>
              <dd>{unit.location}</dd>
            </div>
          )}
          {unit.notes && (
            <div>
              <dt className="text-muted-foreground">Catatan</dt>
              <dd className="whitespace-pre-wrap">{unit.notes}</dd>
            </div>
          )}
        </dl>
      </PanelCard>
    </PageShell>
  )
}
