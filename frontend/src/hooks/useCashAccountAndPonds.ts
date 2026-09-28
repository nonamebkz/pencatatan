import { useEffect, useState } from 'react'

import { listCashAccounts, type CashAccount } from '@/api/finance'
import { listPonds, type Pond } from '@/api/water-quality'

type Options = {
  loadPonds?: boolean
}

/** Muat kas default + daftar kolam aktif untuk form keuangan. */
export function useCashAccountAndPonds(options: Options = {}) {
  const loadPonds = options.loadPonds !== false
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [ponds, setPonds] = useState<Pond[]>([])
  const [cashAccountId, setCashAccountId] = useState('')
  const [accountsError, setAccountsError] = useState<string | null>(null)

  useEffect(() => {
    listCashAccounts()
      .then((response) => {
        setAccounts(response.data)
        setAccountsError(null)
        const defaultAccount = response.data.find((item) => item.isDefault) ?? response.data[0]
        if (defaultAccount) setCashAccountId(defaultAccount.id)
      })
      .catch((err) => {
        setAccountsError(err instanceof Error ? err.message : 'Gagal memuat akun kas')
      })
    if (loadPonds) {
      listPonds('ACTIVE')
        .then((response) => setPonds(response.data))
        .catch(() => undefined)
    }
  }, [loadPonds])

  return { accounts, ponds, cashAccountId, setCashAccountId, accountsError }
}
