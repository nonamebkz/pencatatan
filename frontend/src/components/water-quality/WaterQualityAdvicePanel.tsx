import type { WaterQualityAdviceItem, WaterQualityStatus } from '@/api/water-quality'
import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'

type WaterQualityAdvicePanelProps = {
  advice?: WaterQualityAdviceItem[]
  status?: WaterQualityStatus
  className?: string
}

export function WaterQualityAdvicePanel({ advice, status, className }: WaterQualityAdvicePanelProps) {
  if (!advice?.length || status === 'NORMAL') {
    return null
  }

  const isDanger = status === 'DANGER'

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
        <div className="min-w-0 space-y-3">
          <p className={cn('font-medium', isDanger ? 'text-destructive' : 'text-amber-900')}>Saran penanganan</p>
          {advice.map((block) => (
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
