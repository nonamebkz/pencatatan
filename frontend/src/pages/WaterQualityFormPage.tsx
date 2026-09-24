import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'

import {
  createWaterQualityLog,
  deleteWaterQualityLog,
  evaluateWaterQuality,
  getWaterQualityLog,
  listBatches,
  listPonds,
  updateWaterQualityLog,
  type Batch,
  type Pond,
  type WaterQualityConfig,
  type WaterQualityEvaluation,
} from '@/api/water-quality'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { WaterQualityAdvicePanel } from '@/components/water-quality/WaterQualityAdvicePanel'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function WaterQualityFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { canPageAction } = useCatalogAccess()
  const canDelete = canPageAction('page.water_quality.form', 'delete')
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)

  const [ponds, setPonds] = useState<Pond[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [businessUnitId, setBusinessUnitId] = useState(searchParams.get('pondId') ?? '')
  const [batchId, setBatchId] = useState('')
  const [measuredAt, setMeasuredAt] = useState(toLocalInputValue(new Date()))
  const [ammoniaPpm, setAmmoniaPpm] = useState('')
  const [ph, setPh] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<WaterQualityEvaluation | null>(null)

  useEffect(() => {
    listPonds('ACTIVE')
      .then((response) => setPonds(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
  }, [])

  useEffect(() => {
    if (!businessUnitId) {
      setBatches([])
      setBatchId('')
      return
    }
    listBatches({ businessUnitId, status: 'ACTIVE' })
      .then((response) => setBatches(response.data))
      .catch(() => setBatches([]))
  }, [businessUnitId])

  useEffect(() => {
    if (!isEdit || !id) return

    setLoading(true)
    getWaterQualityLog(id)
      .then((response) => {
        const log = response.data
        setBusinessUnitId(log.businessUnitId)
        setBatchId(log.batchId ?? '')
        setMeasuredAt(toLocalInputValue(new Date(log.measuredAt)))
        setAmmoniaPpm(log.ammoniaPpm?.toString() ?? '')
        setPh(log.ph?.toString() ?? '')
        setNotes(log.notes ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const selectedPond = ponds.find((pond) => pond.id === businessUnitId)
  const config: WaterQualityConfig | null = selectedPond?.waterQualityConfig ?? null

  const parsedAmmonia = ammoniaPpm ? Number(ammoniaPpm) : undefined
  const parsedPh = ph ? Number(ph) : undefined

  useEffect(() => {
    const hasMeasurement =
      (parsedAmmonia !== undefined && !Number.isNaN(parsedAmmonia)) ||
      (parsedPh !== undefined && !Number.isNaN(parsedPh))
    if (!businessUnitId || !hasMeasurement) {
      setPreview(null)
      return
    }

    const timer = window.setTimeout(() => {
      evaluateWaterQuality({
        businessUnitId,
        ammoniaPpm: parsedAmmonia,
        ph: parsedPh,
      })
        .then((response) => setPreview(response.data))
        .catch(() => setPreview(null))
    }, 400)

    return () => window.clearTimeout(timer)
  }, [businessUnitId, parsedAmmonia, parsedPh])

  const thresholdHint = useMemo(() => {
    if (!businessUnitId) {
      return 'Pilih kolam untuk melihat ambang ammonia dan pH yang dipakai penilaian.'
    }
    if (!config) {
      return 'Ambang kolam belum tersedia. Muat ulang halaman atau periksa data kolam.'
    }
    return `Threshold kolam ini: ammonia ≥ ${config.ammoniaWarnPpm} ppm waspada, ≥ ${config.ammoniaDangerPpm} ppm bahaya. pH normal ${config.phMinNormal}–${config.phMaxNormal}.`
  }, [businessUnitId, config])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      businessUnitId,
      batchId: batchId || undefined,
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

  const handleDelete = async () => {
    if (!id || !window.confirm('Hapus catatan kualitas air ini? Tindakan tidak dapat dibatalkan.')) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteWaterQualityLog(id)
      navigate('/water-quality')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus catatan')
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
      <BackLink to="/water-quality" label="Kembali ke daftar catatan" />

      <PageHeader
        title={isEdit ? 'Edit Catatan' : 'Catat Kualitas Air'}
        description="Minimal satu dari ammonia, pH, atau catatan harus diisi."
      />

      <InfoCallout>
        <p>{thresholdHint}</p>
        {config?.ammoniaAnalyteNote && <p className="mt-2">{config.ammoniaAnalyteNote}</p>}
      </InfoCallout>

      {preview && preview.status !== 'NORMAL' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pratinjau status:</span>
            <WaterQualityStatusBadge status={preview.status} />
          </div>
          <WaterQualityAdvicePanel advice={preview.advice} status={preview.status} />
        </div>
      )}

      <PanelCard title="Form Observasi">
        <form id="water-quality-form" className="space-y-5" onSubmit={handleSubmit}>
          <SelectField
            label="Kolam"
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
          </SelectField>

          <SelectField
            label="Batch (opsional)"
            id="batchId"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={!businessUnitId}
          >
            <option value="">Tanpa batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </SelectField>
          {businessUnitId && batches.length === 0 && (
            <p className="text-xs text-muted-foreground">Belum ada batch aktif untuk kolam ini.</p>
          )}

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
          <TextareaField
            label="Catatan"
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: ikan aktif, warna air hijau, angin kencang..."
          />

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <div className="hidden flex-wrap gap-3 pt-2 md:flex">
            <Button type="submit" disabled={submitting}>
              <Save className="size-4" />
              Simpan
            </Button>
            <Button asChild variant="outline">
              <Link to="/water-quality">Batal</Link>
            </Button>
            {isEdit && canDelete && (
              <Button type="button" variant="outline" disabled={submitting} onClick={() => void handleDelete()}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            )}
          </div>
        </form>
      </PanelCard>

      <MobileFormFooter>
        {isEdit && canDelete && (
          <Button type="button" variant="outline" disabled={submitting} className="shrink-0 px-3" onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button asChild variant="outline" className="flex-1">
          <Link to="/water-quality">Batal</Link>
        </Button>
        <Button type="submit" form="water-quality-form" disabled={submitting} className="flex-[1.4]">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </div>
  )
}
