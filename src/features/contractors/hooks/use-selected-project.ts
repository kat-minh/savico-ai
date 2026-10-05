'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/shared/auth'
import {
  hydrateProjectSelection,
  PROJECT_SELECTION_STORAGE_KEY,
  useProjectSelectionStore
} from '../store/project-selection.store'

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
    void hydrateProjectSelection().then(() => {
      if (active) setIsHydrated(true)
    })
    const syncStorage = () => void useProjectSelectionStore.persist.rehydrate()
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === PROJECT_SELECTION_STORAGE_KEY || event.key === null))
        syncStorage()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', syncStorage)
    return () => {
      active = false
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', syncStorage)
    }
  }, [])

  return { userId, selectedProject, isHydrated }
}
