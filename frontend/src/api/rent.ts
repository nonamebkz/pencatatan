import { api } from '@/api/client'

export type PaymentScheme = 'LUMP_SUM' | 'INSTALLMENT'
export type ContractTimeStatus = 'ACTIVE' | 'EXPIRING' | 'ENDED'
export type ContractPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export type PaymentSchedule = {
  id: string
  contractId: string
  dueDate: string
  amount: number
  isPaid: boolean
  paidAt?: string
}

export type PeriodicContract = {
  id: string
  businessUnitId: string
  businessUnitName?: string
  startDate: string
  endDate: string
  durationMonths: number
  totalAmount: number
  paymentScheme: PaymentScheme
  monthlyEquivalent: number
  notes?: string
  timeStatus: ContractTimeStatus
  paymentStatus: ContractPaymentStatus
  paidAmount: number
  remainingAmount: number
  schedules?: PaymentSchedule[]
}

export type CreateRentContractInput = {
  businessUnitId: string
  startDate: string
  durationMonths: number
  totalAmount: number
  paymentScheme: PaymentScheme
  notes?: string
}

export function listRentContracts(params?: { businessUnitId?: string }) {
  const query = new URLSearchParams()
  if (params?.businessUnitId) query.set('businessUnitId', params.businessUnitId)
  const suffix = query.toString() ? `?${query}` : ''
  return api.get<PeriodicContract[]>(`/rent-contracts${suffix}`)
}

export function getRentContract(id: string) {
  return api.get<PeriodicContract>(`/rent-contracts/${id}`)
}

export function createRentContract(body: CreateRentContractInput) {
  return api.post<{ contract: PeriodicContract; schedules: PaymentSchedule[] }>('/rent-contracts', body)
}

export function payRentSchedule(
  scheduleId: string,
  body: { paymentDate: string; cashAccountId: string; notes?: string },
) {
  return api.post<{ payment: unknown; transaction: { id: string } }>(
    `/rent-contracts/schedules/${scheduleId}/pay`,
    body,
  )
}

export const paymentSchemeLabel: Record<PaymentScheme, string> = {
  LUMP_SUM: 'Sekaligus',
  INSTALLMENT: 'Cicilan bulanan',
}

export const timeStatusLabel: Record<ContractTimeStatus, string> = {
  ACTIVE: 'Aktif',
  EXPIRING: 'Hampir berakhir',
  ENDED: 'Berakhir',
}

export const paymentStatusLabel: Record<ContractPaymentStatus, string> = {
  UNPAID: 'Belum bayar',
  PARTIAL: 'Sebagian',
  PAID: 'Lunas',
}
