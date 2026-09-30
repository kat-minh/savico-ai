import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'

import { projectStatus } from '../services/project-list.service'
import type { DesignStep, Project } from '../types/design.types'
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
  }
}
