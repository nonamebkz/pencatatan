import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'

import {
  createOperationalUnit,
  getOperationalUnit,
  updateOperationalUnit,
} from '@/api/operational-units'
import { BackLink } from '@/components/shared/BackLink'
import { SelectField, TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pageLayout } from '@/lib/design'

export function OperationalUnitFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getOperationalUnit(id)
      .then((response) => {
        const unit = response.data
        if (!unit) return
        setName(unit.name)
        setLocation(unit.location ?? '')
        setNotes(unit.notes ?? '')
        setStatus(unit.status)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat unit'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const payload = {
      name: name.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    }
    try {
      if (isEdit && id) {
        await updateOperationalUnit(id, payload)
        navigate(`/operational-units/${id}`)
      } else {
        const response = await createOperationalUnit(payload)
        navigate(`/operational-units/${response.data?.id ?? ''}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan unit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full" />
      </PageShell>
    )
  }

  return (
    <PageShell className={pageLayout.formSm}>
      <BackLink
        to={isEdit && id ? `/operational-units/${id}` : '/operational-units'}
        label="Kembali ke daftar unit"
      />
      <PageHeader title={isEdit ? 'Ubah unit' : 'Tambah unit'} />

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <PanelCard title="Identitas unit">
          <div className="space-y-4">
            <TextField label="Nama" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Lokasi" id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <SelectField label="Status" id="status" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </SelectField>
            <TextareaField label="Catatan" id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </PanelCard>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="hidden md:block">
          <Button type="submit" disabled={submitting}>
            <Save className="size-4" />
            Simpan
          </Button>
        </div>
        <MobileFormFooter>
          <Button type="submit" className="w-full" disabled={submitting}>Simpan</Button>
        </MobileFormFooter>
      </form>
    </PageShell>
  )
}
