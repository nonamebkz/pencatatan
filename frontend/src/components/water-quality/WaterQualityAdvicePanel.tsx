import { useState } from 'react'
import type { WaterQualityAdviceItem, WaterQualityStatus } from '@/api/water-quality'
import { AlertTriangle, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type WaterQualityAdvicePanelProps = {
  advice?: WaterQualityAdviceItem[]
  status?: WaterQualityStatus
  className?: string
  /** full: langkah lengkap. collapsible: ringkas, bisa dibuka. summary: satu baris saja. */
  variant?: 'full' | 'collapsible' | 'summary'
}

export function WaterQualityAdvicePanel({
  advice,
  status,
  className,
  variant = 'full',
}: WaterQualityAdvicePanelProps) {
  const [open, setOpen] = useState(false)

  if (!advice?.length || status === 'NORMAL') {
    return null
  }

  const isDanger = status === 'DANGER'
  const summary = advice.map((block) => block.title).join(' · ')
  const showSteps = variant === 'full' || (variant === 'collapsible' && open)

  return (
    <div
      className={cn(
        'rounded-2xl border px-3 py-3 text-sm sm:px-4',
        isDanger ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={cn('mt-0.5 size-4 shrink-0', isDanger ? 'text-destructive' : 'text-amber-700')}
        />
        <div className="min-w-0 flex-1 space-y-3">
          {variant === 'collapsible' ? (
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 text-left"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
            >
              <span className="min-w-0">
                <span className={cn('block font-medium', isDanger ? 'text-destructive' : 'text-amber-900')}>
                  Saran penanganan
                </span>
                {!open && <span className="mt-0.5 block text-muted-foreground">{summary}</span>}
              </span>
              <ChevronDown
                className={cn('mt-0.5 size-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')}
              />
            </button>
          ) : (
            <p className={cn('font-medium', isDanger ? 'text-destructive' : 'text-amber-900')}>
              {variant === 'summary' ? summary : 'Saran penanganan'}
            </p>
          )}

          {showSteps &&
            advice.map((block) => (
              <div key={block.code}>
                <p className="font-medium text-foreground">{block.title}</p>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-muted-foreground">
                  {block.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
