import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const toneStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5', toneStyles[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}
