import { useEffect, useState } from 'react'

import { listCashAccounts, type CashAccount } from '@/api/finance'
import { listPonds, type Pond } from '@/api/water-quality'

/** Muat kas default + daftar kolam aktif untuk form keuangan. */
export function useCashAccountAndPonds() {
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [ponds, setPonds] = useState<Pond[]>([])
  const [cashAccountId, setCashAccountId] = useState('')

  useEffect(() => {
    listCashAccounts()
      .then((response) => {
        setAccounts(response.data)
        const defaultAccount = response.data.find((item) => item.isDefault) ?? response.data[0]
        if (defaultAccount) setCashAccountId(defaultAccount.id)
      })
      .catch(() => undefined)
    listPonds('ACTIVE')
      .then((response) => setPonds(response.data))
      .catch(() => undefined)
  }, [])

  return { accounts, ponds, cashAccountId, setCashAccountId }
}
