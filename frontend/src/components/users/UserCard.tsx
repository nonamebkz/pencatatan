import { Link } from 'react-router-dom'
import { ChevronRight, Mail, Shield, UserRound } from 'lucide-react'

import type { AuthUser } from '@/api/auth'
import { RoleBadge } from '@/components/users/RoleBadge'
import { cn } from '@/lib/utils'

export function UserCard({ user }: { user: AuthUser }) {
  return (
    <Link
      to={`/users/${user.id}/edit`}
      className={cn(
        'block rounded-2xl border bg-card p-4 shadow-sm transition active:scale-[0.99]',
        !user.isActive && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {user.role === 'ADMIN' ? <Shield className="size-5" /> : <UserRound className="size-5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="size-3.5" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RoleBadge role={user.role} />
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-medium',
            user.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700',
          )}
        >
          {user.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
    </Link>
  )
}
