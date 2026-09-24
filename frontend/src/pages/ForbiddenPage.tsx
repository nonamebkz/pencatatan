import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
          <ShieldOff className="size-8" />
        </div>
        <h1 className="text-2xl font-semibold">Akses ditolak</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk halaman ini. Hubungi admin workspace jika membutuhkan akses.
        </p>
        <Button asChild className="mt-8 w-full sm:w-auto" size="lg">
          <Link to="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </PageShell>
  )
}
