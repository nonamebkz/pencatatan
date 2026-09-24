import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

import { iconBadge, interactive } from '@/lib/design'
import { cn } from '@/lib/utils'

type ShortcutLinkCardProps = {
  to: string
  title: string
  description?: string
  icon: LucideIcon
  className?: string
}

export function ShortcutLinkCard({ to, title, description, icon: Icon, className }: ShortcutLinkCardProps) {
  return (
    <Link to={to} className={cn(interactive.cardLink, 'flex gap-3', className)}>
      <div className={iconBadge('default')}>
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </Link>
  )
}
