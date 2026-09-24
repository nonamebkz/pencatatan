import type { ReactNode } from 'react'

import { surface } from '@/lib/design'
import { cn } from '@/lib/utils'

type ReportDataListProps = {
  children: ReactNode
  className?: string
}

export function ReportDataList({ children, className }: ReportDataListProps) {
  return <ul className={cn(surface.panel, 'divide-y overflow-hidden', className)}>{children}</ul>
}

export function ReportDataListItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={cn('p-4 text-sm', className)}>{children}</li>
}
