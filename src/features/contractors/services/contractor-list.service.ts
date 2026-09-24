import { MAX_INVITATIONS } from '../constants/contractors.constants'
import type {
  Contractor,
  ContractorSort,
  ExperienceLevel,
  Invitation,
  ProjectScale,
  RatingLevel,
  SearchRadiusKm,
  ServiceRegion,
  StartWindow
} from '../types/contractor.types'

/**
 * Logic thuần của danh sách nhà thầu (S12) và landing (S09) — không React,
 * không HTTP, để bộ lọc trên hai màn không bao giờ lệch nhau.
 */

/** Bộ lọc của header dự án + chip sắp xếp (S12). */
export interface ContractorFilters {
  radiusKm: SearchRadiusKm
  sort: ContractorSort
  /**
   * Tab vùng Bắc / Trung / Nam (S12). Bỏ trống thì không lọc theo vùng — landing
   * S09 dùng chung hàm này nhưng không có tab vùng.
   */
  region?: ServiceRegion
}

/**
 * Điểm "phù hợp nhất": số dự án tương tự là tín hiệu mạnh nhất, rồi tới đánh
 * giá, rồi tới việc nhận khảo sát sớm. Khoảng cách đã bị bán kính lọc trước nên
 * chỉ dùng để phá hòa.
 */
function matchScore(contractor: Contractor): number {
  return (
    contractor.similarProjects * 3 +
    contractor.rating * 10 +
    (contractor.surveyWithinHours <= 24 ? 5 : 0) +
    (contractor.acceptingProjects ? 5 : 0)
  )
}

const COMPARATORS: Record<ContractorSort, (a: Contractor, b: Contractor) => number> = {
  match: (a, b) => matchScore(b) - matchScore(a) || a.distanceKm - b.distanceKm,
  distance: (a, b) => a.distanceKm - b.distanceKm,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  survey: (a, b) => a.surveyWithinHours - b.surveyWithinHours || a.distanceKm - b.distanceKm
}

/**
 * Bộ tiêu chí của khối "Tìm đúng người theo đúng tiêu chí" ở landing (S09).
 * Trường nào bỏ trống thì tiêu chí đó không lọc.
 */
export interface ContractorCriteria {
  /** id loại công trình (`townhouse`, `villa`…) — khớp `Contractor.buildingTypeIds`. */
  buildingTypeId?: string
  scale?: ProjectScale
  experience?: ExperienceLevel
  rating?: RatingLevel
  startWindow?: StartWindow
}

/** Số lầu (không tính trệt) của một quy mô: `ground` → 0, `ground+3` → 3. */
function upperFloorsOf(scale: ProjectScale): number {
  return scale === 'ground' ? 0 : Number(scale.slice('ground+'.length))
}

const MIN_RATING: Record<RatingLevel, number> = { any: 0, good: 4, great: 4.5 }

/** Số dự án tương tự nằm trong khoảng nào thì thuộc mức kinh nghiệm đó. */
const EXPERIENCE_RANGE: Record<ExperienceLevel, readonly [min: number, max: number]> = {
  any: [0, Infinity],
  junior: [0, 4],
  mid: [5, 15],
  senior: [16, Infinity]
}

/**
 * Nhà thầu có khớp bộ tiêu chí không.
 *
 * Loại công trình và quy mô đọc từ trường nhà thầu khai báo; nhà thầu chưa khai
 * báo thì KHÔNG bị loại (không có dữ liệu để kết luận là không phù hợp). Mốc
 * khởi công: "sớm nhất" cần đang nhận dự án và khảo sát được trong 24h, "1–3
 * tháng" chỉ cần đang nhận dự án; mốc xa hơn thì nhà thầu nào cũng xếp được lịch.
 */
export function matchesCriteria(contractor: Contractor, criteria: ContractorCriteria): boolean {
  const { buildingTypeId, scale, experience, rating, startWindow } = criteria

  if (buildingTypeId && contractor.buildingTypeIds && !contractor.buildingTypeIds.includes(buildingTypeId)) return false

  if (scale && contractor.maxUpperFloors !== undefined && contractor.maxUpperFloors < upperFloorsOf(scale)) return false

  if (experience) {
    const [min, max] = EXPERIENCE_RANGE[experience]
    if (contractor.similarProjects < min || contractor.similarProjects > max) return false
  }

  if (rating && contractor.rating < MIN_RATING[rating]) return false

  if (startWindow === 'asap' && !(contractor.acceptingProjects && contractor.surveyWithinHours <= 24)) return false
  if (startWindow === 'in-1-3-months' && !contractor.acceptingProjects) return false

  return true
}

/** Lọc theo bán kính (+ tiêu chí ở landing nếu có) rồi sắp xếp theo chip đang chọn. */
export function filterContractors(
  contractors: readonly Contractor[],
  filters: ContractorFilters,
  criteria: ContractorCriteria = {}
): Contractor[] {
  return contractors
    .filter((c) => c.distanceKm <= filters.radiusKm)
    .filter((c) => !filters.region || c.region === filters.region)
    .filter((c) => matchesCriteria(c, criteria))
    .sort(COMPARATORS[filters.sort])
}

/**
 * R1 — còn được mời bao nhiêu nhà thầu nữa. Đủ 3 thì mọi nút "Mời báo giá" ở
 * S12/S13/S15 phải khóa lại, không chỉ ẩn ô đếm ở S18.
 */
export function remainingInvites(invitations: readonly Invitation[]): number {
  return Math.max(0, MAX_INVITATIONS - invitations.length)
}

/** Nhà thầu này đã được mời cho dự án đang xét chưa. */
export function isInvited(invitations: readonly Invitation[], contractorId: string): boolean {
  return invitations.some((invitation) => invitation.contractorId === contractorId)
}
