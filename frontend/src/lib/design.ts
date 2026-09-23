import { cn } from '@/lib/utils'

/** Token kelas Tailwind bersama — satu sumber untuk radius, surface, dan tone. */
export const surface = {
  panel: 'rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm',
  metric: 'rounded-2xl border bg-card p-4 shadow-sm',
  empty: 'rounded-2xl border border-dashed bg-card/50',
  stickyBar: 'border-t bg-background/95 backdrop-blur',
} as const

export const skeleton = {
  block: 'rounded-2xl',
  row: 'h-20 rounded-2xl',
  card: 'h-28 rounded-2xl',
} as const

export type IconTone = 'default' | 'success' | 'warning' | 'danger'

const iconToneClass: Record<IconTone, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'bg-destructive/10 text-destructive',
}

export function iconBadge(tone: IconTone = 'default', className?: string) {
  return cn('rounded-xl p-2', iconToneClass[tone], className)
}
