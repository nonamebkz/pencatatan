import { useEffect, useRef, useState } from 'react'
import { Building2, Check, ChevronDown, User } from 'lucide-react'

import type { Workspace } from '@/api/workspace'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { iconBadge, interactive, surface } from '@/lib/design'
import { cn } from '@/lib/utils'

type WorkspaceSwitcherProps = {
  className?: string
  /** Header mobile: trigger lebar penuh + daftar pilihan */
  compact?: boolean
}

function workspaceKindLabel(ws: Workspace) {
  return ws.type === 'PERSONAL' ? 'Catatan pribadi' : 'Operasional usaha'
}

function WorkspaceKindIcon({ type, className }: { type: Workspace['type']; className?: string }) {
  const Icon = type === 'PERSONAL' ? User : Building2
  return <Icon className={cn('size-4 shrink-0', className)} />
}

export function WorkspaceSwitcher({ className, compact }: WorkspaceSwitcherProps) {
  const { workspaces, activeId, loading, switchWorkspace, activeWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [activeId])

  if (loading) {
    return (
      <Skeleton
        className={cn('h-11 w-full rounded-2xl', compact ? 'rounded-xl' : undefined, className)}
      />
    )
  }

  if (workspaces.length <= 1) {
    const only = workspaces[0]
    if (!only) return null
    if (compact) return null
    return (
      <p className={cn('truncate text-sm font-medium text-foreground', className)}>{only.name}</p>
    )
  }

  if (compact) {
    const active = activeWorkspace ?? workspaces.find((w) => w.id === activeId)
    if (!active) return null

    return (
      <div ref={rootRef} className={cn('relative w-full', className)}>
        <button
          type="button"
          className={cn(
            interactive.listArticle,
            'touch-target flex w-full items-center gap-3 px-3 py-2.5 text-left active:scale-[0.99]',
            open && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
          )}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Pilih workspace"
        >
          <div className={iconBadge('default', 'p-2')}>
            <WorkspaceKindIcon type={active.type} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{active.name}</p>
            <p className="truncate text-xs text-muted-foreground">{workspaceKindLabel(active)}</p>
          </div>
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')}
          />
        </button>

        {open && (
          <div
            className={cn(
              surface.panel,
              'absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 max-h-[min(16rem,50vh)] overflow-y-auto p-1 shadow-lg',
            )}
            role="listbox"
            aria-label="Daftar workspace"
          >
            <ul className="space-y-0.5">
              {workspaces.map((ws) => {
                const selected = ws.id === activeId
                return (
                  <li key={ws.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        'touch-target flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                        selected
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                      onClick={() => switchWorkspace(ws.id)}
                    >
                      <div className={iconBadge('default', 'p-2')}>
                        <WorkspaceKindIcon type={ws.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{ws.name}</p>
                        <p className="truncate text-xs opacity-80">{workspaceKindLabel(ws)}</p>
                      </div>
                      {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
      </p>
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
