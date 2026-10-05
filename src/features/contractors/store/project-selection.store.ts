'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useAuthStore } from '@/shared/auth'
import type { ProjectBrief } from '../types/contractor.types'
import {
  projectSelectionSnapshot,
  restoreProjectSelections,
  sameSelectedProject,
  type SelectedProject
} from '../services/project-selection.service'

export const PROJECT_SELECTION_STORAGE_KEY = 'savico.selected-contractor-projects'

interface ProjectSelectionState {
  selectedProjects: Record<string, SelectedProject>
  selectProject: (userId: string, brief: ProjectBrief) => void
  clearSelectedProject: (userId: string) => void
}

/** Browser preference and summary at selection time; live project data stays in Query. */
export const useProjectSelectionStore = create<ProjectSelectionState>()(
  persist(
    (set, get) => ({
      selectedProjects: {},
      selectProject: (userId, brief) => {
        if (userId !== useAuthStore.getState().user?.id || brief.userId !== userId || brief.ownershipVersion !== 1)
          throw new Error('ConstructionSiteDraftOwnerMismatch')
        const previous = get().selectedProjects
        const snapshot = projectSelectionSnapshot(brief)
        if (JSON.stringify(previous[userId]) === JSON.stringify(snapshot)) return
        try {
          set({
            selectedProjects: {
              ...previous,
              [userId]: snapshot
            }
          })
        } catch (error) {
          try {
            set({ selectedProjects: previous })
          } catch {
            // Restore in-memory selection even if writing the rollback also fails.
          }
          throw error
        }
      },
      clearSelectedProject: (userId) =>
        set((state) => {
          const selectedProjects = { ...state.selectedProjects }
          delete selectedProjects[userId]
          return { selectedProjects }
        })
    }),
    {
      name: PROJECT_SELECTION_STORAGE_KEY,
      version: 2,
      // Keep old preferences without claiming ownership; only an owned API read can restore them.
      migrate: (persisted) => ({ selectedProjects: restoreProjectSelections(persisted) }),
      merge: (persisted, current) => ({ ...current, selectedProjects: restoreProjectSelections(persisted) }),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedProjects: state.selectedProjects }),
      skipHydration: true
    }
  )
)

/** Hydrate before any write, including completion before the picker has ever mounted. */
export async function hydrateProjectSelection() {
  if (!useProjectSelectionStore.persist.hasHydrated()) await useProjectSelectionStore.persist.rehydrate()
}

/** Editing one project refreshes its saved summary without choosing a different project. */
export function refreshSelectedProject(brief: ProjectBrief) {
  const userId = useAuthStore.getState().user?.id
  if (!userId || brief.userId !== userId) return
  const store = useProjectSelectionStore.getState()
  if (sameSelectedProject(store.selectedProjects[userId], brief)) store.selectProject(userId, brief)
}
