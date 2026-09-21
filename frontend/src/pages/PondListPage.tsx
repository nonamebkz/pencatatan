import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { createPond, listPonds, type Pond } from '@/api/water-quality'
import { TextField } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export function PondListPage() {
  const [ponds, setPonds] = useState<Pond[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadPonds = () => {
    listPonds()
      .then((response) => setPonds(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
  }

  useEffect(() => {
    loadPonds()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kolam</h2>
        <p className="text-sm text-muted-foreground">Master kolam untuk pencatatan kualitas air.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Kolam</CardTitle>
            <CardDescription>Kolam wajib ada sebelum mencatat kualitas air.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField label="Nama kolam" id="pond-name" value={name} onChange={(e) => setName(e.target.value)} required />
              <TextField label="Lokasi" id="pond-location" value={location} onChange={(e) => setLocation(e.target.value)} />
              <div className="space-y-2">
                <label htmlFor="pond-notes" className="text-sm font-medium">
                  Catatan
                </label>
                <Textarea id="pond-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                <Plus className="size-4" />
                Simpan Kolam
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Kolam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ponds.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada kolam.</p>
            ) : (
              ponds.map((pond) => (
                <div key={pond.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{pond.name}</p>
                      <p className="text-sm text-muted-foreground">{pond.location || 'Lokasi belum diisi'}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/ponds/${pond.id}`}>Detail</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
