import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KeyRound, Save, Trash2 } from 'lucide-react'

import type { UserRole } from '@/api/auth'
import { createUser, deleteUser, getUser, resetUserPassword, updateUser } from '@/api/users'
import { SelectField, TextField } from '@/components/shared/Field'
import { BackLink } from '@/components/shared/BackLink'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PanelCard } from '@/components/shared/PanelCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

export function UserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user: currentUser, canDelete } = useAuth()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('USER')
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    setLoading(true)
    getUser(id)
      .then((response) => {
        const user = response.data
        setName(user.name)
        setEmail(user.email)
        setRole(user.role)
        setIsActive(user.isActive)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat pengguna'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isEdit && id) {
        await updateUser(id, { name, email, role, isActive })
        if (newPassword) {
          await resetUserPassword(id, newPassword)
        }
      } else {
        await createUser({ name, email, role, isActive, password })
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
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  const isSelf = currentUser?.id === id

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 md:space-y-8 md:pb-0">
      <BackLink to="/users" label="Kembali ke daftar pengguna" />

      <PageHeader
        title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
        description="Buat akun login untuk anggota tim. Password minimal 8 karakter."
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
            <SelectField label="Peran" id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="USER">User — operasional harian</option>
              <option value="ADMIN">Admin — kelola pengguna</option>
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
            {isEdit && canDelete && !isSelf && (
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
        {isEdit && canDelete && !isSelf && (
          <Button type="button" variant="outline" disabled={submitting} className="flex-1" onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" form="user-form" disabled={submitting} className="flex-[1.6]">
          <Save className="size-4" />
          Simpan
        </Button>
      </MobileFormFooter>
    </div>
  )
}
