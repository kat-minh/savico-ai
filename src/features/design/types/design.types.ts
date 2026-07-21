/** Loại công trình — quyết định các trường hiển thị phía sau (mục III.2, trường 3). */
export type BuildingType = 'house' | 'townhouse' | 'apartment'

/** Quy mô — số tầng (mục III.2, trường 4). Căn hộ bị khóa 1 mặt sàn. */
export type FloorCount = 'ground' | 'ground+1' | 'ground+2' | 'ground+3' | 'ground+4'

/** Gói hoàn thiện & nội thất — slider 3 nấc (mục III.2, trường 6). */
export type PackageTier = 'basic' | 'standard' | 'vip'

/** Kiểu kiến trúc (mục III.2, trường 7) — ẩn với Căn hộ. */
export type ArchitectureStyle = 'roofed' | 'modern-townhouse' | 'neoclassical'

/**
 * Phong cách nội thất (mục III.2, trường 8) — danh mục do admin cấu hình.
 * Union of the seeded catalogue in `INTERIOR_STYLES`; see that constant.
 */
export type InteriorStyle = 'modern' | 'minimal' | 'neoclassical' | 'indochine'

/** Ba bước của luồng Thiết kế & Dự toán (stepper, mục III). */
export type DesignStep = 1 | 2 | 3

/** Ba phần chi phí trong bảng dự toán (mục III.3b). */
export type CostSection = 'structure' | 'finishing' | 'interior'

/** Dự án do người dùng tạo ở modal Tạo dự án (mục III.1). */
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  /** Bước người dùng đang dừng lại — hiển thị trong "Dự án của tôi". */
  currentStep: DesignStep
  /** Ảnh lô đất đã tải ở Bước 1, dùng làm ảnh bìa thẻ dự án. */
  coverUrl?: string | null
}

/**
 * Các phần của địa chỉ công trình. Giữ riêng để khi mở lại bản nháp, ô gợi ý
 * tỉnh/phường vẫn chọn đúng thứ người dùng đã chọn — không phải đoán lại từ
 * chuỗi đã ghép.
 */
export interface AddressDetail {
  street: string
  wardCode: number | null
  wardName: string
  provinceCode: number | null
  provinceName: string
}

/** Toàn bộ dữ liệu Bước 1 — Nhập liệu (mục III.2). */
export interface DesignInput {
  /** Ảnh lô đất (Căn hộ: ảnh mặt bằng căn hộ hiện trạng). Bắt buộc. */
  landPhotoUrl: string | null
  /** Địa chỉ đã ghép, gửi lên API — dùng để áp đơn giá theo khu vực. Bắt buộc. */
  address: string
  /** Các phần rời của địa chỉ, phục vụ hiển thị lại trên giao diện. */
  addressDetail: AddressDetail
  buildingType: BuildingType | null
  /** Nhà ở / Nhà phố only. */
  floorCount: FloorCount | null
  /** Nhà ở / Nhà phố only. */
  hasAttic: boolean | null
  packageTier: PackageTier
  /** Nhà ở / Nhà phố only. */
  architectureStyle: ArchitectureStyle | null
  interiorStyle: InteriorStyle | null
  /** Tùy chọn, tối đa 500 ký tự. */
  wishes: string
}

/**
 * Hạng mục con — chỉ xuất hiện trong file Excel, không liệt kê trên màn hình
 * (mục III.3b, khối 1). Cấu trúc theo Phụ lục 02.
 */
export interface EstimateSubItem {
  id: string
  /** Localized label resolved by the API/mock, not a translation key. */
  label: string
  /** Đơn vị tính đã bản địa hóa ("m²", "bộ", "hệ"...). */
  unit: string
  quantity: number
  unitPrice: number
  /** `quantity × unitPrice`, do API tính sẵn để bảng Excel không lệch làm tròn. */
  amount: number
}

/** Một hạng mục lớn trong bảng dự toán (không liệt kê chi tiết trên màn hình). */
export interface EstimateLineItem {
  id: string
  /** Localized label resolved by the API/mock, not a translation key. */
  label: string
  amount: number
  /** Hạng mục con gộp thành `amount`; nguồn dữ liệu cho file Excel. */
  children: EstimateSubItem[]
}

export interface EstimateSection {
  section: CostSection
  items: EstimateLineItem[]
  total: number
}

/** Kết quả Bước 2 (mục III.3b). */
export interface EstimateResult {
  projectId: string
  sections: EstimateSection[]
  /** Tổng cả 3 phần — luôn hiển thị, nổi bật. */
  grandTotal: number
  /** Đoạn văn tư vấn cá nhân hóa, đã điền biến theo dự án. */
  advisory: string
  /** Diện tích sàn do AI ước tính (m²). */
  estimatedFloorArea: number
  xlsxUrl: string
}

/** Trạng thái màn hình Bước 3 (mục III.4). */
export type DossierStatus = 'idle' | 'rendering' | 'ready'

/** Bộ hồ sơ thi công sau khi render xong (mục III.4c). */
export interface Dossier {
  projectId: string
  status: DossierStatus
  pdfUrl: string | null
  /** Bytes — hiển thị dung lượng cạnh nút Tải hồ sơ PDF. */
  pdfSize: number | null
  shareToken: string | null
}

/**
 * Bản hồ sơ rút gọn cho người xem qua link chia sẻ — không đăng nhập, chỉ đọc
 * (mục III.4c). Không kèm số điện thoại hay thông tin cá nhân khác.
 */
export interface SharedDossier {
  projectName: string
  address: string
  createdAt: string
  sections: EstimateSection[]
  grandTotal: number
  estimatedFloorArea: number
}

/** Tiến độ dùng chung cho màn chờ Bước 2 và màn chờ render Bước 3. */
export interface GenerationProgress {
  /** 0–100. */
  percent: number
  /** Localized status line ("đang đọc bản vẽ", "đang tính chi phí"...). */
  stage: string
  done: boolean
}
