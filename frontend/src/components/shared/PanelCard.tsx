import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function ErrorAlert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive', className)}>
      {children}
    </div>
  )
}

export function PanelCard({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm', className)}>
      {(title || description) && (
        <div className="border-b px-4 py-3 sm:px-5 sm:py-4 md:px-6">
          {title && <h3 className="text-base font-semibold sm:text-lg">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="p-4 sm:p-5 md:p-6">{children}</div>
    </section>
  )
}
