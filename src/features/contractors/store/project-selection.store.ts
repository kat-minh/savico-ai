'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useAuthStore } from '@/shared/auth'
import type { ProjectBrief } from '../types/contractor.types'

type SelectedProject = Pick<
  ProjectBrief,
  'id' | 'constructionSiteId' | 'name' | 'buildingType' | 'scale' | 'address' | 'selfCreated' | 'updatedAt'
> & { userId?: string; ownershipVersion?: 1 }

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
        const { id, constructionSiteId, name, buildingType, scale, address, selfCreated, updatedAt } = brief
        try {
          set({
            selectedProjects: {
              ...previous,
              [userId]: {
                id,
                userId,
                ownershipVersion: 1,
                constructionSiteId,
                name,
                buildingType,
                scale,
                address,
                selfCreated,
                updatedAt
              }
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
      name: 'savico.selected-contractor-projects',
      version: 2,
      // Keep old preferences without claiming ownership; only an owned API read can restore them.
      migrate: (persisted) => persisted as Pick<ProjectSelectionState, 'selectedProjects'>,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedProjects: state.selectedProjects }),
      skipHydration: true
    }
  )
)
