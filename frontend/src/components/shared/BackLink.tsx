import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

type BackLinkProps = {
  to: string
  label: string
  shortLabel?: string
}

export function BackLink({ to, label, shortLabel = 'Kembali' }: BackLinkProps) {
  return (
    <Button asChild variant="ghost" className="-ml-1 h-auto px-1 py-1 text-sm hover:bg-transparent sm:px-0">
      <Link to={to}>
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{shortLabel}</span>
      </Link>
    </Button>
  )
}
