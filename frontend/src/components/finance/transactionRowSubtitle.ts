import { type Transaction, transactionTypeLabel } from '@/api/finance'

/** Ringkasan satu baris untuk daftar transaksi (list API tidak selalu membawa `items[]`). */
export function transactionRowSubtitle(item: Transaction): string {
  const description = item.description?.trim()
  if (description) return description

  const lineCount = item.lineItemCount ?? item.items?.length ?? 0
  const firstName = item.firstItemName?.trim() || item.items?.[0]?.itemName?.trim()

  if (item.transactionType === 'PURCHASE') {
    if (firstName && lineCount > 1) return `${firstName} (+${lineCount - 1} barang)`
    if (firstName) return firstName
    if (lineCount > 0) return `${lineCount} barang`
    return 'Pembelian barang'
  }

  const category = item.category?.trim()
  if (category) return category

  const pond = item.businessUnitName?.trim()
  if (pond) return pond

  return transactionTypeLabel(item.transactionType)
}
