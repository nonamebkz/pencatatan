import { useCallback, useMemo } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import {
  accessCatalog,
  canCatalogPageAction,
  canSeeCatalogMenu,
  canViewCatalogPage,
  findCatalogPageById,
  type AccessCatalogMenuItem,
  type AccessCatalogPage,
} from '@/lib/access-catalog'

export function useCatalogAccess() {
  const { can } = useAuth()

  const canViewPage = useCallback(
    (page: AccessCatalogPage) => canViewCatalogPage(can, page),
    [can],
  )

  const canViewPageId = useCallback(
    (pageId: string) => {
      const page = findCatalogPageById(pageId)
      return page ? canViewCatalogPage(can, page) : true
    },
    [can],
  )

  const canPageAction = useCallback(
    (pageId: string, actionId: string) => canCatalogPageAction(can, pageId, actionId),
    [can],
  )

  const canSeeMenu = useCallback(
    (menu: AccessCatalogMenuItem) => canSeeCatalogMenu(can, menu),
    [can],
  )

  return useMemo(
    () => ({
      can,
      canViewPage,
      canViewPageId,
      canPageAction,
      canSeeMenu,
      findPage: findCatalogPageById,
      catalog: accessCatalog,
    }),
    [can, canViewPage, canViewPageId, canPageAction, canSeeMenu],
  )
}
