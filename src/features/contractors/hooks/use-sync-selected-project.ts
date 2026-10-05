'use client'

import { useEffect } from 'react'
import { isSelectableProject } from '../services/project-selection.service'
import { useProjectSelectionStore } from '../store/project-selection.store'
import type { ProjectBrief } from '../types/contractor.types'
import { useSelectedProject } from './use-selected-project'

/** The successfully loaded project on an explicit URL becomes the browser preference. */
export function useSyncSelectedProject(brief: ProjectBrief | undefined) {
  const { userId, isHydrated } = useSelectedProject()
  useEffect(() => {
    if (!isHydrated || !userId || !brief || !isSelectableProject(brief, userId)) return
    try {
      useProjectSelectionStore.getState().selectProject(userId, brief)
    } catch {
      // Browser preferences must not prevent viewing an owned project.
    }
  }, [brief, isHydrated, userId])
}
