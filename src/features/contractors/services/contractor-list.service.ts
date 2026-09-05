import { MAX_INVITATIONS } from '../constants/contractors.constants'
import type { Contractor, ContractorSort, Invitation, SearchRadiusKm } from '../types/contractor.types'

/**
 * Logic thuần của danh sách nhà thầu (S12) và landing (S09) — không React,
 * không HTTP, để bộ lọc trên hai màn không bao giờ lệch nhau.
 */

/** Bộ lọc của header dự án + chip sắp xếp (S12). */
export interface ContractorFilters {
  radiusKm: SearchRadiusKm
  sort: ContractorSort
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

/** Lọc theo bán kính rồi sắp xếp theo chip đang chọn (S12). */
export function filterContractors(contractors: readonly Contractor[], filters: ContractorFilters): Contractor[] {
  return contractors.filter((c) => c.distanceKm <= filters.radiusKm).sort(COMPARATORS[filters.sort])
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
