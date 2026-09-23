import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { clearStoredToken, fetchMe, getStoredToken, login as loginRequest, logout as logoutRequest, setStoredToken, type AuthUser } from '@/api/auth'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  /** Semua user login — lihat seluruh pencatatan workspace (tanpa filter per user). */
  canViewAllRecords: boolean
  /** Hanya ADMIN — hapus kolam, catatan, pengguna, kas */
  canDelete: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      return
    }
    const response = await fetchMe()
    setUser(response.data)
  }, [])

  useEffect(() => {
    refreshUser()
      .catch(() => {
        clearStoredToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password)
    setStoredToken(response.data.token)
    setUser(response.data.user)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'ADMIN',
      canViewAllRecords: Boolean(user),
      canDelete: user?.role === 'ADMIN',
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
