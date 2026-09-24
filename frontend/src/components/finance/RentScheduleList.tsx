import { CheckCircle2, Wallet } from 'lucide-react'

import type { PaymentSchedule } from '@/api/rent'
import { ReportDataList, ReportDataListItem } from '@/components/reports/ReportDataList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/lib/format'

type RentScheduleListProps = {
  schedules: PaymentSchedule[]
  canPay: boolean
  payingId: string | null
  onPay: (schedule: PaymentSchedule) => void
}

export function RentScheduleList({ schedules, canPay, payingId, onPay }: RentScheduleListProps) {
  return (
    <ReportDataList>
      {schedules.map((schedule) => (
        <ReportDataListItem key={schedule.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium tabular-nums">{formatIDR(schedule.amount)}</p>
              <p className="text-xs text-muted-foreground">Jatuh tempo {schedule.dueDate}</p>
            </div>
            {schedule.isPaid ? (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" aria-hidden />
                Lunas
              </span>
            ) : canPay ? (
              <Button
                type="button"
                size="sm"
                className="w-full touch-target sm:w-auto"
                disabled={payingId === schedule.id}
                onClick={() => onPay(schedule)}
              >
                <Wallet className="size-4" />
                {payingId === schedule.id ? 'Memproses…' : 'Catat bayar'}
              </Button>
            ) : (
              <Badge variant="outline">Belum bayar</Badge>
            )}
          </div>
        </ReportDataListItem>
      ))}
    </ReportDataList>
  )
}
