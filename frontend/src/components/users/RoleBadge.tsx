import { cn } from '@/lib/utils'
import type { UserRole } from '@/api/auth'

const styles: Record<UserRole, string> = {
  ADMIN: 'bg-primary/10 text-primary',
  USER: 'bg-muted text-muted-foreground',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', styles[role])}>
      {role === 'ADMIN' ? 'Admin' : 'User'}
    </span>
  )
}
