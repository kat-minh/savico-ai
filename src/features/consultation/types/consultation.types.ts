/**
 * Chuyên môn của kiến trúc sư — danh mục do admin cấu hình (mục X, #5).
 * Id ổn định để lọc; nhãn hiển thị do backend/mock trả kèm nên feature này
 * không cần biết vocabulary của Bước 1 (`features/design`).
 */
export interface ConsultantSpecialty {
  id: string
  label: string
}

/** Một ảnh trong dải "công trình tiêu biểu" của hồ sơ KTS (Hình 15). */
export interface ConsultantWork {
  imageUrl: string
  label: string
}

/**
 * Một kiến trúc sư trong trang Tư vấn 1:1 (mục VIII.1, Hình 14).
 * Cùng một object phục vụ cả thẻ lưới, danh sách thu gọn bên trái và hồ sơ
 * chi tiết — thẻ chỉ đọc phần nó cần.
 */
export interface Consultant {
  id: string
  /** Đã gồm tiền tố học hàm, ví dụ "KTS. Nguyễn Minh Trí". */
  name: string
  /** Chức danh dưới tên: "Kiến trúc sư SAVICO", "Kiến trúc sư trưởng SAVICO". */
  title: string
  avatarUrl: string
  /** Hai chip chuyên môn trên thẻ; phần tử đầu là chuyên môn chính. */
  specialties: ConsultantSpecialty[]
  yearsExperience: number
  /** Số công trình đã thực hiện — hiển thị dạng "{n}+ công trình". */
  projectCount: number
  /** Mô tả 1-2 dòng trên thẻ lưới. */
  headline: string
  /** Giới thiệu 2-3 dòng ở hồ sơ chi tiết, mỗi phần tử một dòng. */
  bio: string[]
  rating: number
  reviewCount: number
  /** 4 ảnh công trình tiêu biểu (Hình 15). */
  works: ConsultantWork[]
}

/** Hai hàng khung giờ của khối "CHỌN KHUNG GIỜ TƯ VẤN" (mục VIII.2). */
export type ConsultationSession = 'morning' | 'afternoon'

/**
 * Một khung giờ 30 phút. `full` = đã kín chỗ: hiện chữ "Kín", mờ, không bấm được.
 */
export interface ConsultationSlot {
  /** `{date}-{time}`, ví dụ `2026-08-04-09:00`. */
  id: string
  /** Giờ bắt đầu dạng 24h, ví dụ "09:00". */
  time: string
  session: ConsultationSession
  full: boolean
}

/** Một ngày trong dải 7 chip ngày (T2 → CN). */
export interface ConsultationDay {
  /** ISO date `yyyy-mm-dd` — khóa của chip ngày. */
  date: string
  slots: ConsultationSlot[]
}

export type ConsultationBookingStatus = 'pending' | 'confirmed' | 'cancelled'

/** Lịch hẹn đã đặt, trả về sau khi xác nhận ở modal (mục VIII.3). */
export interface ConsultationBooking {
  id: string
  consultantId: string
  consultantName: string
  date: string
  time: string
  phone: string
  note?: string
  /** `pending` cho tới khi SAVICO gọi xác nhận trong 24h làm việc. */
  status: ConsultationBookingStatus
  createdAt: string
}

/** Payload gửi lên khi bấm "Xác nhận đặt lịch". */
export interface BookConsultationPayload {
  consultantId: string
  date: string
  time: string
  /** SĐT đã chuẩn hóa (bỏ dấu phân cách) — KTS gọi lại qua số này. */
  phone: string
  note?: string
}
