import type { ReactNode } from 'react'

import { surface } from '@/lib/design'
import { cn } from '@/lib/utils'

type ReportSummaryFooterProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function ReportSummaryFooter({ title = 'Ringkasan', children, className }: ReportSummaryFooterProps) {
  return (
    <footer className={cn(surface.metric, 'text-sm', className)}>
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </footer>
  )
}
