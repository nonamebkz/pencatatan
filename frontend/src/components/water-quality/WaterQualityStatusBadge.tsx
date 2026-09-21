import type { WaterQualityStatus } from '@/api/water-quality'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const labels: Record<WaterQualityStatus, string> = {
  NORMAL: 'Normal',
  WARNING: 'Waspada',
  DANGER: 'Bahaya',
}

const variants: Record<WaterQualityStatus, 'success' | 'warning' | 'destructive'> = {
  NORMAL: 'success',
  WARNING: 'warning',
  DANGER: 'destructive',
}

export function WaterQualityStatusBadge({
  status,
  className,
}: {
  status: WaterQualityStatus
  className?: string
}) {
  return (
    <Badge variant={variants[status]} className={cn(className)}>
      {labels[status]}
    </Badge>
  )
}
