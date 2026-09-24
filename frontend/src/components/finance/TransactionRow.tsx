import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { type Transaction, transactionTypeLabel } from '@/api/finance'
import { formatIDR } from '@/lib/format'
import { interactive } from '@/lib/design'
import { cn } from '@/lib/utils'

type TransactionRowProps = {
  item: Transaction
  showDetailLink?: boolean
}

export function TransactionRow({ item, showDetailLink }: TransactionRowProps) {
  const canOpenDetail = Boolean(showDetailLink)
  const subtitle =
    item.description ||
    (item.transactionType === 'PURCHASE' && item.items?.length
      ? `${item.items.length} barang`
      : item.category || item.businessUnitName || '—')

  const inner = (
    <div
      className={cn(
        'flex items-center gap-3',
        interactive.listArticle,
        'transition',
        canOpenDetail && interactive.listRowHover,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {transactionTypeLabel(item.transactionType)}
          </span>
          <span className="text-xs text-muted-foreground">{item.transactionDate}</span>
        </div>
        <p className="mt-1 truncate text-sm font-medium">{subtitle}</p>
        {item.cashAccountName && (
          <p className="truncate text-xs text-muted-foreground">{item.cashAccountName}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 text-right">
        <p className="text-sm font-semibold text-destructive">-{formatIDR(item.amount)}</p>
        {canOpenDetail && <ChevronRight className="size-4 text-muted-foreground" />}
      </div>
    </div>
  )

  if (canOpenDetail) {
    return (
      <Link to={`/finance/transactions/${item.id}`} className="block">
        {inner}
      </Link>
    )
  }

  return inner
}
