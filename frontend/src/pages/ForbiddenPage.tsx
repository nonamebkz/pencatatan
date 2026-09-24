import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { pageLayout } from '@/lib/design'

export function ForbiddenPage() {
  return (
    <PageShell className={pageLayout.detail}>
      <PageHeader title="Akses ditolak" description="Hubungi admin workspace jika membutuhkan izin tambahan." />
      <EmptyState
        icon={ShieldOff}
        title="Permission tidak cukup"
        description="Anda tidak memiliki permission untuk halaman ini."
        action={
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link to="/">Kembali ke beranda</Link>
          </Button>
        }
      />
    </PageShell>
  )
}
