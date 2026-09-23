import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Droplets, FlaskConical } from 'lucide-react'

import type { WaterQualitySummary } from '@/api/water-quality'
import { WaterQualityAdvicePanel } from '@/components/water-quality/WaterQualityAdvicePanel'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const statusAccent = {
  NORMAL: 'border-emerald-500/20 bg-emerald-500/[0.04]',
  WARNING: 'border-amber-500/30 bg-amber-500/[0.06]',
  DANGER: 'border-red-500/30 bg-red-500/[0.06]',
}

export function PondStatusCard({ summary }: { summary: WaterQualitySummary }) {
  return (
    <Link
      to={`/ponds/${summary.businessUnitId}`}
      className={cn(
        'group block rounded-2xl border p-4 shadow-sm transition active:scale-[0.99] md:p-5 md:hover:-translate-y-0.5 md:hover:shadow-md',
        statusAccent[summary.status],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{summary.businessUnitName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.lastMeasuredAt
              ? formatDateTime(summary.lastMeasuredAt)
              : 'Belum pernah diukur'}
          </p>
        </div>
        <WaterQualityStatusBadge status={summary.status} />
      </div>

      {summary.notMeasuredToday && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="size-3.5 shrink-0" />
          Belum diukur hari ini
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-background/80 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FlaskConical className="size-3.5" />
            Ammonia
          </div>
          <p className="text-xl font-semibold tabular-nums">{summary.ammoniaPpm ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">ppm</p>
        </div>
        <div className="rounded-xl border bg-background/80 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Droplets className="size-3.5" />
            pH
          </div>
          <p className="text-xl font-semibold tabular-nums">{summary.ph ?? '—'}</p>
        </div>
      </div>

      <WaterQualityAdvicePanel
        advice={summary.advice}
        status={summary.status}
        variant="summary"
        className="mt-4"
      />

      <div className="mt-4 flex items-center justify-between text-xs font-medium text-primary md:text-sm">
        <span>Lihat riwayat</span>
        <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
