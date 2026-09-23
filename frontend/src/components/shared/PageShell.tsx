import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-6 md:space-y-8', className)}>{children}</div>
}
