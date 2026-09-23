import { Link, NavLink } from 'react-router-dom'
import { Droplets, Fish, LayoutDashboard, Plus, Wallet } from 'lucide-react'

import { cn } from '@/lib/utils'

const leftNav = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/finance', label: 'Keuangan', icon: Wallet },
]

const midNav = [{ to: '/ponds', label: 'Kolam', icon: Fish }]

const rightNav = [{ to: '/water-quality', label: 'Catatan', icon: Droplets }]

type MobileBottomNavProps = {
  hidePrimaryAction?: boolean
}

export function MobileBottomNav({ hidePrimaryAction = false }: MobileBottomNavProps) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="border-t bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-2 pt-1">
          {leftNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'touch-target flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="flex justify-center">
            {hidePrimaryAction ? (
              <div className="size-14" aria-hidden />
            ) : (
              <Link
                to="/water-quality/new"
                className="relative -top-5 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-4px_oklch(0.45_0.12_155/0.45)] ring-4 ring-background transition active:scale-95"
                aria-label="Catat kualitas air"
              >
                <Plus className="size-7" strokeWidth={2.5} />
              </Link>
            )}
          </div>

          {midNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'touch-target flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          ))}

          {rightNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'touch-target flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
