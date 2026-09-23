import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { iconBadge, surface, type IconTone } from '@/lib/design'

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: IconTone
  layout?: 'simple' | 'inline'
  className?: string
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  layout,
  className,
}: MetricCardProps) {
  const resolvedLayout = layout ?? (Icon ? 'inline' : 'simple')

  if (resolvedLayout === 'simple') {
    return (
      <div className={cn(surface.metric, className)}>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
      </div>
    )
  }

  return (
    <div className={cn(surface.metric, 'flex items-start gap-3', className)}>
      {Icon && (
        <div className={iconBadge(tone)}>
          <Icon className="size-4" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
      </div>
    </div>
  )
}
