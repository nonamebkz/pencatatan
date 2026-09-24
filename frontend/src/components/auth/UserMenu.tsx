import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Settings2, Shield, UserCog, UserRound } from 'lucide-react'

import { LogoutButton } from '@/components/auth/LogoutButton'
import { useAuth } from '@/contexts/AuthContext'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { visibleAccessNavFromCatalog } from '@/lib/access-catalog'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  layout?: 'sidebar' | 'header'
}

export function UserMenu({ layout = 'header' }: UserMenuProps) {
  const { user, can: check, roles } = useAuth()
  const { canViewPageId } = useCatalogAccess()
  const [open, setOpen] = useState(false)

  /** Desktop: Pengguna/Peran sudah di sidebar (Kelola Akses). Mobile: tampil di dropdown header. */
  const menuLinks = useMemo(() => {
    const access =
      layout === 'header'
        ? visibleAccessNavFromCatalog(check).map((item) => ({
            to: item.path,
            icon: item.icon === 'Shield' ? Shield : UserCog,
            label: item.label === 'Pengguna' ? 'Kelola Pengguna' : item.label,
          }))
        : []

    if (canViewPageId('page.water_quality.config')) {
      access.push({
        to: '/settings/water-quality',
        icon: Settings2,
        label: 'Konfigurasi Kualitas Air',
      })
    }
    return access
  }, [check, canViewPageId, layout])

  if (!user) return null

  const roleLabel = roles[0]?.name ?? (user.role === 'ADMIN' ? 'Administrator' : 'Pengguna')

  if (layout === 'sidebar') {
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {menuLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}

        <LogoutButton variant="outline" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <LogoutButton iconOnly className="md:hidden" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="touch-target inline-flex max-w-[11rem] items-center gap-2 rounded-2xl border bg-card px-2 py-1.5 text-sm sm:max-w-none sm:px-3"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRound className="size-4" />
          </span>
          <span className="hidden min-w-0 truncate font-medium sm:inline">{user.name.split(' ')[0]}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')} />
        </button>

        {open && (
          <>
            <button type="button" className="fixed inset-0 z-40" aria-label="Tutup menu" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-2xl border bg-popover shadow-lg"
            >
              <div className="border-b px-4 py-3">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-1 p-2">
                {menuLinks.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
                <div className="px-1 pb-1" onClick={() => setOpen(false)}>
                  <LogoutButton variant="ghost" className="w-full" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
