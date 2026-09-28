import { Building2, User } from 'lucide-react'

import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type WorkspaceSwitcherProps = {
  className?: string
  compact?: boolean
}

export function WorkspaceSwitcher({ className, compact }: WorkspaceSwitcherProps) {
  const { workspaces, activeId, loading, switchWorkspace } = useWorkspace()

  if (loading) {
    return <Skeleton className={cn('h-11 w-full rounded-2xl', className)} />
  }

  if (workspaces.length <= 1) {
    const only = workspaces[0]
    if (!only) return null
    return (
      <p className={cn('truncate text-sm font-medium text-foreground', className)}>
        {only.name}
      </p>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {!compact && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
      )}
      <div className="relative">
        <Select
          className="rounded-2xl pr-9"
          value={activeId}
          onChange={(event) => switchWorkspace(event.target.value)}
          aria-label="Pilih workspace"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.type === 'PERSONAL' ? 'Pribadi — ' : ''}
              {ws.name}
            </option>
          ))}
        </Select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {workspaces.find((w) => w.id === activeId)?.type === 'PERSONAL' ? (
            <User className="size-4" />
          ) : (
            <Building2 className="size-4" />
          )}
        </span>
      </div>
    </div>
  )
}
