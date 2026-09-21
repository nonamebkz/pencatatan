import { NavLink, Outlet } from 'react-router-dom'
import { Droplets, Fish, LayoutDashboard, Waves } from 'lucide-react'

import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/ponds', label: 'Kolam', icon: Fish },
  { to: '/water-quality', label: 'Kualitas Air', icon: Droplets },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_oklch(0.96_0.02_155)_0%,_var(--background)_45%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="hidden w-64 shrink-0 border-r bg-card/50 p-4 backdrop-blur md:flex md:flex-col">
          <div className="mb-8 px-2">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Waves className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pencatatan Usaha</p>
            <h1 className="mt-1 text-lg font-semibold leading-tight">Budidaya Lele</h1>
            <p className="mt-1 text-xs text-muted-foreground">Monitoring kualitas air harian</p>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/80 px-4 py-4 backdrop-blur md:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pencatatan Usaha</p>
            <h1 className="text-lg font-semibold">Budidaya Lele</h1>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>

          <nav className="sticky bottom-0 border-t bg-background/95 px-2 py-2 backdrop-blur md:hidden">
            <div className="grid grid-cols-3 gap-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
