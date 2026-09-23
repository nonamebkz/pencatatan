import { Link } from 'react-router-dom'
import { ChevronRight, Landmark, Star } from 'lucide-react'

import type { CashAccount } from '@/api/finance'
import { cn } from '@/lib/utils'

export function CashAccountCard({ account }: { account: CashAccount }) {
  return (
    <Link
      to={`/finance/cash-accounts/${account.id}/edit`}
      className="block rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Landmark className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{account.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Dipakai saat catat pembelian & pengeluaran</p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>

      {account.isDefault && (
        <div className="mt-4">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
              'bg-primary/10 text-primary',
            )}
          >
            <Star className="size-3 fill-current" />
            Default
          </span>
        </div>
      )}
    </Link>
  )
}
