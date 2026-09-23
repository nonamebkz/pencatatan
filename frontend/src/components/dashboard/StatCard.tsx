import type { LucideIcon } from 'lucide-react'

import { iconBadge, surface, type IconTone } from '@/lib/design'

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: IconTone
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className={surface.metric}>
      <div className="mb-3 flex items-center justify-between">
        <div className={iconBadge(tone)}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  )
}
