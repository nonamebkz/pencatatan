import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type MobileSectionHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function MobileSectionHeader({ title, description, action, className }: MobileSectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}
