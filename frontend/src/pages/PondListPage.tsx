import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Fish, Plus, Sparkles } from 'lucide-react'

import { createPond, listPonds, type Pond } from '@/api/water-quality'
import { PondCard } from '@/components/ponds/PondCard'
import { TextField } from '@/components/shared/Field'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

export function PondListPage() {
  const [ponds, setPonds] = useState<Pond[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadPonds = () => {
    setLoading(true)
    listPonds()
      .then((response) => setPonds(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPonds()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createPond({
        name,
        location: location || undefined,
        notes: notes || undefined,
      })
      setName('')
      setLocation('')
      setNotes('')
      loadPonds()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kolam')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Kolam"
        description="Kelola master kolam sebelum mencatat kualitas air harian."
        actions={
          <Button asChild variant="outline" className="hidden md:inline-flex">
            <Link to="/water-quality/new">
              <Sparkles className="size-4" />
              Catat Kualitas Air
            </Link>
          </Button>
        }
      />

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <PanelCard
          title="Tambah Kolam"
          description="Kolam wajib ada sebelum input observasi ammonia dan pH."
          className="order-2 xl:order-1"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label="Nama kolam" id="pond-name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Lokasi" id="pond-location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <div className="space-y-2">
              <label htmlFor="pond-notes" className="text-sm font-medium">
                Catatan
              </label>
              <Textarea id="pond-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan operasional kolam..." />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              <Plus className="size-4" />
              Simpan Kolam
            </Button>
          </form>
        </PanelCard>

        <div className="order-1 space-y-4 xl:order-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Daftar Kolam</h3>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {ponds.length} kolam
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : ponds.length === 0 ? (
            <EmptyState
              icon={Fish}
              title="Belum ada kolam"
              description="Tambah kolam pertama untuk mulai monitoring kualitas air."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ponds.map((pond) => (
                <PondCard key={pond.id} pond={pond} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
