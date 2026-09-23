import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LogoutButtonProps = {
  variant?: 'default' | 'outline' | 'ghost'
  iconOnly?: boolean
  className?: string
  showLabel?: boolean
}

export function LogoutButton({ variant = 'outline', iconOnly = false, className, showLabel = true }: LogoutButtonProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const handleLogout = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('touch-target size-10 shrink-0 px-0', className)}
        aria-label="Keluar dari akun"
        disabled={submitting}
        onClick={() => void handleLogout()}
      >
        <LogOut className="size-5" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn('w-full justify-start gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive', className)}
      disabled={submitting}
      onClick={() => void handleLogout()}
    >
      <LogOut className="size-4" />
      {showLabel && (submitting ? 'Keluar…' : 'Keluar')}
    </Button>
  )
}
