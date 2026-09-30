import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'

import { projectStatus } from '../services/project-list.service'
import type { DesignStep, Project } from '../types/design.types'
import type { CreateProjectPayload } from './design.api'
import { mockDesignApi } from './design.mock'

/**
 * Nối màn "Dự án của tôi" (danh sách + xóa dự toán) vào BMT API — GIỮ MOCK LÀM
 * NỀN. BE mới cấp `GET /estimates` (danh sách) và `POST /estimates/bulk-delete`
 * (xóa). Các bước tạo / nhập liệu / gửi AI của luồng Thiết kế VẪN mock (thiếu
 * upload ảnh + lệch model Bước 1 — xem `docs/BE_API_GAPS.md`), nên:
 * - `GET /estimates` rỗng hoặc lỗi → về mock để màn không trống khi demo.
 * - Xóa: dự toán THẬT (id uuid) gọi API; dự toán mock (id `SVC-…`) xóa ở mock.
 */

interface BmtEstimateListItem {
  estimateId: string
  name: string
  buildingType?: { id: string; name: string } | null
  /** Draft, Processing, Failed, Succeeded — trạng thái tác vụ tạo thiết kế gần nhất. */
  state: string
  createdAtUtc: string
  modifiedAtUtc: string
}

/** id dự toán thật là uuid; id mock có dạng `SVC-YYYY-NNNN`. */
const isApiEstimateId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)

/** Bước đang dừng suy từ trạng thái tác vụ AI (BE chưa trả bước rõ ràng). */
function stepFromState(state: string): DesignStep {
  if (state === 'Succeeded') return 3
  if (state === 'Processing' || state === 'Failed') return 2
  return 1
}

const idem = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })
const nowIso = () => new Date().toISOString()

/** DTO đầu vào Bước 1 (`Response`/`Command` của `/estimates/{id}/input`, TDD-PROJ-001). */
interface BmtEstimateInput {
  buildingTypeId: string | null
  areaM2: string | null
  description: string | null
  provinceCode: string | null
  wardCode: string | null
  locationDatasetVersion: string | null
  addressDetail: string | null
  finishPackage: string | null
  floorCount: number | null
  hasTum: boolean | null
  architectureStyleId: string | null
  interiorStyleId: string | null
  inputImageUrl: string | null
}

/** `GET /estimates/{id}` (TDD-PROJ-001). Không có createdAt/updatedAt trong DTO này. */
interface BmtEstimateDetail {
  estimateId: string
  name: string
  nameVersion: number
  canRename: boolean
  inputVersion: number
  catalogRevisionId: string | null
  input: BmtEstimateInput
  state: string
  failureCode?: string | null
  canEdit: boolean
  writeDeniedCode?: string | null
  missingFields?: string[]
}

function toProject(item: BmtEstimateListItem): Project {
  const currentStep = stepFromState(item.state)
  return {
    id: item.estimateId,
    name: item.name,
    createdAt: item.createdAtUtc,
    updatedAt: item.modifiedAtUtc,
    currentStep,
    status: projectStatus(currentStep),
    // API list chưa trả ảnh render và diện tích sàn → để trống (thẻ tự bớt vế).
    coverUrl: null,
    // UI dùng enum loại công trình; API trả {id,name} động → chưa map, để null.
    buildingType: null,
    floorArea: null
  }
}

