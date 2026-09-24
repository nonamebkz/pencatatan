import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

type MobileListFabProps = {
  to: string
  ariaLabel: string
}

/** FAB tambah item di list — di atas bottom nav, hanya mobile (pola UserListPage). */
export function MobileListFab({ to, ariaLabel }: MobileListFabProps) {
  return (
    <Button
      asChild
      size="lg"
      className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 size-14 rounded-full p-0 shadow-lg md:hidden"
    >
      <Link to={to} aria-label={ariaLabel}>
        <Plus className="size-6" />
      </Link>
    </Button>
  )
}
