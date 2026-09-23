import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'

import {
  getWaterQualityConfig,
  updateWaterQualityConfig,
  type WaterQualityConfig,
} from '@/api/water-quality'
import { BackLink } from '@/components/shared/BackLink'
import { TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function linesFromSteps(steps: string[]) {
  return steps.join('\n')
}

function stepsFromLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

type AdviceFields = Pick<
  WaterQualityConfig,
  'advicePhLow' | 'advicePhHigh' | 'adviceAmmoniaWarn' | 'adviceAmmoniaDanger'
>

export function WaterQualityConfigPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ammoniaWarnPpm, setAmmoniaWarnPpm] = useState('0.5')
  const [ammoniaDangerPpm, setAmmoniaDangerPpm] = useState('1')
  const [phMinNormal, setPhMinNormal] = useState('6.5')
  const [phMaxNormal, setPhMaxNormal] = useState('8.5')
  const [ammoniaAnalyteNote, setAmmoniaAnalyteNote] = useState('')
  const [advicePhLow, setAdvicePhLow] = useState('')
  const [advicePhHigh, setAdvicePhHigh] = useState('')
  const [adviceAmmoniaWarn, setAdviceAmmoniaWarn] = useState('')
  const [adviceAmmoniaDanger, setAdviceAmmoniaDanger] = useState('')

  useEffect(() => {
    getWaterQualityConfig()
      .then((response) => {
        const cfg = response.data
        setAmmoniaWarnPpm(String(cfg.ammoniaWarnPpm))
        setAmmoniaDangerPpm(String(cfg.ammoniaDangerPpm))
        setPhMinNormal(String(cfg.phMinNormal))
        setPhMaxNormal(String(cfg.phMaxNormal))
        setAmmoniaAnalyteNote(cfg.ammoniaAnalyteNote)
        setAdvicePhLow(linesFromSteps(cfg.advicePhLow))
        setAdvicePhHigh(linesFromSteps(cfg.advicePhHigh))
        setAdviceAmmoniaWarn(linesFromSteps(cfg.adviceAmmoniaWarn))
        setAdviceAmmoniaDanger(linesFromSteps(cfg.adviceAmmoniaDanger))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat konfigurasi'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body: WaterQualityConfig = {
      ammoniaWarnPpm: Number(ammoniaWarnPpm),
      ammoniaDangerPpm: Number(ammoniaDangerPpm),
      phMinNormal: Number(phMinNormal),
      phMaxNormal: Number(phMaxNormal),
      ammoniaAnalyteNote: ammoniaAnalyteNote.trim(),
      advicePhLow: stepsFromLines(advicePhLow),
      advicePhHigh: stepsFromLines(advicePhHigh),
      adviceAmmoniaWarn: stepsFromLines(adviceAmmoniaWarn),
      adviceAmmoniaDanger: stepsFromLines(adviceAmmoniaDanger),
    }

    try {
      await updateWaterQualityConfig(body)
      navigate('/water-quality')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi')
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
      <BackLink to="/water-quality" label="Kembali ke daftar catatan" />

      <PageHeader
        title="Konfigurasi Kualitas Air"
        description="Ambang batas dan teks saran penanganan untuk seluruh workspace. Hanya administrator."
      />

      <InfoCallout>
        <p>
          Status dihitung dari nilai terukur vs ambang di bawah. Saran muncul otomatis saat status waspada atau bahaya.
          Satu baris = satu langkah dalam daftar saran.
        </p>
      </InfoCallout>

      <form id="wq-config-form" className="space-y-6" onSubmit={handleSubmit}>
        <PanelCard title="Ambang batas">
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
            Simpan konfigurasi
          </Button>
        </div>
      </form>

      <MobileFormFooter>
        <Button type="submit" form="wq-config-form" disabled={submitting} className="flex-1">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </div>
  )
}
