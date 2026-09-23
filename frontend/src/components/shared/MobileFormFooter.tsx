import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { surface } from '@/lib/design'

type MobileFormFooterProps = {
  children: ReactNode
  className?: string
  maxWidthClassName?: string
}

export function MobileFormFooter({
  children,
  className,
  maxWidthClassName = 'max-w-3xl',
}: MobileFormFooterProps) {
  return (
    <div
      className={cn(
        'safe-bottom fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-20 p-3 md:hidden',
        surface.stickyBar,
        className,
      )}
    >
      <div className={cn('mx-auto flex gap-2', maxWidthClassName)}>{children}</div>
    </div>
  )
}
