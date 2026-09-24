import { api } from '@/api/client'

export type PurchaseCategory = 'FEED' | 'TOOL' | 'MEDICINE' | 'MAINTENANCE' | 'SUPPLY' | 'OTHER'

export type TransactionType =
  | 'PURCHASE'
  | 'RENT_PAYMENT'
  | 'FEED_PURCHASE'
  | 'PROFIT_SHARE_PAYOUT'
  | 'OTHER_EXPENSE'
  | 'OTHER_INCOME'

export type CashAccount = {
  id: string
  name: string
  isDefault: boolean
}

export type PurchaseLineItem = {
  id: string
  itemName: string
  category: PurchaseCategory
  qty: number
  unit: string
  unitPrice: number
  totalPrice: number
  supplierName?: string
  notes?: string
}

export type Transaction = {
  id: string
  cashAccountId: string
  cashAccountName?: string
  transactionType: TransactionType
  amount: number
  transactionDate: string
  description?: string
  businessUnitId?: string
  businessUnitName?: string
  batchId?: string
  category?: string
  items?: PurchaseLineItem[]
  createdAt: string
}

export type FinanceSummary = {
  monthPurchases: number
  monthOtherExpenses: number
  monthTotalOut: number
  transactionCount: number
}

export type PurchaseItemInput = {
  itemName: string
  category: PurchaseCategory
  qty: number
  unit: string
  unitPrice: number
  supplierName?: string
  notes?: string
}

export type PurchaseInput = {
  cashAccountId?: string
  transactionDate: string
  description?: string
  businessUnitId?: string
  batchId?: string
  items: PurchaseItemInput[]
}

export type OtherExpenseInput = {
  cashAccountId?: string
  transactionDate: string
  amount: number
  description: string
  category?: string
  businessUnitId?: string
  batchId?: string
}


export function listCashAccounts() {
  return api.get<CashAccount[]>('/cash-accounts')
}

export function getCashAccount(id: string) {
  return api.get<CashAccount>(`/cash-accounts/${id}`)
}

export type CashAccountInput = {
  name: string
  isDefault?: boolean
}

export function createCashAccount(body: CashAccountInput) {
  return api.post<CashAccount>('/cash-accounts', body)
}

export function updateCashAccount(id: string, body: CashAccountInput) {
  return api.put<CashAccount>(`/cash-accounts/${id}`, body)
}

export function deleteCashAccount(id: string) {
  return api.delete(`/cash-accounts/${id}`)
}

export function getFinanceSummary() {
  return api.get<FinanceSummary>('/finance/summary')
}

export function listTransactions(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return api.get<Transaction[]>(`/transactions${query ? `?${query}` : ''}`)
}

export function getTransaction(id: string) {
  return api.get<Transaction>(`/transactions/${id}`)
}

export function getPurchase(id: string) {
  return api.get<Transaction>(`/purchases/${id}`)
}

export function createPurchase(body: PurchaseInput) {
  return api.post<Transaction>('/purchases', body)
}

export function createOtherExpense(body: OtherExpenseInput) {
  return api.post<Transaction>('/transactions/other-expenses', body)
}

export const purchaseCategoryLabels: Record<PurchaseCategory, string> = {
  FEED: 'Pakan',
  TOOL: 'Alat',
  MEDICINE: 'Obat',
  MAINTENANCE: 'Perawatan',
  SUPPLY: 'Perlengkapan',
  OTHER: 'Lainnya',
}

export function transactionTypeLabel(type: TransactionType) {
  switch (type) {
    case 'PURCHASE':
      return 'Pembelian'
    case 'OTHER_EXPENSE':
      return 'Pengeluaran'
    case 'RENT_PAYMENT':
      return 'Bayar sewa'
    default:
      return type
  }
}
