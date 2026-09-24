import catalogJson from '@/config/access-catalog.json'

export type CatalogPermissionEntry = {
  id: string
  label: string
  permission: string
  resource: string
  action: string
  description?: string
  routes?: string[]
  operatorDefault?: boolean
}

export type CatalogPageGroup = {
  sectionId: string
  sectionLabel: string
  pageId: string
  pageLabel: string
  pagePath?: string
  actions: CatalogPermissionEntry[]
}

export type AccessCatalogPage = {
  id: string
  label: string
  path?: string
  actions: CatalogPermissionEntry[]
}

export type AccessCatalogMenuItem = {
  id: string
  label: string
  description?: string
  path: string
  icon?: string
  end?: boolean
  menuPermission?: string
  pages?: AccessCatalogPage[]
}

export type AccessCatalogSection = {
  id: string
  label: string
  menu?: AccessCatalogMenuItem[]
}

export type AccessCatalog = {
  version: number
  sections: AccessCatalogSection[]
  metaPermissions?: CatalogPermissionEntry[]
  roleDefaults?: {
    workspaceAdmin?: string
    operatorPermissionCodes?: string[]
  }
}

/** Salinan `shared/access-catalog.json` — sync via `make sync-access-catalog`. */
export const accessCatalog: AccessCatalog = catalogJson as AccessCatalog

export function flattenCatalogPermissionEntries(catalog: AccessCatalog = accessCatalog): CatalogPermissionEntry[] {
  const seen = new Set<string>()
  const out: CatalogPermissionEntry[] = []

  const push = (entry: CatalogPermissionEntry) => {
    if (!entry.permission || seen.has(entry.permission)) return
    seen.add(entry.permission)
    out.push(entry)
  }

  for (const section of catalog.sections) {
    for (const menu of section.menu ?? []) {
      for (const page of menu.pages ?? []) {
        for (const action of page.actions) {
          push(action as CatalogPermissionEntry)
        }
      }
    }
  }
  for (const meta of catalog.metaPermissions ?? []) {
    push(meta as CatalogPermissionEntry)
  }
  return out
}

/** Kelompokkan untuk form peran: mengikuti menu & halaman FE. */
export function groupCatalogForRoleForm(catalog: AccessCatalog = accessCatalog): CatalogPageGroup[] {
  const groups: CatalogPageGroup[] = []
  for (const section of catalog.sections) {
    for (const menu of section.menu ?? []) {
      for (const page of menu.pages ?? []) {
        if (page.actions.length === 0) continue
        groups.push({
          sectionId: section.id,
          sectionLabel: section.label,
          pageId: page.id,
          pageLabel: page.label,
          pagePath: page.path,
          actions: page.actions as CatalogPermissionEntry[],
        })
      }
    }
  }
  const meta = catalog.metaPermissions ?? []
  if (meta.length > 0) {
    groups.push({
      sectionId: 'meta',
      sectionLabel: 'Sistem',
      pageId: 'meta.permissions',
      pageLabel: 'Permission & audit (API)',
      actions: meta as CatalogPermissionEntry[],
    })
  }
  return groups
}

export type CatalogMenuItem = {
  id: string
  label: string
  description?: string
  path: string
  icon?: string
  end?: boolean
  menuPermission?: string
}

export function mainNavFromCatalog(catalog: AccessCatalog = accessCatalog): CatalogMenuItem[] {
  const main = catalog.sections.find((s) => s.id === 'main')
  if (!main?.menu) return []
  return main.menu.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    path: item.path,
    icon: item.icon,
    end: 'end' in item ? Boolean(item.end) : undefined,
  }))
}

export function accessNavFromCatalog(catalog: AccessCatalog = accessCatalog): CatalogMenuItem[] {
  const access = catalog.sections.find((s) => s.id === 'access')
  if (!access?.menu) return []
  return access.menu.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    path: item.path,
    icon: item.icon,
    menuPermission: 'menuPermission' in item ? item.menuPermission : undefined,
  }))
}

export function operatorDefaultPermissionCodes(catalog: AccessCatalog = accessCatalog): string[] {
  return [...(catalog.roleDefaults?.operatorPermissionCodes ?? [])]
}
