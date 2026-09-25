import type {
  CmsBuildingTypeOption,
  CmsContractor,
  CmsDesignProject,
  CmsFloorOption,
  HandbookTemplate
} from '@/shared/cms'

/**
 * Quy tắc của danh mục Loại công trình / Phương án Số tầng (epic
 * ConstructionTypeManagement) — thuần, không React, không HTTP.
 */

/** So khớp tên không phân biệt hoa thường, bỏ khoảng trắng hai đầu (§2: tên không trùng). */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('vi') === b.trim().toLocaleLowerCase('vi')
}

/** Nơi một loại công trình có thể đã được dùng — chặn xóa cứng (§6). */
export interface CatalogUsageSources {
  projects: readonly CmsDesignProject[]
  contractors: readonly CmsContractor[]
  templates: readonly HandbookTemplate[]
}

/** Số bản ghi đang dùng loại công trình này: hồ sơ dự án, năng lực / dự án nhà thầu, mẫu 2D. */
export function buildingTypeUsage(type: CmsBuildingTypeOption, sources: CatalogUsageSources): number {
  const projects = sources.projects.filter((project) => sameName(project.buildingTypeLabel, type.label)).length
  const contractors = sources.contractors.filter(
    (contractor) =>
      contractor.buildingTypeIds?.includes(type.id) ||
      contractor.featuredProjects.some((project) => project.buildingTypeId === type.id)
  ).length
  const templates = sources.templates.filter((template) => template.tags.buildingType === type.id).length
  return projects + contractors + templates
}

/** Số bản ghi đang dùng một phương án Số tầng — đã dùng thì không xóa cứng (§3). */
export function floorOptionUsage(
  option: CmsFloorOption,
  sources: CatalogUsageSources & { buildingTypes: readonly CmsBuildingTypeOption[] }
): number {
  const types = sources.buildingTypes.filter((type) => type.floors.optionIds.includes(option.id)).length
  const dossiers = sources.projects.filter((project) => project.floorOptionId === option.id).length
  const projects = sources.contractors
    .flatMap((contractor) => contractor.featuredProjects)
    .filter((project) => project.floorOptionId === option.id).length
  const templates = sources.templates.filter((template) => template.tags.floorCount === option.id).length
  return types + dossiers + projects + templates
}

/** Lý do loại công trình CHƯA kích hoạt được (§2, §3) — `null` khi cấu hình hợp lệ. */
export type BuildingTypeProblem = 'floorsEmpty' | 'floorInactive' | 'defaultInvalid'

export function buildingTypeProblem(
  type: Pick<CmsBuildingTypeOption, 'floors'>,
  floorOptions: readonly CmsFloorOption[]
): BuildingTypeProblem | null {
  if (!type.floors.applies) return null
  if (type.floors.optionIds.length === 0) return 'floorsEmpty'
  const inactive = type.floors.optionIds.some(
    (id) => floorOptions.find((option) => option.id === id)?.status !== 'active'
  )
  if (inactive) return 'floorInactive'
  if (type.floors.defaultOptionId && !type.floors.optionIds.includes(type.floors.defaultOptionId)) {
    return 'defaultInvalid'
  }
  return null
}

/** Một phương án Số tầng bị bỏ khỏi loại công trình, kèm số hồ sơ cũ đang dùng nó (§5). */
export interface RemovedFloorOptionImpact {
  optionId: string
  projects: number
}

/**
 * Phương án Số tầng mà bản cập nhật BỎ khỏi loại công trình (bỏ khỏi danh sách,
 * hoặc chuyển Số tầng sang Không áp dụng) mà hồ sơ cũ của loại đó đang dùng —
 * admin phải thấy số hồ sơ bị ảnh hưởng trước khi xác nhận (§5). Hồ sơ cũ
 * không bị sửa; con số chỉ để admin biết.
 */
export function removedFloorOptionImpact(
  previous: CmsBuildingTypeOption,
  next: CmsBuildingTypeOption,
  projects: readonly CmsDesignProject[]
): RemovedFloorOptionImpact[] {
  const before = previous.floors.applies ? previous.floors.optionIds : []
  const after = new Set(next.floors.applies ? next.floors.optionIds : [])
  const ofType = projects.filter((project) => sameName(project.buildingTypeLabel, previous.label))
  return before
    .filter((id) => !after.has(id))
    .map((optionId) => ({
      optionId,
      projects: ofType.filter((project) => project.floorOptionId === optionId).length
    }))
    .filter((impact) => impact.projects > 0)
}
