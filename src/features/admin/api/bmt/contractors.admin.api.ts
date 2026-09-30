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

/* ===== Response — ĐÃ ĐỐI CHIẾU VỚI API THẬT (gọi live 30/09/2026) =====
 * Lưu ý khoá chính tên là `contractorId`, KHÔNG phải `id` (cả list lẫn detail);
 * `legal` và `partnership` trả `null` khi hồ sơ chưa nhập, nên phải nullable —
 * dùng `?.` khi đọc và `?? {}` khi gửi lại trong body PUT. */
export interface AdminContractorItem {
  contractorId: string
  name: string
  status: string // "Hidden" | "Visible"
  address?: string | null
  version: number
  updatedAtUtc?: string
}

export interface AdminContractorDetail {
  contractorId: string
  profile: ContractorProfileInput
  buildingTypeIds: string[]
  scopeIds: string[]
  legal: ContractorLegalInput | null
  licenses: ContractorLicenseInput[]
  partnership: ContractorPartnershipInput | null
  images: ContractorImageInput[]
  status: string
  version: number
  missingFields?: string[]
}

export interface ContractorSaved {
  contractorId: string
  version: number
  status: string
}

/* ===== Dự án tiêu biểu (STORY-CTR-002) ===== */
export interface ContractorProjectImageInput {
  assetId: string
  position: number
}

export interface ContractorProjectInput {
  expectedVersion: number
  name: string
  buildingTypeId: string
  scopeId: string
  images: ContractorProjectImageInput[]
  widthM?: number | null
  lengthM?: number | null
  areaM2?: number | null
  floorCount?: number | null
  hasAttic?: boolean | null
  locationText?: string | null
  completedYear?: number | null
  roleText?: string | null
  mainWork?: string | null
}

export interface ContractorProjectDetail {
  id: string
  name: string
  buildingTypeId: string
  scopeId: string
  images: { assetId: string; position: number; contentUrl?: string | null }[]
  widthM?: number | null
  lengthM?: number | null
  areaM2?: number | null
  floorCount?: number | null
  hasAttic?: boolean | null
  locationText?: string | null
  completedYear?: number | null
  roleText?: string | null
  mainWork?: string | null
}

export interface ContractorProjectsResult {
  items: ContractorProjectDetail[]
  contractorVersion: number
}

export interface ContractorProjectSaved {
  projectId: string
  contractorVersion: number
}

/** Response của `POST /assets` (TDD-CTR-001) — `contentUrl` là route tệp quản trị. */
export interface ContractorAssetSaved {
  assetId: string
  originalName: string
  mediaType: string
  sizeBytes: number
  contentUrl: string
  contractorVersion: number
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

  remove: (id: string, expectedVersion: number) => http.delete<void>(`${BASE}/${id}`, { params: { expectedVersion } }),

  /* ===== Dự án tiêu biểu ===== */
  listProjects: (id: string) => http.get<ContractorProjectsResult>(`${BASE}/${id}/projects`),

  createProject: (id: string, body: ContractorProjectInput) =>
    http.post<ContractorProjectSaved>(`${BASE}/${id}/projects`, body, idempotent()),

  updateProject: (id: string, projectId: string, body: ContractorProjectInput) =>
    http.put<ContractorProjectSaved>(`${BASE}/${id}/projects/${projectId}`, body, idempotent()),

  deleteProject: (id: string, projectId: string, expectedVersion: number) =>
    http.delete<void>(`${BASE}/${id}/projects/${projectId}`, { params: { expectedVersion } }),

  /* ===== Ảnh / tệp (asset) ===== */
  uploadAsset: (id: string, file: File, expectedVersion: number) => {
    const form = new FormData()
    form.append('file', file)
    form.append('expectedVersion', String(expectedVersion))
    return http.post<ContractorAssetSaved>(`${BASE}/${id}/assets`, form, idempotent())
  },

  deleteAsset: (id: string, assetId: string, expectedVersion: number) =>
    http.delete<void>(`${BASE}/${id}/assets/${assetId}`, { params: { expectedVersion } })
}
