import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Droplets, Fish, LayoutDashboard, Shield, UserCog, Wallet, Waves, type LucideIcon } from 'lucide-react'

import { UserMenu } from '@/components/auth/UserMenu'
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import {
  canSeeCatalogMenu,
  findCatalogMenuById,
  visibleAccessNavFromCatalog,
  visibleMainNavFromCatalog,
} from '@/lib/access-catalog'
import { cn } from '@/lib/utils'

const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  Fish,
  Droplets,
  UserCog,
  Shield,
}

function pageTitle(pathname: string, navLabels: { path: string; label: string; end?: boolean }[]) {
  if (pathname.startsWith('/users/new')) return 'Tambah Pengguna'
  if (pathname.startsWith('/users/') && pathname.endsWith('/edit')) return 'Edit Pengguna'
  if (pathname.startsWith('/users')) return 'Pengguna'
  if (pathname === '/roles/new') return 'Tambah Peran'
  if (pathname.startsWith('/roles/') && pathname.endsWith('/edit')) return 'Ubah Peran'
  if (pathname.startsWith('/roles')) return 'Peran'
  if (pathname === '/forbidden') return 'Akses ditolak'
  if (pathname.startsWith('/finance/cash-accounts/new')) return 'Tambah Kas'
  if (pathname.startsWith('/finance/cash-accounts/') && pathname.endsWith('/edit')) return 'Ubah Kas'
  if (pathname.startsWith('/finance/cash-accounts')) return 'Akun Kas'
  if (pathname.startsWith('/finance/purchases/new')) return 'Catat Pembelian'
  if (pathname.startsWith('/finance/purchases/')) return 'Detail Pembelian'
  if (pathname.startsWith('/finance/expenses/new')) return 'Pengeluaran Lain'
  if (pathname === '/finance/rent/new') return 'Kontrak Sewa'
  if (pathname.startsWith('/finance/rent/')) return 'Detail Sewa'
  if (pathname.startsWith('/finance/rent')) return 'Sewa Kolam'
  if (pathname === '/finance/reports/purchases') return 'Laporan Pembelian'
  if (pathname === '/finance/reports/price-history') return 'Histori Harga'
  if (pathname === '/finance/reports/rent') return 'Laporan Sewa'
  if (pathname === '/finance/reports/summary') return 'Ringkasan Operasional'
  if (pathname.startsWith('/finance/reports')) return 'Laporan'
  if (pathname.startsWith('/finance')) return 'Keuangan'
  if (pathname === '/ponds/new') return 'Tambah Kolam'
  if (/^\/ponds\/[^/]+\/edit$/.test(pathname)) return 'Ubah Kolam'
  if (/^\/ponds\/[^/]+$/.test(pathname)) return 'Detail Kolam'
  if (pathname.startsWith('/ponds')) return 'Kolam'
  if (pathname.startsWith('/water-quality/report')) return 'Laporan Kualitas Air'
  if (pathname.startsWith('/water-quality/new')) return 'Catat Kualitas Air'
  if (pathname.includes('/water-quality/') && pathname.endsWith('/edit')) return 'Edit Catatan'
  if (/^\/water-quality\/[^/]+$/.test(pathname)) return 'Detail Catatan'
  if (pathname.startsWith('/finance/transactions/')) return 'Detail Transaksi'
  if (pathname.startsWith('/settings/water-quality')) return 'Konfigurasi Kualitas Air'
  const item = navLabels.find((nav) => (nav.end ? pathname === nav.path : pathname.startsWith(nav.path)))
  return item?.label ?? 'Budidaya Lele'
}

export function AppLayout() {
  const location = useLocation()
  const { can: check } = useAuth()
  const { canPageAction } = useCatalogAccess()

  const visibleMain = useMemo(() => visibleMainNavFromCatalog(check), [check])
  const navItems = useMemo(
    () =>
      visibleMain.map((item) => ({
        to: item.path,
        label: item.label,
        description: item.description,
        end: item.end,
        icon: NAV_ICONS[item.icon ?? ''] ?? LayoutDashboard,
      })),
    [visibleMain],
  )

  const title = pageTitle(
    location.pathname,
    navItems.map(({ to, label, end }) => ({ path: to, label, end })),
  )
  const onPondDetail = /^\/ponds\/[^/]+$/.test(location.pathname)
  const hideQuickRecord =
    location.pathname === '/water-quality' ||
    location.pathname.startsWith('/water-quality/new') ||
    (location.pathname.includes('/water-quality/') && location.pathname.endsWith('/edit')) ||
    onPondDetail
  const hidePrimaryAction =
    location.pathname.startsWith('/water-quality/new') ||
    location.pathname === '/ponds/new' ||
    (location.pathname.startsWith('/finance/') && !location.pathname.startsWith('/finance/cash-accounts')) ||
    location.pathname.endsWith('/edit') ||
    location.pathname.startsWith('/users') ||
    location.pathname === '/roles/new' ||
    location.pathname.startsWith('/roles')

  const accessItems = useMemo(
    () =>
      visibleAccessNavFromCatalog(check).map((item) => ({
        to: item.path,
        label: item.label,
        description: item.description,
        icon: NAV_ICONS[item.icon ?? ''] ?? Shield,
      })),
    [check],
  )

  const waterQualityMenu = findCatalogMenuById('nav.water_quality')
  const showWaterQualityNav = waterQualityMenu ? canSeeCatalogMenu(check, waterQualityMenu) : true
  const showQuickRecord =
    showWaterQualityNav && !hideQuickRecord && canPageAction('page.water_quality.form', 'create')

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

            {accessItems.length > 0 && (
              <>
                <p className="px-3 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Kelola Akses
                </p>
                {accessItems.map(({ to, label, description, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
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
              </>
            )}
          </nav>

          <div className="mt-auto pt-8">
            <UserMenu layout="sidebar" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Waves className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Budidaya Lele
                </p>
                <h1 className="text-lg font-semibold leading-tight">{title}</h1>
              </div>
              <UserMenu layout="header" />
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pb-mobile-nav md:px-8 md:py-8 md:pb-8">
            <Outlet />
          </main>

          <MobileBottomNav
            hidePrimaryAction={hidePrimaryAction || !showQuickRecord}
            navItems={navItems.map(({ to, label, icon, end }) => ({
              to,
              label: to === '/water-quality' ? 'Catatan' : label,
              icon,
              end,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
