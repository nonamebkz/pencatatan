import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  clearStoredToken,
  fetchMe,
  getStoredToken,
  login as loginRequest,
  logout as logoutRequest,
  setStoredToken,
  type AuthSession,
  type AuthUser,
  type RoleSummary,
} from '@/api/auth'
import { can, canAny, PermCashAccountDelete, PermPondDelete, PermUserCreate, PermUserDelete, PermUserRead, PermUserUpdate, PermWaterQualityDelete } from '@/lib/permissions'

type AuthContextValue = {
  user: AuthUser | null
  permissions: string[]
  roles: RoleSummary[]
  loading: boolean
  can: (code: string) => boolean
  canAny: (codes: string[]) => boolean
  /** @deprecated gunakan can(PermUserRead) */
  isAdmin: boolean
  canViewAllRecords: boolean
  canDelete: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applySession(setUser: (u: AuthUser | null) => void, setPermissions: (p: string[]) => void, setRoles: (r: RoleSummary[]) => void, session: AuthSession) {
  setUser(session.user)
  setPermissions(session.permissions ?? [])
  setRoles(session.roles ?? [])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setPermissions([])
      setRoles([])
      return
    }
    const response = await fetchMe()
    applySession(setUser, setPermissions, setRoles, response.data)
  }, [])

  useEffect(() => {
    refreshUser()
      .catch(() => {
        clearStoredToken()
        setUser(null)
        setPermissions([])
        setRoles([])
      })
      .finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password)
    setStoredToken(response.data.token)
    applySession(setUser, setPermissions, setRoles, response.data)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setPermissions([])
    setRoles([])
  }, [])

  const value = useMemo(() => {
    const check = (code: string) => can(permissions, code)
    const checkAny = (codes: string[]) => canAny(permissions, codes)
    return {
      user,
      permissions,
      roles,
      loading,
      can: check,
      canAny: checkAny,
      isAdmin: check(PermUserRead),
      canViewAllRecords: Boolean(user),
      canDelete: checkAny([PermPondDelete, PermUserDelete, PermWaterQualityDelete, PermCashAccountDelete]),
      login,
      logout,
      refreshUser,
    }
  }, [user, permissions, roles, loading, login, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useCanCreateUser() {
  const { can: check } = useAuth()
  return check(PermUserCreate)
}

export function useCanUpdateUser() {
  const { can: check } = useAuth()
  return check(PermUserUpdate)
}
