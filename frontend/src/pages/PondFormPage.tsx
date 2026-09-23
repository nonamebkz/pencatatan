import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'

import {
  createPond,
  getPond,
  getWaterQualityConfig,
  updatePond,
  type WaterQualityConfig,
} from '@/api/water-quality'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { linesFromSteps, stepsFromLines } from '@/lib/waterQualityAdvice'

type AdviceFields = Pick<
  WaterQualityConfig,
  'advicePhLow' | 'advicePhHigh' | 'adviceAmmoniaWarn' | 'adviceAmmoniaDanger'
>

function applyConfig(
  cfg: WaterQualityConfig,
  setters: {
    setAmmoniaWarnPpm: (v: string) => void
    setAmmoniaDangerPpm: (v: string) => void
    setPhMinNormal: (v: string) => void
    setPhMaxNormal: (v: string) => void
    setAmmoniaAnalyteNote: (v: string) => void
    setAdvicePhLow: (v: string) => void
    setAdvicePhHigh: (v: string) => void
    setAdviceAmmoniaWarn: (v: string) => void
    setAdviceAmmoniaDanger: (v: string) => void
  },
) {
  setters.setAmmoniaWarnPpm(String(cfg.ammoniaWarnPpm))
  setters.setAmmoniaDangerPpm(String(cfg.ammoniaDangerPpm))
  setters.setPhMinNormal(String(cfg.phMinNormal))
  setters.setPhMaxNormal(String(cfg.phMaxNormal))
  setters.setAmmoniaAnalyteNote(cfg.ammoniaAnalyteNote)
  setters.setAdvicePhLow(linesFromSteps(cfg.advicePhLow))
  setters.setAdvicePhHigh(linesFromSteps(cfg.advicePhHigh))
  setters.setAdviceAmmoniaWarn(linesFromSteps(cfg.adviceAmmoniaWarn))
  setters.setAdviceAmmoniaDanger(linesFromSteps(cfg.adviceAmmoniaDanger))
}

