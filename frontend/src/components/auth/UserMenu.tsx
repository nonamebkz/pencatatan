import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, UserCog, UserRound } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="touch-target inline-flex items-center gap-2 rounded-xl border bg-card px-2 py-1.5 text-sm sm:px-3"
        aria-expanded={open}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </span>
        <span className="hidden max-w-24 truncate font-medium sm:inline">{user.name.split(' ')[0]}</span>
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-2xl border bg-popover shadow-lg">
            <div className="border-b px-4 py-3">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="p-1">
              {isAdmin && (
                <Link
                  to="/users"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <UserCog className="size-4" />
                  Kelola Pengguna
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  void logout().then(() => {
                    setOpen(false)
                    navigate('/login')
                  })
                }
                className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5')}
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
