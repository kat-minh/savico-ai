import { http } from '@/shared/lib/api'
import type { Contractor } from '../types/contractor.types'
import { mockContractorsApi } from './contractors.mock'

/**
 * Nối khu KHÁCH XEM nhà thầu vào BMT API (STORY-CTR-004, TDD-CTR-002).
 *
 * Chỉ ba endpoint đọc công khai có API: danh sách (`GET /contractors`), bộ lọc
 * (`GET /contractors/filter-options`), chi tiết (`GET /contractors/{id}`). Toàn
 * bộ luồng cũ S09–S18 (mời báo giá, khảo sát, đánh giá, so sánh, hồ sơ gửi thầu)
 * KHÔNG có API, ngoài phạm vi → giữ mock.
 *
 * LỆCH NỀN TẢNG (spec đã cảnh báo): FE `Contractor.scopes` dùng 4 mã cứng
 * (turnkey/shell/finishing/interior) còn API dùng danh mục phạm vi GUID động —
 * không map thẳng được nên để trống `scopes` khi lấy từ API. Nhiều field thẻ S09
 * (similarProjects, strengths, region…) không có nguồn API → để mặc định.
 *
 * DB nhà thầu đang RỖNG nên list/detail TỰ VỀ MOCK khi API trả rỗng / lỗi / 404
 * để demo không trống — khi admin tạo & Hiện nhà thầu thì dữ liệu thật hiện ra.
 */

interface PublicContractorItem {
  contractorId: string
  name: string
  shortDescription?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  logoUrl?: string | null
  buildingTypes: { id: string; name: string }[]
  scopes: { id: string; name: string }[]
  rating?: number | null
  ratingCount?: number | null
  projectCount: number
  distanceKm?: number | null
}

/** PublicContractorItem → Contractor (type UI). Field không có nguồn API để mặc định. */
function toContractor(item: PublicContractorItem): Contractor {
  return {
    id: item.contractorId,
    name: item.name,
    ...(item.logoUrl ? { logoUrl: item.logoUrl } : {}),
    kind: '',
    // Hồ sơ công khai = đã Hiện = đã kiểm (BR-CTR-002 "publish = verified").
    verified: true,
    rating: item.rating ?? 0,
    reviewCount: item.ratingCount ?? 0,
    similarProjects: 0,
    completedProjects: item.projectCount ?? 0,
    distanceKm: item.distanceKm ?? 0,
    serviceAreas: [],
    region: 'south',
    surveyWithinHours: 0,
    acceptingProjects: false,
    intro: '',
    strengths: [],
    photos: [],
    buildingTypeIds: (item.buildingTypes ?? []).map((b) => b.id),
    // API dùng phạm vi GUID động, FE dùng 4 mã cứng → không map, để trống.
    scopes: [],
    ...(item.shortDescription ? { shortDescription: item.shortDescription } : {}),
    officeAddress: item.address ?? '',
    foundedYear: 0,
    teamSize: 0,
    warrantyMonths: 0,
    legalChecks: [],
    featuredProjects: [],
    verifiedProjects: 0,
    partnership: { verified: false, since: '', contractCode: '', signedAt: '', pageCount: 0 },
    hidden: false
  }
}

export const bmtContractorsApi = {
  async listContractors(projectId: string): Promise<Contractor[]> {
    try {
      const res = await http.get<{ items: PublicContractorItem[]; totalCount: number }>('/contractors')
      if (!res.items?.length) return mockContractorsApi.listContractors(projectId)
      return res.items.map(toContractor)
    } catch {
      return mockContractorsApi.listContractors(projectId)
    }
  },

  async getContractor(contractorId: string): Promise<Contractor> {
    try {
      // Chi tiết công khai giàu hơn item; bản CRUD này map phần lõi, các khối
      // legal/dự án/ảnh chưa map đầy đủ nên khi rỗng thì về mock cho trang hồ sơ
      // không vỡ. (Tinh chỉnh map chi tiết ở increment sau.)
      const detail = await http.get<PublicContractorItem>(`/contractors/${contractorId}`)
      if (!detail?.contractorId) return mockContractorsApi.getContractor(contractorId)
      return toContractor(detail)
    } catch {
      return mockContractorsApi.getContractor(contractorId)
    }
  }
}
