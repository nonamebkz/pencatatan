import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'

import {
  createRole,
  deleteRole,
  getRole,
  listPermissions,
  setRolePermissions,
  updateRole,
  type Permission,
  type Role,
} from '@/api/roles'
import { BackLink } from '@/components/shared/BackLink'
import { TextField, TextareaField } from '@/components/shared/Field'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { MobileFormFooter } from '@/components/shared/MobileFormFooter'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { PanelCard } from '@/components/shared/PanelCard'
import { useAuth } from '@/contexts/AuthContext'
import { groupCatalogForRoleForm } from '@/lib/access-catalog'
import { PermRoleAssignPerm, PermRoleDelete, PermRoleUpdate } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pageLayout, skeleton } from '@/lib/design'
import { cn } from '@/lib/utils'

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
}

function permissionIdsFromCodes(all: Permission[], codes: string[]) {
  const set = new Set(codes)
  return new Set(all.filter((p) => set.has(p.code)).map((p) => p.id))
}

function normalizePermissionList(data: Permission[] | null | undefined): Permission[] {
  return Array.isArray(data) ? data : []
}

export function RoleFormPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isCreate = location.pathname === '/roles/new'
  const { can: check } = useAuth()
  const canEditMeta = check(PermRoleUpdate) || isCreate
  const canEditPerms = check(PermRoleAssignPerm) || isCreate
  const canDeleteRole = check(PermRoleDelete)

  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [permCatalogError, setPermCatalogError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setPermCatalogError(null)

    const loadCatalog = () =>
      listPermissions()
        .then((response) => normalizePermissionList(response.data))
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Gagal memuat katalog permission'
          setPermCatalogError(message)
          return [] as Permission[]
        })

    if (isCreate) {
      loadCatalog()
        .then((catalog) => setPermissions(catalog))
        .finally(() => setLoading(false))
      return
    }
    if (!id) return

    setLoading(true)
    Promise.all([getRole(id), loadCatalog()])
      .then(([roleRes, catalog]) => {
        const r = roleRes.data
        setRole(r)
        setName(r.name)
        setCode(r.code)
        setDescription(r.description ?? '')
        setPermissions(catalog)
        setSelectedIds(permissionIdsFromCodes(catalog, r.permissions ?? []))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat peran'))
      .finally(() => setLoading(false))
  }, [id, isCreate])

  useEffect(() => {
    if (isCreate && !codeTouched && name) {
      setCode(slugFromName(name))
    }
  }, [name, isCreate, codeTouched])

  const catalogGroups = useMemo(() => groupCatalogForRoleForm(), [])

  const permissionIdByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const perm of permissions) {
      map.set(perm.code, perm.id)
    }
    return map
  }, [permissions])

  const togglePermission = (permId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })
  }

  const togglePermissionCode = (code: string) => {
    const permId = permissionIdByCode.get(code)
    if (!permId) return
    togglePermission(permId)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedIds.size === 0) {
      setError('Minimal satu permission harus aktif')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (isCreate) {
        await createRole({
          name: name.trim(),
          code: code.trim(),
          description: description.trim(),
          permissionIds: [...selectedIds],
        })
      } else if (id && role) {
        if (canEditMeta) {
          await updateRole(id, { name: name.trim(), description: description.trim() })
        }
        if (canEditPerms) {
          await setRolePermissions(id, [...selectedIds])
        }
      }
      navigate('/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan peran')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !role || role.isSystem) return
    if (!window.confirm(`Hapus peran "${role.name}"?`)) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteRole(id)
      navigate('/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus peran')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell className={pageLayout.formLg}>
        <Skeleton className={`${skeleton.block} h-64`} />
      </PageShell>
    )
  }

  const readOnly = !isCreate && !canEditMeta && !canEditPerms

  return (
    <PageShell className={pageLayout.formLg}>
      <BackLink to="/roles" label="Kembali ke daftar peran" />
      <PageHeader
        title={isCreate ? 'Tambah Peran' : role?.name ?? 'Peran'}
        description={
          isCreate
            ? 'Buat paket permission baru untuk tim.'
            : `Kode: ${role?.code ?? code}${role?.isSystem ? ' · sistem' : ''}`
        }
      />

      <form id="role-form" className="space-y-6" onSubmit={handleSubmit}>
        <PanelCard title="Profil peran">
          <div className="space-y-4">
            <TextField
              label="Nama tampilan"
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEditMeta || readOnly}
              required
            />
            <TextField
              label="Kode (unik)"
              id="role-code"
              value={code}
              onChange={(e) => {
                setCodeTouched(true)
                setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }}
              disabled={!isCreate}
              required
              placeholder="mis. supervisor_kolam"
            />
            {!isCreate && (
              <p className="text-xs text-muted-foreground">Kode role tidak dapat diubah setelah dibuat.</p>
            )}
            <TextareaField
              label="Deskripsi"
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEditMeta || readOnly}
              rows={3}
            />
          </div>
        </PanelCard>

        <PanelCard
          title="Permission"
          description="Mengikuti menu & aksi di aplikasi (sumber: shared/access-catalog.json)."
        >
          {permCatalogError && <ErrorAlert className="mx-4 mt-4">{permCatalogError}</ErrorAlert>}
          {catalogGroups.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Katalog akses kosong. Perbarui shared/access-catalog.json lalu restart backend.
            </p>
          ) : (
            <div className="divide-y">
              {catalogGroups.map((group) => (
                <div key={group.pageId} className="px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.sectionLabel}</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {group.pageLabel}
                    {group.pagePath ? (
                      <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{group.pagePath}</span>
                    ) : null}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {group.actions.map((action) => {
                      const permId = permissionIdByCode.get(action.permission)
                      const checked = permId ? selectedIds.has(permId) : false
                      const missingInDb = !permId
                      return (
                        <li key={action.id}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition',
                              checked ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-muted/50',
                              ((!canEditPerms || readOnly) || missingInDb) && 'cursor-default opacity-80',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 size-4 rounded border-input"
                              checked={checked}
                              disabled={!canEditPerms || readOnly || missingInDb}
                              onChange={() => togglePermissionCode(action.permission)}
                            />
                            <span>
                              <span className="font-medium">{action.label}</span>
                              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{action.permission}</span>
                              {action.description ? (
                                <span className="mt-1 block text-xs text-muted-foreground">{action.description}</span>
                              ) : null}
                              {missingInDb ? (
                                <span className="mt-1 block text-xs text-destructive">
                                  Belum ada di DB — restart backend untuk sinkron seed.
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        {!readOnly && (
          <div className="hidden flex-wrap gap-3 md:flex">
            <Button type="submit" size="lg" disabled={submitting}>
              <Save className="size-4" />
              {isCreate ? 'Buat peran' : 'Simpan peran'}
            </Button>
            {!isCreate && canDeleteRole && role && !role.isSystem && (
              <Button type="button" variant="outline" disabled={submitting} onClick={() => void handleDelete()}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            )}
          </div>
        )}
      </form>

      {!readOnly && (
        <MobileFormFooter>
          {!isCreate && canDeleteRole && role && !role.isSystem && (
            <Button type="button" variant="outline" disabled={submitting} className="flex-1" onClick={() => void handleDelete()}>
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button type="submit" form="role-form" disabled={submitting} className="flex-[1.6]">
            <Save className="size-4" />
            {isCreate ? 'Buat' : 'Simpan'}
          </Button>
        </MobileFormFooter>
      )}
    </PageShell>
  )
}
