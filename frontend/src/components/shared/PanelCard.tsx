import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { surface } from '@/lib/design'

export { ErrorAlert } from '@/components/shared/ErrorAlert'

type PanelCardProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  /** Kelas untuk wrapper isi; gunakan `p-0` jika padding hanya di child. */
  contentClassName?: string
}

export function PanelCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: PanelCardProps) {
  const hasHeader = Boolean(title || description)

  return (
    <section className={cn(surface.panel, className)}>
      {hasHeader && (
        <div className="border-b px-4 py-3 sm:px-5 sm:py-4 md:px-6">
          {title && <h3 className="text-base font-semibold sm:text-lg">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className={cn(hasHeader ? 'p-4 sm:p-5 md:p-6' : 'p-4 sm:p-5 md:p-6', contentClassName)}>
        {children}
      </div>
    </section>
  )
}
