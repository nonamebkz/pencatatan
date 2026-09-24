import { Link } from 'react-router-dom'
import { ChevronRight, Mail, Shield, UserRound } from 'lucide-react'

import type { UserRecord } from '@/api/users'
import { interactive, statusTone } from '@/lib/design'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function UserCard({ user }: { user: UserRecord }) {
  const primaryRole = user.roles[0]
  const isAdminLegacy = user.role === 'ADMIN'

  return (
    <Link
      to={`/users/${user.id}/edit`}
      className={cn(interactive.cardLink, !user.isActive && 'opacity-70')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isAdminLegacy ? <Shield className="size-5" /> : <UserRound className="size-5" />}
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
        {primaryRole ? (
          <Badge variant="secondary">{primaryRole.name}</Badge>
        ) : (
          <Badge variant="outline">{user.role}</Badge>
        )}
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            user.isActive ? statusTone.success : statusTone.danger,
          )}
        >
          {user.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
    </Link>
  )
}
