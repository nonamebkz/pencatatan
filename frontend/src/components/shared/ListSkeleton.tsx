import { Skeleton } from '@/components/ui/skeleton'
import { skeleton } from '@/lib/design'

export function ListSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={className ?? skeleton.row} />
      ))}
    </div>
  )
}
