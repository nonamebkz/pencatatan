import type { CatalogMenuItem } from '@/lib/access-catalog'
import type { Workspace } from '@/api/workspace'

export const TEMPLATE_LELE = 'lele'
export const TEMPLATE_GENERIC = 'generic'
export const TEMPLATE_PERSONAL = 'personal'

const LELE_ONLY_NAV_IDS = new Set(['nav.ponds', 'nav.water_quality'])
const GENERIC_ONLY_NAV_IDS = new Set(['nav.operational_units'])

const LELE_BLOCKED_PREFIXES = ['/operational-units']
const GENERIC_BLOCKED_PREFIXES = [
  '/ponds',
  '/water-quality',
  '/settings/water-quality',
  '/finance/rent',
]

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function filterMainNavForWorkspace(items: CatalogMenuItem[], workspace: Workspace | null | undefined) {
  if (!workspace) return items

  if (workspace.type === 'PERSONAL') {
    const personalAllowed = new Set(['nav.dashboard', 'nav.finance'])
    return items.filter((item) => personalAllowed.has(item.id))
  }

  const templateId = workspace.templateId || TEMPLATE_LELE
  return items.filter((item) => {
    if (templateId === TEMPLATE_GENERIC && LELE_ONLY_NAV_IDS.has(item.id)) return false
    if (templateId === TEMPLATE_LELE && GENERIC_ONLY_NAV_IDS.has(item.id)) return false
    return true
  })
}

export function isRouteBlockedForWorkspace(pathname: string, workspace: Workspace | null | undefined) {
  if (!workspace) return false

  if (workspace.type === 'PERSONAL') {
    const personalBlocked = [
      '/ponds',
      '/water-quality',
      '/settings/water-quality',
      '/finance/rent',
      '/finance/reports',
      '/finance/cash-accounts',
      '/finance/purchases',
      '/finance/expenses',
      '/operational-units',
    ]
    return personalBlocked.some((prefix) => matchesPrefix(pathname, prefix))
  }

  const templateId = workspace.templateId || TEMPLATE_LELE
  if (templateId === TEMPLATE_GENERIC) {
    return GENERIC_BLOCKED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  }
  if (templateId === TEMPLATE_LELE) {
    return LELE_BLOCKED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  }
  return false
}

export function isLeleTemplate(workspace: Workspace | null | undefined) {
  if (!workspace || workspace.type === 'PERSONAL') return false
  return (workspace.templateId || TEMPLATE_LELE) === TEMPLATE_LELE
}
