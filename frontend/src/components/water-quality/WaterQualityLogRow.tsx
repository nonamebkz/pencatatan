import { Link } from 'react-router-dom'
import { ChevronRight, Droplets, FlaskConical, Pencil } from 'lucide-react'

import type { WaterQualityLog } from '@/api/water-quality'
import { DeleteIconButton } from '@/components/shared/DeleteButton'
import { WaterQualityAdvicePanel } from '@/components/water-quality/WaterQualityAdvicePanel'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { interactive } from '@/lib/design'
import { formatDateTime } from '@/lib/format'

type WaterQualityLogRowProps = {
  log: WaterQualityLog
  canUpdate?: boolean
  canDelete?: boolean
  deleting?: boolean
  onDelete?: (log: WaterQualityLog) => void | Promise<void>
}

export function WaterQualityLogRow({
  log,
  canUpdate = false,
  canDelete,
  deleting,
  onDelete,
}: WaterQualityLogRowProps) {
  return (
    <article className={interactive.listArticle}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {log.businessUnitName && <p className="font-semibold">{log.businessUnitName}</p>}
            <WaterQualityStatusBadge status={log.status} />
          </div>
          <p className="text-xs text-muted-foreground">{formatDateTime(log.measuredAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {canDelete && onDelete && (
            <DeleteIconButton
              label="Hapus catatan"
              confirmMessage="Hapus catatan kualitas air ini? Tindakan tidak dapat dibatalkan."
              disabled={deleting}
              onConfirm={() => onDelete(log)}
            />
          )}
          {canUpdate && (
            <Button asChild variant="ghost" size="sm" className="size-9 shrink-0 touch-target p-0">
              <Link to={`/water-quality/${log.id}/edit`} aria-label="Edit catatan">
                <Pencil className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className={interactive.metricCell}>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FlaskConical className="size-3.5" />
            Ammonia
          </div>
          <p className="text-lg font-semibold tabular-nums">{log.ammoniaPpm ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">ppm</p>
        </div>
        <div className={interactive.metricCell}>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Droplets className="size-3.5" />
            pH
          </div>
          <p className="text-lg font-semibold tabular-nums">{log.ph ?? '—'}</p>
        </div>
      </div>

      {log.notes && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{log.notes}</p>
      )}

      <WaterQualityAdvicePanel advice={log.advice} status={log.status} variant="collapsible" className="mt-3" />

      <Link
        to={`/water-quality/${log.id}`}
        className="mt-3 flex items-center justify-between text-xs font-medium text-primary md:hidden"
      >
        Lihat detail
        <ChevronRight className="size-4" />
      </Link>
    </article>
  )
}
