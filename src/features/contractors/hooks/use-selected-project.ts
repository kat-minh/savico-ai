'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/shared/auth'
import { useProjectSelectionStore } from '../store/project-selection.store'

/** Restore browser selection after hydration, keeping each account's choice separate. */
export function useSelectedProject() {
  const [isHydrated, setIsHydrated] = useState(false)
  const userId = useAuthStore((state) => state.user?.id)
  const selectedProject = useProjectSelectionStore((state) => {
    const selected = userId ? state.selectedProjects[userId] : undefined
    if (!selected || (selected.userId !== undefined && selected.userId !== userId)) return undefined
    return selected.ownershipVersion === 1 || selected.constructionSiteId ? selected : undefined
  })

  useEffect(() => {
    let active = true
    const hydration = useProjectSelectionStore.persist.hasHydrated()
      ? undefined
      : useProjectSelectionStore.persist.rehydrate()
    void Promise.resolve(hydration).then(() => {
      if (active) setIsHydrated(true)
    })
    return () => {
      active = false
    }
  }, [])

  return { userId, selectedProject, isHydrated }
}
