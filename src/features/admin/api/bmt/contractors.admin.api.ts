import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'

/**
 * QUẢN LÝ NHÀ THẦU (Contractor — STORY-CTR-001/002, TDD-CTR-001, BR-CTR-001..004).
 *
 * BE tách API rất nhỏ (profile PUT, projects, assets, visibility riêng) nhưng
 * màn admin gộp lại thành CRUD gọn: list → form tạo/sửa hồ sơ → ẩn/hiện → xoá.
 * Hồ sơ mặc định ẨN; muốn HIỆN cần đủ trường bắt buộc (BR-CTR-002: name +
 * address + latitude + longitude + ≥1 loại công trình + ≥1 phạm vi). Liên hệ
 * (person/phone/email) chỉ có ở API admin (BR-CTR-004). Mọi ghi cần
 * `expectedVersion` (khoá lạc quan) — 409 `ContractorVersionConflict` thì dừng,
 * không tự ghi đè.
 *
 * Swagger BE không mô tả response body → các kiểu dưới dựng theo TDD-CTR-001,
 * cần verify bằng gọi live (map thủ công ở service khi có sai khác).
 */

/* ===== Kiểu con của hồ sơ ===== */
export interface ContractorProfileInput {
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  shortDescription?: string | null
  introduction?: string | null
  contractorType?: string | null
  foundedYear?: number | null
  architectCount?: number | null
  engineerCount?: number | null
  serviceAreaText?: string | null
  surveyHours?: number | null
  warrantyMonths?: number | null
  acceptingProjects?: boolean | null
  rating?: number | null
  ratingCount?: number | null
  contactPerson?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
}

export interface ContractorLegalInput {
  legalName?: string | null
  taxCode?: string | null
  representative?: string | null
  registeredAddress?: string | null
  industry?: string | null
  establishedDate?: string | null
  workforceSize?: number | null
  warrantyTerms?: string | null
  usesBuildXContract?: boolean | null
  insuranceDescription?: string | null
}

export interface ContractorLicenseInput {
  licenseId?: string | null
  licenseType?: string | null
  licenseNumber?: string | null
  issuer?: string | null
  issuedOn?: string | null
  expiresOn?: string | null
  assetId?: string | null
}

export interface ContractorPartnershipInput {
  startsOn?: string | null
  endsOn?: string | null
  signedOn?: string | null
  recordCode?: string | null
  pageCount?: number | null
  assetId?: string | null
}

export interface ContractorImageInput {
  assetId: string
  kind: string
  position: number
}

/** Body của `PUT /admin/contractors/{id}` (ProfileUpdate). */
export interface ContractorProfileUpdate {
  expectedVersion: number
  profile: ContractorProfileInput
  buildingTypeIds: string[]
  scopeIds: string[]
  legal: ContractorLegalInput
  licenses: ContractorLicenseInput[]
  partnership: ContractorPartnershipInput
  images: ContractorImageInput[]
}

/* ===== Response (dựng theo TDD-CTR-001 — verify khi gọi live) ===== */
export interface AdminContractorItem {
  id: string
  name: string
  status: string // "Hidden" | "Visible"
  address?: string | null
  version: number
  updatedAtUtc?: string
}

export interface AdminContractorDetail {
  id: string
  profile: ContractorProfileInput
  buildingTypeIds: string[]
  scopeIds: string[]
  legal: ContractorLegalInput
  licenses: ContractorLicenseInput[]
  partnership: ContractorPartnershipInput
  images: ContractorImageInput[]
  contact?: { person?: string | null; phone?: string | null; email?: string | null }
  status: string
  version: number
  missingFields?: string[]
}

export interface ContractorSaved {
  contractorId: string
  version: number
  status: string
}

const BASE = '/admin/contractors'
const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })

export const contractorsAdminApi = {
  list: (params: { status?: string; pageIndex: number; pageSize: number }) =>
    http.get<PagedResult<AdminContractorItem>>(BASE, { params }),

  get: (id: string) => http.get<AdminContractorDetail>(`${BASE}/${id}`),

  /** Tạo hồ sơ mới — chỉ cần tên; BE lưu trạng thái ẨN, version = 1. */
  create: (name: string) => http.post<ContractorSaved>(BASE, { name }, idempotent()),

  update: (id: string, body: ContractorProfileUpdate) => http.put<ContractorSaved>(`${BASE}/${id}`, body, idempotent()),

  setVisibility: (id: string, expectedVersion: number, isVisible: boolean) =>
    http.patch<ContractorSaved>(`${BASE}/${id}/visibility`, { expectedVersion, isVisible }, idempotent()),

  remove: (id: string, expectedVersion: number) => http.delete<void>(`${BASE}/${id}`, { params: { expectedVersion } })
}
