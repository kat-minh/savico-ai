/**
 * Upload ảnh dùng chung (MEDIA — STORY-MEDIA-001, BR-MEDIA-001, TDD-MEDIA-001).
 *
 * Ảnh KHÔNG đi qua API BMT: backend chỉ cấp URL ký, trình duyệt PUT thẳng bytes
 * lên kho BizFly, rồi backend tải lại để xác minh. API nghiệp vụ sau đó nhận
 * URL dạng chuỗi (không có trường `mediaId`/`assetId` mới).
 */

/** Loại tệp — quyết định định dạng và dung lượng tối đa backend cho phép. */
export type MediaPurpose = 'ContractorImage' | 'ContractorScan'

/** Bước 1: chỗ để tải lên, kèm chữ ký có hạn 5 phút. */
export interface UploadTicket {
  uploadId: string
  state: string
  uploadMethod: string
  /** Null khi phát lại một phiếu đã hết hạn — phải tạo phiếu mới. */
  uploadUrl: string | null
  requiredHeaders: Record<string, string>
  uploadExpiresAtUtc: string
  maxSizeBytes: number
}

/** Bước 3: kết quả xác minh. Chỉ `Completed` mới có `fileUrl`. */
export interface UploadResult {
  uploadId: string
  state: 'Issued' | 'Validating' | 'Completed' | 'Rejected' | 'Expired'
  fileUrl?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  failureCode?: string | null
}

/** Ảnh đã xác minh, sẵn sàng gắn vào bản ghi nghiệp vụ. */
export interface UploadedImage {
  url: string
  contentType: string
  sizeBytes: number
}

/** Định dạng backend nhận (BR-MEDIA-001). Kiểm sớm ở client để khỏi tốn một lượt gọi tính tiền. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
