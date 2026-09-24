import { cn } from '@/lib/utils'

/** Token kelas Tailwind bersama — satu sumber untuk radius, surface, dan tone. */
export const surface = {
  panel: 'rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm',
  metric: 'rounded-2xl border bg-card p-4 shadow-sm',
  empty: 'rounded-2xl border border-dashed bg-card/50',
  stickyBar: 'border-t bg-background/95 backdrop-blur',
} as const

/** Kartu list / link domain — hindari copy `rounded-2xl border bg-card`. */
export const interactive = {
  cardLink: 'block rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.99]',
  listArticle: 'rounded-2xl border bg-card p-4 shadow-sm',
  listArticleHover: 'transition hover:-translate-y-0.5 hover:shadow-md',
  listRowHover: 'hover:border-primary/30',
  metricCell: 'rounded-2xl bg-muted/60 p-3',
  metricCellOutlined: 'rounded-2xl border bg-background/80 p-3',
} as const

/** Border/background kartu dashboard per status kualitas air. */
export const wqStatusSurface = {
  NORMAL: 'border-emerald-500/20 bg-emerald-500/[0.04]',
  WARNING: 'border-amber-500/30 bg-amber-500/[0.06]',
  DANGER: 'border-destructive/30 bg-destructive/[0.06]',
} as const

export const alertInline = {
  warning:
    'flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200',
} as const

export const skeleton = {
  block: 'rounded-2xl',
  row: 'h-20 rounded-2xl',
  card: 'h-28 rounded-2xl',
} as const

/** Lebar konten halaman — pakai dengan `PageShell className={pageLayout.formSm}` */
export const pageLayout = {
  formSm: 'mx-auto max-w-2xl pb-24 md:pb-0',
  formLg: 'mx-auto max-w-3xl pb-24 md:pb-0',
  detail: 'mx-auto max-w-2xl',
  detailLg: 'mx-auto max-w-3xl',
} as const

/** Badge status aktif/nonaktif — pakai dengan `rounded-full px-2.5 py-1 text-xs font-medium`. */
export const statusTone = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  muted: 'bg-muted text-muted-foreground',
  danger: 'bg-destructive/10 text-destructive',
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
