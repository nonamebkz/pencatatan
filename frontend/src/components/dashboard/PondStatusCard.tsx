import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Droplets, FlaskConical } from 'lucide-react'

import type { WaterQualitySummary } from '@/api/water-quality'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatDateTime(value?: string) {
  if (!value) return 'Belum pernah diukur'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const statusAccent = {
  NORMAL: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  WARNING: 'from-amber-500/25 via-amber-500/5 to-transparent',
  DANGER: 'from-red-500/25 via-red-500/5 to-transparent',
}

export function PondStatusCard({ summary }: { summary: WaterQualitySummary }) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-b', statusAccent[summary.status])} />

      <div className="relative space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{summary.businessUnitName}</h3>
            <p className="text-sm text-muted-foreground">{formatDateTime(summary.lastMeasuredAt)}</p>
          </div>
          <WaterQualityStatusBadge status={summary.status} />
        </div>

        {summary.notMeasuredToday && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="size-4 shrink-0" />
            Belum diukur hari ini
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FlaskConical className="size-3.5" />
              Ammonia
            </div>
            <p className="text-lg font-semibold">{summary.ammoniaPpm ?? '—'}</p>
            <p className="text-xs text-muted-foreground">ppm</p>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="size-3.5" />
              pH
            </div>
            <p className="text-lg font-semibold">{summary.ph ?? '—'}</p>
            <p className="text-xs text-muted-foreground">skala 0–14</p>
          </div>
        </div>

        <Button asChild variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
          <Link to={`/ponds/${summary.businessUnitId}`}>
            Lihat riwayat kolam
            <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
