import type { ReactNode } from 'react'
import { useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MobileFilterPanelProps = {
  title?: string
  description?: string
  children: ReactNode
  onApply?: () => void
  applyLabel?: string
  className?: string
  /** Di desktop, sembunyikan judul panel agar field dan tombol satu baris. */
  desktopHeader?: boolean
}

export function MobileFilterPanel({
  title = 'Filter',
  description,
  children,
  onApply,
  applyLabel = 'Terapkan',
  className,
  desktopHeader = false,
}: MobileFilterPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className={cn('rounded-2xl border bg-card/80 shadow-sm', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Filter className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <ChevronDown className={cn('size-4 text-muted-foreground transition', open && 'rotate-180')} />
      </button>

      {desktopHeader && (
        <div className="hidden border-b px-5 py-4 md:block">
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <div
        className={cn(
          'p-4 md:p-6',
          !open && 'hidden md:block',
          !desktopHeader && 'md:flex md:items-end md:gap-4 md:p-4',
        )}
      >
        <div className={cn(!desktopHeader && 'min-w-0 md:flex-1')}>{children}</div>
        {onApply && (
          <div className={cn('mt-4', !desktopHeader && 'md:mt-0 md:shrink-0')}>
            <Button onClick={onApply} className="touch-target w-full md:w-auto">
              <Filter className="size-4" />
              {applyLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
