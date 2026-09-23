import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export function ErrorAlert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
