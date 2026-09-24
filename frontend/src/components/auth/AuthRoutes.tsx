import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

type PermissionRouteProps = {
  permission: string
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { loading, can: check } = useAuth()

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!check(permission)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}

/** @deprecated use PermissionRoute */
export function AdminRoute() {
  return <PermissionRoute permission="user.read" />
}

export function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
