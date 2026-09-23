import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'

import { cn } from '@/lib/utils'

type InfoCalloutProps = {
  children: ReactNode
  icon?: LucideIcon
  className?: string
}

export function InfoCallout({ children, icon: Icon = Info, className }: InfoCalloutProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-muted-foreground sm:px-4',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 [&_p]:leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
