import { Link } from 'react-router-dom'

import {
  paymentSchemeLabel,
  paymentStatusLabel,
  timeStatusLabel,
  type PeriodicContract,
} from '@/api/rent'
import { rentStatusBadgeVariant } from '@/components/finance/rentStatus'
import { Badge } from '@/components/ui/badge'
import { interactive } from '@/lib/design'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

type RentContractCardProps = {
  contract: PeriodicContract
}

export function RentContractCard({ contract }: RentContractCardProps) {
  return (
    <Link
      to={`/finance/rent/${contract.id}`}
      className={cn(interactive.listArticle, interactive.listRowHover, 'block space-y-3')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-foreground">{contract.businessUnitName ?? 'Kolam'}</p>
        <span className="text-xs text-muted-foreground">{paymentSchemeLabel[contract.paymentScheme]}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={rentStatusBadgeVariant(contract.timeStatus, contract.paymentStatus)}>
          {timeStatusLabel[contract.timeStatus]}
        </Badge>
        <Badge variant="outline">{paymentStatusLabel[contract.paymentStatus]}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {contract.startDate} — {contract.endDate} · {contract.durationMonths} bulan
      </p>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <span>
          Total <span className="font-semibold tabular-nums">{formatIDR(contract.totalAmount)}</span>
        </span>
        <span className={cn(contract.remainingAmount > 0 && 'text-destructive')}>
          Sisa <span className="font-semibold tabular-nums">{formatIDR(contract.remainingAmount)}</span>
        </span>
      </div>
    </Link>
  )
}
