import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { TransactionRow } from '@/components/finance/TransactionRow'
import type { TransactionDayGroup } from '@/lib/finance/groupTransactionsByDate'
import { formatIDR } from '@/lib/format'
import { interactive } from '@/lib/design'
import { cn } from '@/lib/utils'

function formatDayHeading(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

type FinanceDayGroupProps = {
  group: TransactionDayGroup
  defaultExpanded?: boolean
}

export function FinanceDayGroup({ group, defaultExpanded = false }: FinanceDayGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const count = group.transactions.length

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 px-4 py-4 text-left transition',
          interactive.listRowHover,
          'touch-target',
        )}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{formatDayHeading(group.date)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {count} transaksi
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-destructive">-{formatIDR(group.totalAmount)}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total hari</p>
        </div>
        <ChevronDown
          className={cn('size-5 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t px-3 py-3 sm:px-4">
          {group.transactions.map((item) => (
            <TransactionRow key={item.id} item={item} showDetailLink />
          ))}
        </div>
      )}
    </section>
  )
}
