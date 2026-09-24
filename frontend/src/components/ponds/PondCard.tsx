import { Link } from 'react-router-dom'
import { ChevronRight, Fish, MapPin, Pencil, Plus } from 'lucide-react'

import type { Pond } from '@/api/water-quality'
import { DeleteIconButton } from '@/components/shared/DeleteButton'
import { Button } from '@/components/ui/button'
import { interactive, statusTone } from '@/lib/design'
import { cn } from '@/lib/utils'

type PondCardProps = {
  pond: Pond
  canUpdate?: boolean
  canRecordWaterQuality?: boolean
  canDelete?: boolean
  deleting?: boolean
  onDelete?: (pond: Pond) => void | Promise<void>
}

export function PondCard({ pond, canUpdate = false, canRecordWaterQuality = false, canDelete, deleting, onDelete }: PondCardProps) {
  const isActive = pond.status === 'ACTIVE'

  return (
    <article
      className={cn('group p-4 sm:p-5', interactive.listArticle, interactive.listArticleHover)}
    >
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
              isActive ? statusTone.success : statusTone.muted,
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

      <div
        className={cn(
          'mt-4 grid gap-2 sm:mt-5',
          canUpdate && canRecordWaterQuality ? 'grid-cols-3' : canUpdate || canRecordWaterQuality ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        <Button asChild variant="outline" size="sm" className="h-11 w-full touch-target">
          <Link to={`/ponds/${pond.id}`}>
            Detail
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        {canUpdate && (
          <Button asChild variant="outline" size="sm" className="h-11 w-full touch-target">
            <Link to={`/ponds/${pond.id}/edit`}>
              <Pencil className="size-4" />
              Ubah
            </Link>
          </Button>
        )}
        {canRecordWaterQuality && (
          <Button asChild variant="ghost" size="sm" className="h-11 w-full touch-target">
            <Link to={`/water-quality/new?pondId=${pond.id}`}>
              <Plus className="size-4" />
              Catat
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}
