import { useEffect, useState } from 'react'
import { Fish, Plus } from 'lucide-react'

import { createPond, deletePond, listPonds, type Pond } from '@/api/water-quality'
import { PondCard } from '@/components/ponds/PondCard'
import { TextField, TextareaField } from '@/components/shared/Field'
import { CountBadge } from '@/components/shared/CountBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

export function PondListPage() {
  const { isAdmin } = useAuth()
  const [ponds, setPonds] = useState<Pond[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleDeletePond = async (pond: Pond) => {
    setDeletingId(pond.id)
    setError(null)
    try {
      await deletePond(pond.id)
      setPonds((prev) => prev.filter((item) => item.id !== pond.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kolam')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Kolam"
        description="Kelola master kolam sebelum mencatat kualitas air harian."
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
            <TextareaField
              label="Catatan"
              id="pond-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan operasional kolam..."
            />
            <Button type="submit" disabled={submitting} className="w-full">
              <Plus className="size-4" />
              Simpan Kolam
            </Button>
          </form>
        </PanelCard>

        <div className="order-1 space-y-4 xl:order-2">
          <div className="flex justify-end">
            <CountBadge>{ponds.length} kolam</CountBadge>
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
                <PondCard
                  key={pond.id}
                  pond={pond}
                  canDelete={isAdmin}
                  deleting={deletingId === pond.id}
                  onDelete={handleDeletePond}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
