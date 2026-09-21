import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  createWaterQualityLog,
  getWaterQualityLog,
  listPonds,
  updateWaterQualityLog,
  type Pond,
} from '@/api/water-quality'
import { TextField } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function WaterQualityFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)

  const [ponds, setPonds] = useState<Pond[]>([])
  const [businessUnitId, setBusinessUnitId] = useState(searchParams.get('pondId') ?? '')
  const [measuredAt, setMeasuredAt] = useState(toLocalInputValue(new Date()))
  const [ammoniaPpm, setAmmoniaPpm] = useState('')
  const [ph, setPh] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listPonds('ACTIVE')
      .then((response) => setPonds(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return

    getWaterQualityLog(id)
      .then((response) => {
        const log = response.data
        setBusinessUnitId(log.businessUnitId)
        setMeasuredAt(toLocalInputValue(new Date(log.measuredAt)))
        setAmmoniaPpm(log.ammoniaPpm?.toString() ?? '')
        setPh(log.ph?.toString() ?? '')
        setNotes(log.notes ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
  }, [id, isEdit])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const body = {
      businessUnitId,
      measuredAt: new Date(measuredAt).toISOString(),
      ammoniaPpm: ammoniaPpm ? Number(ammoniaPpm) : undefined,
      ph: ph ? Number(ph) : undefined,
      notes: notes || undefined,
    }

    try {
      if (isEdit && id) {
        await updateWaterQualityLog(id, body)
      } else {
        await createWaterQualityLog(body)
      }
      navigate('/water-quality')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan catatan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Catatan' : 'Catat Kualitas Air'}</h2>
        <p className="text-sm text-muted-foreground">Minimal satu dari ammonia, pH, atau catatan harus diisi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Observasi</CardTitle>
          <CardDescription>Threshold: ammonia ≥ 0.5 waspada, ≥ 1.0 bahaya; pH di luar 6.5–8.5 waspada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="businessUnitId">Kolam</Label>
              <select
                id="businessUnitId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={businessUnitId}
                onChange={(e) => setBusinessUnitId(e.target.value)}
                required
              >
                <option value="">Pilih kolam</option>
                {ponds.map((pond) => (
                  <option key={pond.id} value={pond.id}>
                    {pond.name}
                  </option>
                ))}
              </select>
            </div>

            <TextField
              label="Waktu pengukuran"
              id="measuredAt"
              type="datetime-local"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
              required
            />
            <TextField
              label="Ammonia (ppm)"
              id="ammoniaPpm"
              type="number"
              step="0.001"
              min="0"
              value={ammoniaPpm}
              onChange={(e) => setAmmoniaPpm(e.target.value)}
            />
            <TextField label="pH" id="ph" type="number" step="0.01" min="0" max="14" value={ph} onChange={(e) => setPh(e.target.value)} />
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observasi tambahan..." />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                Simpan
              </Button>
              <Button asChild variant="outline">
                <Link to="/water-quality">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
