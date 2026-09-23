import { cn } from '@/lib/utils'

export function CountBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
