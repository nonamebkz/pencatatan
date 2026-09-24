import { Link, NavLink } from 'react-router-dom'
import { Plus, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type MobileNavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

type MobileBottomNavProps = {
  hidePrimaryAction?: boolean
  navItems: MobileNavItem[]
}

export function MobileBottomNav({ hidePrimaryAction = false, navItems }: MobileBottomNavProps) {
  const left = navItems.slice(0, 2)
  const right = navItems.slice(2, 4)

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="border-t bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-2 pt-1">
          {left.map(({ to, label, icon: Icon, end }) => (
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

          {right.map(({ to, label, icon: Icon, end }) => (
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

          {left.length + right.length < 4 &&
            Array.from({ length: 4 - left.length - right.length }).map((_, i) => (
              <div key={`spacer-${i}`} aria-hidden />
            ))}
        </div>
      </div>
    </nav>
  )
}
