import { Outlet } from 'react-router-dom'

import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext'

function WorkspaceOutlet() {
  const { activeId } = useWorkspace()
  return <Outlet key={activeId} />
}

export function WorkspaceShell() {
  return (
    <WorkspaceProvider>
      <WorkspaceOutlet />
    </WorkspaceProvider>
  )
}
