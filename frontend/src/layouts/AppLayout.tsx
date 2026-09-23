import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Droplets, Fish, LayoutDashboard, Plus, UserCog, Wallet, Waves } from 'lucide-react'

import { UserMenu } from '@/components/auth/UserMenu'
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Beranda', description: 'Ringkasan harian', icon: LayoutDashboard, end: true },
  { to: '/finance', label: 'Keuangan', description: 'Pembelian & pengeluaran', icon: Wallet },
  { to: '/ponds', label: 'Kolam', description: 'Master kolam', icon: Fish },
  { to: '/water-quality', label: 'Kualitas Air', description: 'Catatan observasi', icon: Droplets },
]

function pageTitle(pathname: string) {
  if (pathname.startsWith('/users/new')) return 'Tambah Pengguna'
  if (pathname.startsWith('/users/') && pathname.endsWith('/edit')) return 'Edit Pengguna'
  if (pathname.startsWith('/users')) return 'Pengguna'
  if (pathname.startsWith('/finance/purchases/new')) return 'Catat Pembelian'
  if (pathname.startsWith('/finance/purchases/')) return 'Detail Pembelian'
  if (pathname.startsWith('/finance/expenses/new')) return 'Pengeluaran Lain'
  if (pathname.startsWith('/finance')) return 'Keuangan'
  if (pathname.startsWith('/ponds/')) return 'Detail Kolam'
  if (pathname.startsWith('/water-quality/report')) return 'Laporan Kualitas Air'
  if (pathname.startsWith('/water-quality/new')) return 'Catat Kualitas Air'
  if (pathname.includes('/water-quality/') && pathname.endsWith('/edit')) return 'Edit Catatan'
  const item = navItems.find((nav) => (nav.end ? pathname === nav.to : pathname.startsWith(nav.to)))
  return item?.label ?? 'Budidaya Lele'
}

export function AppLayout() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const title = pageTitle(location.pathname)
  const hidePrimaryAction =
    location.pathname.startsWith('/water-quality/new') ||
    location.pathname.startsWith('/finance/') ||
    location.pathname.endsWith('/edit') ||
    location.pathname.startsWith('/users')

  return (
    <div className="min-h-screen bg-background md:bg-[radial-gradient(circle_at_top,_oklch(0.96_0.02_155)_0%,_var(--background)_45%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="hidden w-72 shrink-0 border-r bg-card/60 p-6 backdrop-blur md:flex md:flex-col">
          <div className="mb-8 px-1">
            <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Waves className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pencatatan Usaha</p>
            <h1 className="mt-1 text-xl font-semibold leading-tight">Budidaya Lele</h1>
            <p className="mt-1 text-xs text-muted-foreground">Monitoring kualitas air harian</p>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ to, label, description, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-start gap-3 rounded-2xl px-3 py-3 text-sm transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs opacity-80">{description}</span>
                </span>
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  cn(
                    'flex items-start gap-3 rounded-2xl px-3 py-3 text-sm transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <UserCog className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Pengguna</span>
                  <span className="block text-xs opacity-80">Kelola akun tim</span>
                </span>
              </NavLink>
            )}
          </nav>

          <div className="mt-auto space-y-4 pt-8">
            <Link
              to="/water-quality/new"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Catat Cepat
            </Link>
            <UserMenu layout="sidebar" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8 md:py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:hidden">
                <Waves className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:hidden">
                  Budidaya Lele
                </p>
                <h1 className="truncate text-lg font-semibold leading-tight md:text-xl">{title}</h1>
              </div>
              <div className="flex shrink-0 items-center md:hidden">
                <UserMenu layout="header" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pb-mobile-nav md:px-8 md:py-8 md:pb-8">
            <Outlet />
          </main>

          <MobileBottomNav hidePrimaryAction={hidePrimaryAction} />
        </div>
      </div>
    </div>
  )
}