export const bmtDesignApi = {
  listProjects: async (): Promise<Project[]> => {
    // Đọc THẲNG dự toán thật `GET /estimates` — KHÔNG về mock khi rỗng nữa (trước
    // đây fallback demo khiến khách tưởng còn mock; luồng TẠO dự toán chưa nối BE
    // nên danh sách thật có thể trống cho tới khi bước tạo được nối). Lỗi mạng /
    // 401 → trả rỗng để trang hiện trạng thái "chưa có dự án" thay vì demo giả.
    try {
      const page = await http.get<PagedResult<BmtEstimateListItem>>('/estimates', {
        params: { pageIndex: 1, pageSize: 100 }
      })
      return page.items.map(toProject)
    } catch {
      return []
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    if (!isApiEstimateId(projectId)) return mockDesignApi.deleteProject(projectId)
    await http.post<{ deletionRequestId: string }>(
      '/estimates/bulk-delete',
      { estimateIds: [projectId] },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } }
    )
  },

  /** Tạo dự toán thật `POST /estimates` → trả receipt {estimateId,inputVersion,nameVersion}. */
  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    try {
      const saved = await http.post<{ estimateId: string; inputVersion: number; nameVersion: number }>(
        '/estimates',
        { name: payload.name },
        idem()
      )
      return {
        id: saved.estimateId,
        name: payload.name,
        ...(payload.description ? { description: payload.description } : {}),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        currentStep: 1,
        status: projectStatus(1),
        coverUrl: null,
        buildingType: null,
        floorArea: null
      }
    } catch {
      return mockDesignApi.createProject(payload)
    }
  },

  /** `GET /estimates/{id}`. DTO không có mốc thời gian → tạm dùng hiện tại (thẻ danh sách lấy mốc thật từ `/estimates`). */
  getProject: async (projectId: string): Promise<Project> => {
    if (!isApiEstimateId(projectId)) return mockDesignApi.getProject(projectId)
    try {
      const e = await http.get<BmtEstimateDetail>(`/estimates/${projectId}`)
      const step = stepFromState(e.state)
      return {
        id: e.estimateId,
        name: e.name,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        currentStep: step,
        status: projectStatus(step),
        coverUrl: e.input?.inputImageUrl ?? null,
        buildingType: null,
        floorArea: null
      }
    } catch {
      return mockDesignApi.getProject(projectId)
    }
  },

  /** Đổi tên: đọc `nameVersion` hiện hành rồi `PATCH /estimates/{id}/name` (khoá lạc quan tên). */
  renameProject: async (projectId: string, name: string): Promise<Project> => {
    if (!isApiEstimateId(projectId)) return mockDesignApi.renameProject(projectId, name)
    try {
      const e = await http.get<BmtEstimateDetail>(`/estimates/${projectId}`)
      const res = await http.patch<{ name: string; nameVersion: number }>(`/estimates/${projectId}/name`, {
        name,
        nameVersion: e.nameVersion
      })
      const step = stepFromState(e.state)
      return {
        id: projectId,
        name: res.name,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        currentStep: step,
        status: projectStatus(step),
        coverUrl: e.input?.inputImageUrl ?? null,
        buildingType: null,
        floorArea: null
      }
    } catch {
      return mockDesignApi.renameProject(projectId, name)
    }
  },

  /* ===========================================================================
   * Pipeline dự toán AI — thin fns SẴN SÀNG GỌI (TDD-PROJ-001/002/003), CHƯA nối
   * vào seam vì: (1) DTO input dùng GUID/số vs FE dùng enum (buildingType/style/
   * floorCount) — cần map/rearchitect UI; (2) DTO dossier/result "chờ AI", BE
   * chưa chốt shape; (3) cần thread expectedInputVersion/inputVersion mà chữ ký
   * mock không mang; (4) tệp là binary stream (dựng URL, không bọc Result). Nối
   * seam khi UI Bước 1–3 đổi sang model GUID + BE chốt dossier.
   * ======================================================================== */
  getEstimateDetail: (id: string) => http.get<BmtEstimateDetail>(`/estimates/${id}`),
  getCatalog: (id: string) => http.get<unknown>(`/estimates/${id}/catalog`),
  saveInput: (id: string, body: { expectedInputVersion: number; changedFields: string[]; input: BmtEstimateInput }) =>
    http.put<{ estimateId: string; savedInputVersion: number }>(`/estimates/${id}/input`, body, idem()),
  listProvinces: () =>
    http.get<{ datasetVersion: string; provinces: { code: string; name: string }[] }>('/estimate-locations/provinces'),
  listWards: (provinceCode: string, datasetVersion: string) =>
    http.get<{ wards: { code: string; name: string }[] }>(`/estimate-locations/provinces/${provinceCode}/wards`, {
      params: { datasetVersion }
    }),
  startGeneration: (id: string, inputVersion: number) =>
    http.post<{ operationId: string; state: string; acceptedAtUtc: string; deadlineUtc: string }>(
      `/estimates/${id}/generations`,
      { inputVersion },
      idem()
    ),
  getGeneration: (id: string, operationId: string) =>
    http.get<{
      operationId: string
      state: string
      acceptedAtUtc: string
      deadlineUtc: string
      settledAtUtc?: string
      failureCode?: string | null
      resultUrl?: string | null
    }>(`/estimates/${id}/generations/${operationId}`),
  getResult: (id: string) =>
    http.get<{
      operationId: string
      contractVersion: string
      estimateName: string
      dossier: unknown
      exportAvailability: unknown
    }>(`/estimates/${id}/result`),
  resultFileUrl: (id: string, fileId: string) => `/api/v1/estimates/${id}/result-files/${fileId}`,
  requestExport: (id: string, format: 'Pdf' | 'Xlsx') =>
    http.post<{ exportId: string; state: string; attemptNumber: number }>(
      `/estimates/${id}/exports`,
      { format },
      idem()
    ),
  getExport: (id: string, exportId: string) =>
    http.get<{ exportId: string; state: string; failureCode?: string | null }>(`/estimates/${id}/exports/${exportId}`),
  exportFileUrl: (id: string, exportId: string) => `/api/v1/estimates/${id}/exports/${exportId}/file`,
  createShare: (id: string, expiryDate: string) =>
    http.post<{
      shareId: string
      url: string
      expiryDate: string
      expiresAtUtc: string
      state: string
      requestedExpiryApplied: boolean
    }>(`/estimates/${id}/shares`, { expiryDate }, idem()),
  getCurrentShare: (id: string) =>
    http.get<{ shareId: string; url: string; expiryDate: string; expiresAtUtc: string; state: string } | null>(
      `/estimates/${id}/shares/current`
    ),
  emailShare: (id: string, shareId: string, recipient: string) =>
    http.post<{ emailRequestId: string; state: string }>(
      `/estimates/${id}/shares/${shareId}/emails`,
      { recipient },
      idem()
    ),
  getEmailStatus: (id: string, emailRequestId: string) =>
    http.get<{ state: string; failureCode?: string | null }>(`/estimates/${id}/emails/${emailRequestId}`),
  shareQrUrl: (id: string, shareId: string) => `/api/v1/estimates/${id}/shares/${shareId}/qr`,
  revokeShare: (id: string, shareId: string) =>
    http.post<{ state: string }>(`/estimates/${id}/shares/${shareId}/revoke`, {}, idem())
}
