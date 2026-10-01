import { http } from '@/shared/lib/api'

/**
 * Gửi AI, kết quả, xuất tệp và chia sẻ của bản dự toán THẬT (TDD-PROJ-002/003) — mỏng, chỉ khai kiểu và gọi.
 * Logic (ánh xạ kết quả, chờ trạng thái) ở `services/estimate-result.logic.ts` và `api/design.bmt.ts`.
 */

const idempotent = (key: string = crypto.randomUUID()) => ({ headers: { 'Idempotency-Key': key } })

export interface GenerationStarted {
  operationId: string
  /** `Pending` khi vừa tiếp nhận. */
  state: string
  acceptedAtUtc: string
  deadlineUtc: string
}

export interface ResultFile {
  fileId: string
  /** `cover-image`, `floor-plan-2d`, `perspective`, `dossier-pdf`, `estimate-xlsx` (hợp đồng `mock-v1`). */
  roleKey: string
  ordinal: number
}

export interface ExportAvailability {
  format: string
  exportId?: string | null
  state?: string | null
  attemptNumber?: number | null
  failureCode?: string | null
}

/** `GET /estimates/{id}/result`. `dossier.content` theo hợp đồng AI nên giữ `unknown` rồi đọc phòng thủ. */
export interface EstimateResultRaw {
  operationId: string
  contractVersion: string
  estimateName: string
  dossier: { content?: unknown; files?: ResultFile[] }
  exportAvailability?: ExportAvailability[]
}

export interface ExportStatus {
  exportId: string
  format: string
  /** Pending, Ready, Failed… */
  state: string
  attemptNumber?: number
  failureCode?: string | null
  /** Route của backend (không phải URL tệp gốc). */
  downloadUrl?: string | null
}

export type ExportFormat = 'Pdf' | 'Xlsx'

export interface ShareLink {
  shareId: string
  url: string
  expiryDate?: string | null
  expiresAtUtc: string
  /** Active, Expired, Revoked. */
  state: string
  requestedExpiryApplied?: boolean
}

export const estimateGenerationApi = {
  /** `POST /estimates/{id}/generations` — giữ một lượt, khoá đầu vào. `key` cố định để bấm đúp không giữ hai lượt. */
  start: (estimateId: string, inputVersion: number, key?: string) =>
    http.post<GenerationStarted>(`/estimates/${estimateId}/generations`, { inputVersion }, idempotent(key)),

  getResult: (estimateId: string) => http.get<EstimateResultRaw>(`/estimates/${estimateId}/result`),

  /** Đường dẫn tệp kết quả (ảnh, bản vẽ, PDF, Excel) — BE chuyển tiếp nội dung, dùng được trong `<img src>`. */
  resultFileUrl: (estimateId: string, fileId: string) => `/api/v1/estimates/${estimateId}/result-files/${fileId}`,

  requestExport: (estimateId: string, format: ExportFormat, key?: string) =>
    http.post<{ exportId: string; state: string; attemptNumber: number }>(
      `/estimates/${estimateId}/exports`,
      { format },
      idempotent(key)
    ),

  getExport: (estimateId: string, exportId: string) =>
    http.get<ExportStatus>(`/estimates/${estimateId}/exports/${exportId}`),

  exportFileUrl: (estimateId: string, exportId: string) => `/api/v1/estimates/${estimateId}/exports/${exportId}/file`,

  createShare: (estimateId: string, expiryDate: string) =>
    http.post<ShareLink>(`/estimates/${estimateId}/shares`, { expiryDate }, idempotent()),

  getCurrentShare: (estimateId: string) => http.get<ShareLink | null>(`/estimates/${estimateId}/shares/current`),

  revokeShare: (estimateId: string, shareId: string) =>
    http.post<{ state: string }>(`/estimates/${estimateId}/shares/${shareId}/revoke`, {}, idempotent()),

  /** Xem hồ sơ qua link chia sẻ — công khai, gửi token ở header `X-Estimate-Share-Token`. */
  getShared: (shareId: string, token: string) =>
    http.get<{
      shareId: string
      estimateName: string
      dossier: { content?: unknown; files?: ResultFile[] }
      exportAvailability?: ExportAvailability[]
    }>(`/public/estimate-shares/${shareId}`, { headers: { 'X-Estimate-Share-Token': token } }),

  shareQrUrl: (estimateId: string, shareId: string) => `/api/v1/estimates/${estimateId}/shares/${shareId}/qr`,

  emailShare: (estimateId: string, shareId: string, recipient: string) =>
    http.post<{ emailRequestId: string; state: string }>(
      `/estimates/${estimateId}/shares/${shareId}/emails`,
      { recipient },
      idempotent()
    )
}
