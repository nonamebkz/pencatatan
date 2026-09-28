import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { listWorkspaces, type Workspace } from '@/api/workspace'
import { useAuth } from '@/contexts/AuthContext'
import {
  clearStoredWorkspaceId,
  DEFAULT_WORKSPACE_ID,
  getStoredWorkspaceId,
  setStoredWorkspaceId,
} from '@/lib/workspace-storage'

type WorkspaceContextValue = {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  activeId: string
  loading: boolean
  switchWorkspace: (id: string) => void
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function pickInitialWorkspace(items: Workspace[]): Workspace | null {
  if (items.length === 0) return null
  const stored = getStoredWorkspaceId()
  if (stored) {
    const match = items.find((w) => w.id === stored)
    if (match) return match
  }
  return items.find((w) => w.id === DEFAULT_WORKSPACE_ID) ?? items[0]
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeId, setActiveId] = useState(() => getStoredWorkspaceId() ?? DEFAULT_WORKSPACE_ID)
  const [loading, setLoading] = useState(true)

  const refreshWorkspaces = useCallback(async () => {
    const response = await listWorkspaces()
    const items = response.data ?? []
    setWorkspaces(items)
    const initial = pickInitialWorkspace(items)
    if (initial) {
      setActiveId(initial.id)
      setStoredWorkspaceId(initial.id)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setWorkspaces([])
      setLoading(false)
      clearStoredWorkspaceId()
      return
    }
    setLoading(true)
    refreshWorkspaces()
      .catch(() => {
        setWorkspaces([])
      })
      .finally(() => setLoading(false))
  }, [user, refreshWorkspaces])

  const switchWorkspace = useCallback(
    (id: string) => {
      if (id === activeId) return
      setActiveId(id)
      setStoredWorkspaceId(id)
      navigate('/', { replace: true })
    },
    [activeId, navigate],
  )

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId],
  )

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      activeId,
      loading,
      switchWorkspace,
      refreshWorkspaces,
    }),
    [workspaces, activeWorkspace, activeId, loading, switchWorkspace, refreshWorkspaces],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace harus dipakai di dalam WorkspaceProvider')
  }
  return ctx
}
