import { Link } from 'react-router-dom'
import { ChevronRight, Fish, MapPin, Pencil, Plus } from 'lucide-react'

import type { Pond } from '@/api/water-quality'
import { DeleteIconButton } from '@/components/shared/DeleteButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PondCardProps = {
  pond: Pond
  canDelete?: boolean
  deleting?: boolean
  onDelete?: (pond: Pond) => void | Promise<void>
}

export function PondCard({ pond, canDelete, deleting, onDelete }: PondCardProps) {
  const isActive = pond.status === 'ACTIVE'

  return (
    <article className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
            <Fish className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{pond.name}</h3>
            <p className="mt-1 inline-flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2">{pond.location || 'Lokasi belum diisi'}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground',
            )}
          >
            {isActive ? 'Aktif' : 'Nonaktif'}
          </span>
          {canDelete && onDelete && (
            <DeleteIconButton
              label="Hapus kolam"
              confirmMessage={`Hapus kolam "${pond.name}"? Semua data terkait ikut terhapus: catatan kualitas air, batch, dan transaksi keuangan yang terhubung ke kolam ini.`}
              disabled={deleting}
              onConfirm={() => onDelete(pond)}
            />
          )}
        </div>
      </div>

      {pond.notes && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground sm:mt-4">{pond.notes}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5">
        <Button asChild variant="outline" size="sm" className="h-11 w-full touch-target">
          <Link to={`/ponds/${pond.id}`}>
            Detail
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-11 w-full touch-target">
          <Link to={`/ponds/${pond.id}/edit`}>
            <Pencil className="size-4" />
            Ubah
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-11 w-full touch-target">
          <Link to={`/water-quality/new?pondId=${pond.id}`}>
            <Plus className="size-4" />
            Catat
          </Link>
        </Button>
      </div>
    </article>
  )
}
