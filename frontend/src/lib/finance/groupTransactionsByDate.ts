import type { Transaction } from '@/api/finance'

export type TransactionDayGroup = {
  date: string
  transactions: Transaction[]
  totalAmount: number
}

/** Mengelompokkan transaksi per `transactionDate`; urutan hari mengikuti urutan item (API: terbaru dulu). */
export function groupTransactionsByDate(items: Transaction[]): TransactionDayGroup[] {
  const order: string[] = []
  const byDate = new Map<string, Transaction[]>()

  for (const tx of items) {
    if (!byDate.has(tx.transactionDate)) {
      order.push(tx.transactionDate)
      byDate.set(tx.transactionDate, [])
    }
    byDate.get(tx.transactionDate)!.push(tx)
  }

  return order.map((date) => {
    const transactions = byDate.get(date) ?? []
    return {
      date,
      transactions,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    }
  })
}
