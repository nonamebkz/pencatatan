import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Info, Save } from 'lucide-react'

import {
  createWaterQualityLog,
  getWaterQualityLog,
  listPonds,
  updateWaterQualityLog,
  type Pond,
} from '@/api/water-quality'
import { TextField } from '@/components/shared/Field'
import { ErrorAlert, PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
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
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listPonds('ACTIVE')
      .then((response) => setPonds(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return

    setLoading(true)
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
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
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
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24 md:space-y-8 md:pb-0">
      <Button asChild variant="ghost" className="-ml-1 h-auto px-1 py-1 text-sm hover:bg-transparent sm:px-0">
        <Link to="/water-quality">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Kembali ke daftar catatan</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
      </Button>

      <PageHeader
        title={isEdit ? 'Edit Catatan' : 'Catat Kualitas Air'}
        description="Minimal satu dari ammonia, pH, atau catatan harus diisi."
      />

      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-muted-foreground sm:px-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Threshold: ammonia ≥ 0.5 ppm waspada, ≥ 1.0 ppm bahaya. pH di luar 6.5–8.5 ditandai waspada.
          </p>
        </div>
      </div>

      <PanelCard title="Form Observasi">
        <form id="water-quality-form" className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="businessUnitId">Kolam</Label>
            <Select
              id="businessUnitId"
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
            </Select>
          </div>

          <TextField
            label="Waktu pengukuran"
            id="measuredAt"
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Ammonia (ppm)"
              id="ammoniaPpm"
              type="number"
              step="0.001"
              min="0"
              inputMode="decimal"
              value={ammoniaPpm}
              onChange={(e) => setAmmoniaPpm(e.target.value)}
            />
            <TextField
              label="pH"
              id="ph"
              type="number"
              step="0.01"
              min="0"
              max="14"
              inputMode="decimal"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: ikan aktif, warna air hijau, angin kencang..."
            />
          </div>

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <div className="hidden flex-wrap gap-3 pt-2 md:flex">
            <Button type="submit" disabled={submitting}>
              <Save className="size-4" />
              Simpan
            </Button>
            <Button asChild variant="outline">
              <Link to="/water-quality">Batal</Link>
            </Button>
          </div>
        </form>
      </PanelCard>

      <div className="safe-bottom fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-20 border-t bg-background/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/water-quality">Batal</Link>
          </Button>
          <Button type="submit" form="water-quality-form" disabled={submitting} className="flex-[1.4]">
            <Save className="size-4" />
            Simpan
          </Button>
        </div>
      </div>
    </div>
  )
}
