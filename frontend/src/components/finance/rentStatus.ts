import type { PeriodicContract } from '@/api/rent'

export function rentStatusBadgeVariant(
  time: PeriodicContract['timeStatus'],
  pay: PeriodicContract['paymentStatus'],
): 'default' | 'secondary' | 'outline' {
  if (pay === 'PAID') return 'secondary'
  if (time === 'ENDED') return 'outline'
  if (time === 'EXPIRING' || pay === 'PARTIAL') return 'default'
  return 'outline'
}
