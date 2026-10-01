import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'

import {
  EstimateFlowError,
  estimateStateKind,
  mapEstimateContent,
  stepOfState
} from '../services/estimate-result.logic'
import { projectStatus } from '../services/project-list.service'
import type { EstimateResult, Project } from '../types/design.types'
import type { CreateProjectPayload } from './design.api'
import { mockDesignApi } from './design.mock'
import { estimateGenerationApi } from './estimate-generation.api'

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
  const currentStep = stepOfState(item.state)
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
      const step = stepOfState(e.state)
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
      const step = stepOfState(e.state)
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

  /**
   * Chờ kết quả dự toán (Bước 2): đọc trạng thái bản dự toán định kỳ cho tới khi có kết quả hoặc thất bại.
   * Việc GỬI AI (giữ một lượt) là thao tác riêng ở cuối Bước 1; vào Bước 2 mà chưa gửi thì ném
   * `EstimateFlowError('notSubmitted')` để quay về Bước 1 — mở lại trang không bao giờ tự tốn thêm lượt.
   */
  generateEstimate: (projectId: string, signal?: AbortSignal): Promise<EstimateResult> => {
    if (!isApiEstimateId(projectId)) return mockDesignApi.generateEstimate(projectId)
    return waitForEstimate(projectId, signal)
  },

  getEstimate: (projectId: string, signal?: AbortSignal): Promise<EstimateResult> => {
    if (!isApiEstimateId(projectId)) return mockDesignApi.getEstimate(projectId)
    return waitForEstimate(projectId, signal)
  }
}

/* ===========================================================================
 * Chờ và đọc kết quả dự toán thật
 * ======================================================================== */

/** Hỏi lại trạng thái mỗi 3 giây (AI không có tiến độ phần trăm để hỏi). */
const POLL_INTERVAL_MS = 3_000
/** Quá hạn chờ phía khách (BE tự chốt Failed/TimedOut sau 15 phút, đây chỉ là chốt chặn). */
const MAX_WAIT_MS = 20 * 60_000

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true }
    )
  })
}

async function loadEstimateResult(projectId: string, detail: BmtEstimateDetail): Promise<EstimateResult> {
  const raw = await estimateGenerationApi.getResult(projectId)
  const mapped = mapEstimateContent(raw.dossier?.content, {
    projectId,
    areaM2: Number(detail.input?.areaM2) || 0
  })
  return { ...mapped.result, isSample: mapped.isSample, notice: mapped.notice }
}

async function waitForEstimate(projectId: string, signal?: AbortSignal): Promise<EstimateResult> {
  const startedAt = Date.now()
  while (!signal?.aborted) {
    const detail = await http.get<BmtEstimateDetail>(`/estimates/${projectId}`)
    switch (estimateStateKind(detail.state)) {
      case 'succeeded':
        return loadEstimateResult(projectId, detail)
      case 'draft':
        throw new EstimateFlowError('notSubmitted')
      case 'failed':
        throw new EstimateFlowError('failed', detail.failureCode)
      default:
        if (Date.now() - startedAt > MAX_WAIT_MS) throw new EstimateFlowError('failed', 'GenerationTimedOut')
        await sleep(POLL_INTERVAL_MS, signal)
    }
  }
  throw new DOMException('Aborted', 'AbortError')
}
