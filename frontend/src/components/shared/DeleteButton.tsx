import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DeleteIconButtonProps = {
  label: string
  confirmMessage: string
  onConfirm: () => void | Promise<void>
  disabled?: boolean
  className?: string
}

export function DeleteIconButton({
  label,
  confirmMessage,
  onConfirm,
  disabled,
  className,
}: DeleteIconButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      className={cn('size-9 shrink-0 p-0 text-destructive hover:bg-destructive/5 hover:text-destructive', className)}
      aria-label={label}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return
        void onConfirm()
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  )
}

type DeleteOutlineButtonProps = {
  children: ReactNode
  confirmMessage: string
  onConfirm: () => void | Promise<void>
  disabled?: boolean
  className?: string
}

export function DeleteOutlineButton({
  children,
  confirmMessage,
  onConfirm,
  disabled,
  className,
}: DeleteOutlineButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn('border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive', className)}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return
        void onConfirm()
      }}
    >
      <Trash2 className="size-4" />
      {children}
    </Button>
  )
}
