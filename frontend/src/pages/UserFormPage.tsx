import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KeyRound, Save, Trash2 } from 'lucide-react'

import { listRoles } from '@/api/roles'
import { createUser, deleteUser, getUser, resetUserPassword, updateUser } from '@/api/users'
import { SelectField, TextField } from '@/components/shared/Field'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { InfoCallout } from '@/components/shared/InfoCallout'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { pageLayout } from '@/lib/design'

export function UserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const { canPageAction } = useCatalogAccess()
  const canDeleteUser = canPageAction('page.users.list', 'delete')
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [roleOptions, setRoleOptions] = useState<{ id: string; label: string }[]>([])
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listRoles()
      .then((response) => {
        const options = response.data.map((role) => ({
          id: role.id,
          label: `${role.name} (${role.code})`,
        }))
        setRoleOptions(options)
        if (!isEdit && options.length > 0 && !roleId) {
          const operator = response.data.find((r) => r.code === 'operator')
          setRoleId(operator?.id ?? options[0].id)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat peran'))
  }, [isEdit])

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false)
      return
    }
    setLoading(true)
    getUser(id)
      .then((response) => {
        const user = response.data
        setName(user.name)
        setEmail(user.email)
        setRoleId(user.roleIds[0] ?? '')
        setIsActive(user.isActive)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat pengguna'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!roleId) {
      setError('Pilih peran untuk pengguna')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body = { name, email, roleIds: [roleId], isActive }
      if (isEdit && id) {
        await updateUser(id, body)
        if (newPassword) {
          await resetUserPassword(id, newPassword)
        }
      } else {
        await createUser({ ...body, password })
      }
      navigate('/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('Hapus pengguna ini?')) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteUser(id)
      navigate('/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell className={pageLayout.formSm}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </PageShell>
    )
  }

  const isSelf = currentUser?.id === id

  return (
    <PageShell className={pageLayout.formSm}>
      <BackLink to="/users" label="Kembali ke daftar pengguna" />

      <PageHeader
        title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
        description="Peran menentukan permission efektif. Pengguna perlu login ulang setelah peran diubah."
      />

      <PanelCard title="Informasi Akun">
        <form id="user-form" className="space-y-5" onSubmit={handleSubmit}>
          <TextField label="Nama lengkap" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField
            label="Email"
            id="email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Peran RBAC" id="roleId" value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
              <option value="">Pilih peran…</option>
              {roleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Status"
              id="isActive"
              value={isActive ? '1' : '0'}
              onChange={(e) => setIsActive(e.target.value === '1')}
              disabled={isSelf}
            >
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </SelectField>
          </div>

          <InfoCallout>
            Permission efektif mengikuti peran yang dipilih. Ubah detail permission di menu Peran.
          </InfoCallout>

          {!isEdit ? (
            <TextField
              label="Password awal"
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          ) : (
            <TextField
              label="Password baru (opsional)"
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
            />
          )}

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <div className="hidden flex-wrap gap-3 pt-2 md:flex">
            <Button type="submit" disabled={submitting}>
              <Save className="size-4" />
              Simpan
            </Button>
            {isEdit && canDeleteUser && !isSelf && (
              <Button type="button" variant="outline" disabled={submitting} onClick={() => void handleDelete()}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            )}
          </div>
        </form>
      </PanelCard>

      {isEdit && (
        <PanelCard title="Reset Password" description="Set password baru tanpa mengubah data profil.">
          <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>Isi field password baru di atas lalu simpan untuk mengganti password pengguna.</p>
          </div>
        </PanelCard>
      )}

      <MobileFormFooter maxWidthClassName="max-w-2xl">
        {isEdit && canDeleteUser && !isSelf && (
          <Button type="button" variant="outline" disabled={submitting} className="flex-1" onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" form="user-form" disabled={submitting} className="flex-[1.6]">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </PageShell>
  )
}