export function PondFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')

  const [ammoniaWarnPpm, setAmmoniaWarnPpm] = useState('0.5')
  const [ammoniaDangerPpm, setAmmoniaDangerPpm] = useState('1')
  const [phMinNormal, setPhMinNormal] = useState('6.5')
  const [phMaxNormal, setPhMaxNormal] = useState('8.5')
  const [ammoniaAnalyteNote, setAmmoniaAnalyteNote] = useState('')
  const [advicePhLow, setAdvicePhLow] = useState('')
  const [advicePhHigh, setAdvicePhHigh] = useState('')
  const [adviceAmmoniaWarn, setAdviceAmmoniaWarn] = useState('')
  const [adviceAmmoniaDanger, setAdviceAmmoniaDanger] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const configSetters = {
      setAmmoniaWarnPpm,
      setAmmoniaDangerPpm,
      setPhMinNormal,
      setPhMaxNormal,
      setAmmoniaAnalyteNote,
      setAdvicePhLow,
      setAdvicePhHigh,
      setAdviceAmmoniaWarn,
      setAdviceAmmoniaDanger,
    }

    if (isEdit && id) {
      getPond(id)
        .then((response) => {
          const pond = response.data
          setName(pond.name)
          setLocation(pond.location ?? '')
          setNotes(pond.notes ?? '')
          setStatus(pond.status)
          applyConfig(pond.waterQualityConfig, configSetters)
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat kolam'))
        .finally(() => setLoading(false))
      return
    }

    getWaterQualityConfig()
      .then((response) => applyConfig(response.data, configSetters))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat template ambang'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const buildConfig = (): WaterQualityConfig => ({
    ammoniaWarnPpm: Number(ammoniaWarnPpm),
    ammoniaDangerPpm: Number(ammoniaDangerPpm),
    phMinNormal: Number(phMinNormal),
    phMaxNormal: Number(phMaxNormal),
    ammoniaAnalyteNote: ammoniaAnalyteNote.trim(),
    advicePhLow: stepsFromLines(advicePhLow),
    advicePhHigh: stepsFromLines(advicePhHigh),
    adviceAmmoniaWarn: stepsFromLines(adviceAmmoniaWarn),
    adviceAmmoniaDanger: stepsFromLines(adviceAmmoniaDanger),
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      name: name.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      waterQualityConfig: buildConfig(),
      ...(isEdit ? { status } : {}),
    }

    try {
      if (isEdit && id) {
        await updatePond(id, body)
        navigate(`/ponds/${id}`)
      } else {
        const created = await createPond(body)
        navigate(`/ponds/${created.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kolam')
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

  const adviceSections: { key: keyof AdviceFields; label: string; value: string; set: (v: string) => void }[] = [
    { key: 'advicePhLow', label: 'Saran pH rendah', value: advicePhLow, set: setAdvicePhLow },
    { key: 'advicePhHigh', label: 'Saran pH tinggi', value: advicePhHigh, set: setAdvicePhHigh },
    { key: 'adviceAmmoniaWarn', label: 'Saran amonia waspada', value: adviceAmmoniaWarn, set: setAdviceAmmoniaWarn },
    {
      key: 'adviceAmmoniaDanger',
      label: 'Saran amonia bahaya',
      value: adviceAmmoniaDanger,
      set: setAdviceAmmoniaDanger,
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24 md:space-y-8 md:pb-0">
      <BackLink to="/ponds" label="Kembali ke daftar kolam" />

      <PageHeader
        title={isEdit ? 'Ubah Kolam' : 'Tambah Kolam'}
        description={
          isEdit
            ? 'Perbarui identitas kolam dan ambang kualitas air yang dipakai untuk penilaian catatan harian.'
            : 'Ambang diisi dari template usaha. Anda bisa menyesuaikannya sebelum menyimpan.'
        }
      />

      {!isEdit && (
        <InfoCallout>
          <p>
            Nilai awal diambil dari template Pengaturan → Kualitas Air. Setelah disimpan, mengubah template tidak
            mengubah ambang kolam ini.
          </p>
        </InfoCallout>
      )}

      <form id="pond-form" className="space-y-6" onSubmit={handleSubmit}>
        <PanelCard title="Identitas kolam">
          <div className="space-y-5">
            <TextField
              label="Nama kolam"
              id="pond-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Lokasi"
              id="pond-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <TextareaField
              label="Catatan"
              id="pond-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan operasional kolam..."
              rows={3}
            />
            {isEdit && (
              <SelectField
                label="Status"
                id="pond-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </SelectField>
            )}
          </div>
        </PanelCard>

        <PanelCard title="Ambang kualitas air">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Ammonia waspada (ppm)"
              id="ammoniaWarnPpm"
              type="number"
              step="0.001"
              min="0"
              value={ammoniaWarnPpm}
              onChange={(e) => setAmmoniaWarnPpm(e.target.value)}
              required
            />
            <TextField
              label="Ammonia bahaya (ppm)"
              id="ammoniaDangerPpm"
              type="number"
              step="0.001"
              min="0"
              value={ammoniaDangerPpm}
              onChange={(e) => setAmmoniaDangerPpm(e.target.value)}
              required
            />
            <TextField
              label="pH normal minimum"
              id="phMinNormal"
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={phMinNormal}
              onChange={(e) => setPhMinNormal(e.target.value)}
              required
            />
            <TextField
              label="pH normal maksimum"
              id="phMaxNormal"
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={phMaxNormal}
              onChange={(e) => setPhMaxNormal(e.target.value)}
              required
            />
          </div>
          <TextareaField
            label="Catatan analit amonia (ditampilkan di form catatan)"
            id="ammoniaAnalyteNote"
            value={ammoniaAnalyteNote}
            onChange={(e) => setAmmoniaAnalyteNote(e.target.value)}
            rows={3}
          />
        </PanelCard>

        {adviceSections.map((section) => (
          <PanelCard key={section.key} title={section.label}>
            <TextareaField
              label="Langkah-langkah (satu per baris)"
              id={section.key}
              value={section.value}
              onChange={(e) => section.set(e.target.value)}
              rows={5}
            />
          </PanelCard>
        ))}

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="hidden md:block">
          <Button type="submit" disabled={submitting}>
            <Save className="size-4" />
            Simpan
          </Button>
        </div>
      </form>

      <MobileFormFooter>
        <Button type="submit" form="pond-form" disabled={submitting} className="flex-1">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </div>
  )
}
