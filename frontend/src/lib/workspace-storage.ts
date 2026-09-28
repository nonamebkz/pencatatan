const ACTIVE_WORKSPACE_KEY = 'pencatatan_active_workspace_id'

/** Workspace usaha seed — selaras `model.DefaultWorkspaceID` di backend. */
export const DEFAULT_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001'

export function getStoredWorkspaceId(): string | null {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY)
}

export function setStoredWorkspaceId(id: string) {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
}

export function clearStoredWorkspaceId() {
  localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
}

export function resolveWorkspaceId(): string {
  return getStoredWorkspaceId() ?? DEFAULT_WORKSPACE_ID
}
