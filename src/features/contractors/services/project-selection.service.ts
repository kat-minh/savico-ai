import type { ProjectBrief } from '../types/contractor.types'
import { isBriefComplete } from './brief.service'

export type SelectedProject = Pick<
  ProjectBrief,
  'id' | 'constructionSiteId' | 'name' | 'buildingType' | 'scale' | 'address' | 'selfCreated' | 'updatedAt'
> & { userId?: string; ownershipVersion?: 1 }

const selectedProjectSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
  ownershipVersion: z.literal(1).optional(),
  constructionSiteId: z.string().optional(),
  name: z.string(),
  buildingType: z.string(),
  scale: z.enum(PROJECT_SCALES),
  address: z.object({
    provinceCode: z.number().nullable(),
    provinceName: z.string(),
    wardCode: z.number().nullable(),
    wardName: z.string(),
    street: z.string()
  }),
  selfCreated: z.boolean(),
  updatedAt: z.string()
})

/** Missing, cleared or malformed browser storage must not keep an old in-memory choice. */
export function restoreProjectSelections(persisted: unknown): Record<string, SelectedProject> {
  const state = z.object({ selectedProjects: z.record(z.string(), z.unknown()) }).safeParse(persisted)
  if (!state.success) return {}
  const restored: Record<string, SelectedProject> = {}
  for (const [userId, value] of Object.entries(state.data.selectedProjects)) {
    const project = selectedProjectSchema.safeParse(value)
    if (project.success && (!project.data.userId || project.data.userId === userId)) restored[userId] = project.data
  }
  return restored
}

export function isSelectableProject(brief: ProjectBrief, userId: string): boolean {
  return (
    brief.userId === userId && brief.ownershipVersion === 1 && brief.status !== 'contracted' && isBriefComplete(brief)
  )
}

export function sameSelectedProject(selected: SelectedProject | undefined, brief: ProjectBrief): boolean {
  return Boolean(
    selected &&
    (selected.id === brief.id ||
      (selected.constructionSiteId && selected.constructionSiteId === brief.constructionSiteId))
  )
}

/** Resolve against the current owned list, including local-ID/server-ID aliases. */
export function resolveSelectedProject(
  briefs: readonly ProjectBrief[],
  selected: SelectedProject | undefined,
  userId: string
): ProjectBrief | undefined {
  const eligible = briefs.filter((brief) => isSelectableProject(brief, userId))
  return (
    eligible.find((brief) => sameSelectedProject(selected, brief)) ??
    [...eligible].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  )
}

export function projectSelectionSnapshot(brief: ProjectBrief): SelectedProject {
  const {
    id,
    userId,
    ownershipVersion,
    constructionSiteId,
    name,
    buildingType,
    scale,
    address,
    selfCreated,
    updatedAt
  } = brief
  return {
    id,
    userId,
    ownershipVersion,
    constructionSiteId,
    name,
    buildingType,
    scale,
    address,
    selfCreated,
    updatedAt
  }
}
import { z } from 'zod'
import { PROJECT_SCALES } from '../constants/contractors.constants'
