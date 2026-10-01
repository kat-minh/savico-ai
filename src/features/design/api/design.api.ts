import { env } from '@/shared/config/env'
import { bmtDesignApi } from './design.bmt'
import { mockDesignApi } from './design.mock'

export interface CreateProjectPayload {
  name: string
  description?: string
}

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 *
 * Đã nối: CRUD dự án — danh sách (`GET /estimates`), tạo (`POST /estimates`),
 * mở (`GET /estimates/{id}`), đổi tên (`PATCH /estimates/{id}/name`), xóa
 * (`POST /estimates/bulk-delete`). Luồng nhập liệu / gửi AI / kết quả VẪN mock
 * (DTO input dùng GUID vs FE enum, dossier "chờ AI") — thin fns đã sẵn ở
 * `design.bmt.ts` để nối khi UI đổi model + BE chốt dossier.
 */
const BmtDesignApi = {
  listProjects: bmtDesignApi.listProjects,
  createProject: bmtDesignApi.createProject,
  getProject: bmtDesignApi.getProject,
  renameProject: bmtDesignApi.renameProject,
  deleteProject: bmtDesignApi.deleteProject,
  // Dự toán THẬT (id UUID) chờ và đọc kết quả từ BE; dự án mock (SVC-…) vẫn chạy mock.
  generateEstimate: bmtDesignApi.generateEstimate,
  getEstimate: bmtDesignApi.getEstimate,
  getDossier: bmtDesignApi.getDossier,
  renderDossier: bmtDesignApi.renderDossier,
  createShareLink: bmtDesignApi.createShareLink,
  revokeShareLink: bmtDesignApi.revokeShareLink,
  sendDossierEmail: bmtDesignApi.sendDossierEmail,
  getSharedEstimate: bmtDesignApi.getSharedEstimate
} satisfies Partial<typeof mockDesignApi>

export const designApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockDesignApi : { ...mockDesignApi, ...BmtDesignApi }
