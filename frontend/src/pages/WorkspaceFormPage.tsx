import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'

import {
  createWorkspace,
  deleteWorkspace,
  listAllWorkspaces,
  updateWorkspace,
  type WorkspaceType,
} from '@/api/workspace'
import { SelectField, TextField } from '@/components/shared/Field'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout } from '@/lib/design'

export function WorkspaceFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { canPageAction } = useCatalogAccess()
  const canDelete = canPageAction('page.workspaces.list', 'delete')

  const [name, setName] = useState('')
  const [type, setType] = useState<WorkspaceType>('BUSINESS')
  const [templateId, setTemplateId] = useState('lele')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    setLoading(true)
    listAllWorkspaces()
      .then((res) => {
        const ws = res.data.find((w) => w.id === id)
        if (!ws) throw new Error('Workspace tidak ditemukan')
        setName(ws.name)
        setType(ws.type)
        setTemplateId(ws.templateId)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isEdit && id) {
        await updateWorkspace(id, name.trim())
      } else {
        await createWorkspace({
          name: name.trim(),
          type,
          templateId: type === 'PERSONAL' ? 'personal' : templateId,
        })
      }
      navigate('/settings/workspaces')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('Hapus workspace ini beserta semua datanya? Tindakan tidak dapat dibatalkan.')) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteWorkspace(id)
      navigate('/settings/workspaces')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell className={pageLayout.formSm}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </PageShell>
    )
  }

  return (
    <PageShell className={pageLayout.formSm}>
      <BackLink to="/settings/workspaces" label="Kembali ke daftar workspace" />

      <PageHeader
        title={isEdit ? 'Ubah Workspace' : 'Tambah Workspace'}
        description={isEdit ? 'Hanya nama yang dapat diubah. Data operasional tetap di workspace ini.' : 'Kas default dan template kualitas air dibuat otomatis.'}
      />

      <PanelCard title="Data workspace">
        <form id="workspace-form" className="space-y-5" onSubmit={handleSubmit}>
          <TextField label="Nama" id="name" value={name} onChange={(e) => setName(e.target.value)} required />

          {!isEdit && (
            <>
              <SelectField label="Tipe" id="type" value={type} onChange={(e) => setType(e.target.value as WorkspaceType)}>
                <option value="BUSINESS">Usaha</option>
                <option value="PERSONAL">Pribadi</option>
              </SelectField>
              {type === 'BUSINESS' && (
                <SelectField
                  label="Template usaha"
                  id="templateId"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="lele">Budidaya lele (kolam, kualitas air, sewa)</option>
                  <option value="generic">Usaha umum (unit + keuangan)</option>
                </SelectField>
              )}
            </>
          )}

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <div className="hidden gap-3 pt-2 md:flex">
            <Button type="submit" disabled={submitting}>
              <Save className="size-4" />
              Simpan
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

      <MobileFormFooter maxWidthClassName="max-w-2xl">
        {isEdit && canDelete && (
          <Button type="button" variant="outline" disabled={submitting} className="flex-1" onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" form="workspace-form" disabled={submitting} className="flex-[1.6]">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </PageShell>
  )
}
