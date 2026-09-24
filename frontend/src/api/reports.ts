import { api } from '@/api/client'
import type { PeriodicContract } from '@/api/rent'
import type { PurchaseCategory, TransactionType } from '@/api/finance'

export type PurchaseReportRow = {
  transactionDate: string
  itemName: string
  category: PurchaseCategory
  qty: number
  unit: string
  unitPrice: number
  totalPrice: number
  supplierName?: string
  pondName?: string
  transactionId: string
}

export type PurchaseReportFooter = {
  totalAmount: number
  transactionCount: number
  lineCount: number
}

export type PriceHistoryEntry = {
  transactionDate: string
  itemName: string
  unitPrice: number
  priceDelta: number
  supplierName?: string
}

export type PriceHistoryFooter = {
  minPrice: number
  maxPrice: number
  lastPrice: number
}

export type OperationalSummaryReport = {
  periodFrom: string
  periodTo: string
  totalPurchases: number
  totalFeed: number
  totalRentPaid: number
  totalProfitSharePaid: number
  topPurchaseCategories: Array<{ category: string; amount: number }>
  byTransactionType: Array<{ transactionType: TransactionType; count: number; totalAmount: number }>
  grandTotalOperational: number
}

export type RentReportResponse = {
  contracts: PeriodicContract[]
  totalPaid: number
  totalRemaining: number
  footer: { activeContractCount: number; totalRemaining: number }
}

function withQuery(path: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, value)
  })
  const query = search.toString()
  return `${path}${query ? `?${query}` : ''}`
}

export function getPurchaseReport(params: { from?: string; to?: string; businessUnitId?: string }) {
  return api.get<{ items: PurchaseReportRow[]; footer: PurchaseReportFooter }>(
    withQuery('/reports/purchases', {
      from: params.from,
      to: params.to,
      businessUnitId: params.businessUnitId,
    }),
  )
}

export function getPriceHistoryReport(itemName: string) {
  return api.get<{ entries: PriceHistoryEntry[]; footer: PriceHistoryFooter }>(
    withQuery('/reports/price-history', { itemName }),
  )
}

export function searchPriceHistoryItems(q?: string) {
  return api.get<{ items: string[] }>(withQuery('/reports/price-history/items', { q }))
}

export function getRentReport(params?: { timeStatus?: string; paymentStatus?: string }) {
  return api.get<RentReportResponse>(
    withQuery('/reports/rent', {
      timeStatus: params?.timeStatus,
      paymentStatus: params?.paymentStatus,
    }),
  )
}

export function getOperationalSummaryReport(params?: { from?: string; to?: string }) {
  return api.get<OperationalSummaryReport>(
    withQuery('/reports/summary', { from: params?.from, to: params?.to }),
  )
}
