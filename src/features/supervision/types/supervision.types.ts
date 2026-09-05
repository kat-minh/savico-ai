/**
 * Kiểu dữ liệu của GÓI GIÁM SÁT THI CÔNG (S19–S24).
 *
 * R5 là xương sống: 6 giai đoạn CỐ ĐỊNH; Giám sát xác nhận thì hồ sơ khóa; sau
 * khi khóa chỉ đổi qua Yêu cầu sửa đổi được bên kia duyệt; nhà thầu chỉ xem.
 * R9: hoàn thành giai đoạn = khách tải ảnh/tài liệu kèm tên — KHÔNG có checklist
 * bắt buộc, nên không type nào ở đây có `checklist`.
 */

/** 6 giai đoạn cố định (R5). Thứ tự mảng cũng là thứ tự thi công. */
export type StageKey = 'legal' | 'foundation' | 'structure' | 'mep' | 'finishing' | 'handover'

/** Trạng thái một giai đoạn — quyết định luôn màn S20 / S21 / S22 / S23. */
export type StageStatus = 'confirmed' | 'inProgress' | 'upcoming'

/** Vai trò trong lịch sử và trên nhãn tệp. */
export type Actor = 'GS' | 'KH' | 'SYS'

/** Phiên bản hồ sơ giai đoạn. Khóa ở v1, duyệt sửa đổi thì lên v2, v3... */
export type StageVersion = string

/** Một tệp trong khối "Ảnh & tài liệu" của giai đoạn. */
export interface StageFile {
  id: string
  name: string
  kind: 'photo' | 'document'
  /** Ai tải lên — nhãn KH / GS trên góc ảnh. */
  by: Actor
  /** Thời gian chụp lấy từ EXIF; tài liệu thì trống. */
  capturedAt?: string
  uploadedAt: string
  /** Ảnh do Giám sát chụp khi kiểm tra hiện trường. */
  fromInspection?: boolean
  /** Ảnh được thêm ở phiên bản nào — hiện nhãn "thêm ở v2". */
  addedInVersion?: StageVersion
}

/** Một nhận xét trong khối "Nhận xét & trao đổi". */
export interface StageComment {
  id: string
  author: string
  role: Actor
  at: string
  text: string
  /** Nhận xét gắn với một yêu cầu sửa đổi. */
  changeRequestId?: string
}

/** Kết quả kiểm tra thực tế của Giám sát — có thì giai đoạn mới khóa được. */
export interface StageInspection {
  confirmedAt: string
  engineer: string
  /** Kỹ sư có tới công trình hay chỉ xét hồ sơ. */
  onSite: boolean
  note: string
}

/** Trạng thái một yêu cầu sửa đổi (CR). */
export type ChangeRequestStatus = 'pending' | 'applied' | 'rejected'

/**
 * Yêu cầu sửa đổi hồ sơ đã khóa.
 *
 * `by` quyết định AI DUYỆT: Giám sát đề xuất thì khách duyệt (S22), khách đề
 * xuất thì Giám sát duyệt (S23). Không có đường nào tự sửa hồ sơ đã khóa.
 */
export interface ChangeRequest {
  /** Mã hiển thị `CR-01`. */
  id: string
  by: Actor
  proposedAt: string
  status: ChangeRequestStatus
  /** Hạn bên kia phải trả lời (chỉ CR đang chờ). */
  dueAt?: string
  reason: string
  /** Phản hồi của bên duyệt. */
  response?: string
  /** Phiên bản sinh ra khi CR được duyệt. */
  resultVersion?: StageVersion
}

/** Một sự kiện trong "Lịch sử & phiên bản" — không bao giờ bị xóa (R5). */
export interface StageEvent {
  id: string
  at: string
  actor: Actor
  text: string
  /** Sự kiện mốc (hoàn thành, xác nhận, duyệt CR) — tô đậm trên dòng thời gian. */
  milestone?: boolean
}

/** Một giai đoạn trong bảng điều khiển. */
export interface SupervisionStage {
  key: StageKey
  /** 1..6 — hiện trong "Giai đoạn 4/6". */
  index: number
  plannedStart: string
  plannedEnd: string
  actualStart?: string
  actualEnd?: string
  status: StageStatus
  version: StageVersion
  files: StageFile[]
  comments: StageComment[]
  inspection?: StageInspection
  changeRequests: ChangeRequest[]
  history: StageEvent[]
  /** Gợi ý chuẩn bị cho giai đoạn sắp tới (S21) — admin sửa được. */
  prepHint?: string
}

/** Toàn bộ dữ liệu một dự án đang được giám sát. */
export interface SupervisionProject {
  projectId: string
  projectName: string
  /** Gói đang dùng: `check` hoặc `control`. */
  packageTier: 'check' | 'control'
  /** Mã gói hiển thị trên thẻ dự án, ví dụ `SVG-2026-0001-AT`. */
  packageCode: string
  engineer: string
  /** Ngày kích hoạt gói — mốc tính lịch chuẩn. */
  activatedAt: string
  /** Hạn sử dụng gói (ISO) — hết hạn thì gia hạn qua add-on. */
  expiresAt: string
  /** Ngày bàn giao dự kiến, cập nhật theo tiến độ thực tế. */
  handoverDate: string
  /** Ngày bàn giao theo kế hoạch ban đầu — để nói "sớm/chậm hơn kế hoạch". */
  plannedHandoverDate: string
  inspectionsUsed: number
  inspectionsTotal: number
  stages: SupervisionStage[]
}

/** Dữ liệu tải hồ sơ hoàn thành một giai đoạn (S20). */
export interface StageUploadPayload {
  stageKey: StageKey
  kind: 'photo' | 'document'
  name: string
  files: { name: string; sizeBytes: number }[]
}
