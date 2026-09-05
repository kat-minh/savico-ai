import type { PlanVariant } from '@/shared/components/common'

/**
 * Kiểu dữ liệu của KHO NỘI DUNG (CMS).
 *
 * Đây là những gì admin biên soạn trong trang quản trị và người dùng cuối đọc
 * trên site (mục VI: "dữ liệu tĩnh do admin biên soạn"; mục X liệt kê từng danh
 * mục admin cấu hình được). Types nằm ở `shared/` vì CẢ HAI phía đều cần:
 * `features/admin` ghi, `features/handbook|guide|plans|consultation|landing` đọc —
 * mà hai feature thì không được import lẫn nhau (xem docs/ARCHITECTURE.md §2).
 *
 * Các feature công khai re-export lại type của mình từ đây nên barrel của chúng
 * không đổi: `import type { HandbookTemplate } from '@/features/handbook'` vẫn chạy.
 */

/* ===========================================================================
 * Cẩm nang — mục VI
 * ======================================================================== */

/**
 * Tag set gắn trên mỗi mẫu / bài viết trong cẩm nang (mục VI).
 * Cùng vocabulary với các trường Bước 1 nhưng khai báo độc lập.
 */
export interface HandbookTags {
  buildingType?: string
  floorCount?: string
  hasAttic?: boolean
  architectureStyle?: string
  interiorStyle?: string
}

/**
 * Hai loại nội dung của thư viện mẫu (Phần 2):
 * `2d` — mẫu bản vẽ mặt bằng, người dùng tìm CÔNG NĂNG;
 * `3d` — mẫu nội thất phối cảnh, người dùng tìm CẢM HỨNG THẨM MỸ.
 */
export type HandbookTemplateKind = '2d' | '3d'

/**
 * Một tầng trong bộ ảnh của mẫu — nút chuyển tầng và dải ảnh xem trước đều
 * chạy trên mảng này (Hình 2, Hình 7, Hình 8).
 */
export interface HandbookFloor {
  id: string
  /** Nhãn nút chuyển tầng: "Tầng trệt", "Tầng 2", "Tum", "Mặt mái". */
  label: string
  /** Ảnh thật của tầng. Mẫu 3D luôn có; mẫu 2D bỏ trống cho tới khi admin tải bản vẽ lên. */
  imageUrl?: string
  /** Khi chưa có ảnh: dựng bản vẽ SVG theo preset này (mẫu 2D). */
  planVariant?: PlanVariant
}

/** Dòng thông số hiện dưới tên mẫu trên thẻ và trong khung "Thông tin bản vẽ". */
export interface HandbookTemplateSpecs {
  buildingTypeLabel: string
  /** "2 tầng", "2 tầng + tum" — nhãn quy mô đã gộp sẵn thông tin tum. */
  floorLabel: string
  /** Kích thước lô, ví dụ "5 × 20 m" (chỉ mẫu 2D). */
  lotSize?: string
  /** Diện tích sàn, ví dụ "100 m²" (chỉ mẫu 2D). */
  floorArea?: string
  /** Số ảnh 3D có trong bộ (chỉ mẫu 3D). */
  imageCount?: number
}

/** Một mẫu trong thư viện — dùng chung cho lưới, popup xem nhanh và trang chi tiết. */
export interface HandbookTemplate {
  id: string
  name: string
  kind: HandbookTemplateKind
  /** Ảnh bìa trên thẻ lưới. Bỏ trống thì thẻ vẽ bản vẽ SVG của tầng đầu tiên. */
  imageUrl?: string
  /** Nhãn tag chính: phong cách (mẫu 3D) hoặc loại công trình (mẫu 2D). */
  styleLabel: string
  specs: HandbookTemplateSpecs
  /**
   * Mô tả bố trí công năng từng tầng (mẫu 2D) hoặc vật liệu / tông màu / cảm
   * giác không gian (mẫu 3D) — mỗi phần tử một đoạn.
   */
  description: string[]
  floors: HandbookFloor[]
  tags: HandbookTags
}

/** Ba giai đoạn xây nhà — khung cố định của cẩm nang nền tảng (Phần 3). */
export type HandbookStageId = 'structure' | 'finishing' | 'interior'

/** Một chủ đề trong giai đoạn, ví dụ "Móng", "Cọc - ép cọc". */
export interface HandbookTopic {
  id: string
  stage: HandbookStageId
  title: string
}

export interface HandbookStage {
  id: HandbookStageId
  /** Số thứ tự hiển thị trên thẻ ("Bước 1"). */
  order: number
  title: string
  description: string
  imageUrl: string
  topics: HandbookTopic[]
}

/** Chuyên mục của bài viết — bộ lọc ở khối "Tất cả bài viết" (Hình 11). */
export type HandbookCategory = 'experience' | 'material' | 'interior' | 'legal'

/** Một mục trong thân bài: tiêu đề đánh số + các đoạn văn, có thể kèm ảnh. */
export interface HandbookArticleSection {
  heading?: string
  paragraphs: string[]
  imageUrl?: string
}

export interface HandbookArticle {
  id: string
  /** Dùng làm đường dẫn: `/handbook/bai-viet/{slug}`. */
  slug: string
  title: string
  excerpt: string
  imageUrl: string
  category: HandbookCategory
  /**
   * Vị trí trong cẩm nang nền tảng. Bỏ trống nghĩa là bài tin tức thuần — chỉ
   * xuất hiện ở Bản tin và danh sách bài viết, không nằm trong cây giai đoạn.
   */
  stage?: HandbookStageId
  topicId?: string
  /** ISO date — "ngày cập nhật" trên trang bài viết. */
  publishedAt: string
  readingMinutes: number
  /** Thứ tự trong Bản tin: 1 = bài nổi bật lớn, 2–4 = ba bài phụ (Hình 11). */
  featuredRank?: number
  body: HandbookArticleSection[]
  tags: HandbookTags
  /** Bài tư vấn trong panel màn chờ: kiến trúc (Bước 2) / nội thất (Bước 3). */
  panelTopic?: 'architecture' | 'interior'
}

/* ===========================================================================
 * Hướng dẫn — mục VI (video ngắn 20–60s)
 * ======================================================================== */

/** Các thao tác chính mà video hướng dẫn bám theo, sắp theo bước (mục II.4). */
export type GuideTopic = 'land-photo' | 'input' | 'read-estimate' | 'dossier' | 'share'

/** Video hướng dẫn ngắn 20–60 giây cho từng thao tác chính. */
export interface GuideVideo {
  id: string
  topic: GuideTopic
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  /** Thời lượng tính bằng giây. */
  durationSeconds: number
  /**
   * Video nổi bật hiện lớn ở đầu trang Hướng dẫn (mục VI). Admin chọn video nào
   * là nổi bật (mục X, #3); chỉ MỘT video mang cờ này.
   */
  featured?: boolean
}

/** Bài hướng dẫn dạng chữ kèm ảnh. */
export interface GuideArticle {
  id: string
  topic: GuideTopic
  title: string
  excerpt: string
  imageUrl: string
}

/* ===========================================================================
 * Gói đăng ký — mục VII
 * ======================================================================== */

/**
 * Mã gói đăng ký (mục VII).
 *
 * Nhãn hiển thị (BASIC / PLUS / PRO theo S01) nằm ở `messages/*.json`, không
 * phải ở đây: đổi tên thương mại là việc của nội dung, đổi mã gói là việc của dữ
 * liệu — gộp hai thứ lại thì mỗi lần marketing đổi tên gói là phải chạy migration.
 */
export type PlanTier = 'basic' | 'advanced' | 'pro'

/**
 * Khối "Quà tặng đặc biệt" của gói cao nhất (S01 thẻ PRO, S02 popup).
 * Vắng mặt ở các gói khác — không phải gói nào cũng có quà.
 */
export interface PlanGift {
  /** "Bộ thiết bị vệ sinh châu Âu". */
  title: string
  /** Giá trị quy đổi, VND — hiển thị "trị giá 100 triệu đồng". */
  value: number
  /** Khối "+ Ưu đãi thêm": phí gói được khấu trừ vào giá trị hợp đồng thi công. */
  extraTitle: string
  extraBody: string
  /** Dòng điều kiện áp dụng ở đáy popup. */
  conditions: string
}

/** Một gói đăng ký hiển thị trên trang Gói đăng ký (mục VII, Hình 13). */
export interface SubscriptionPlan {
  /** Khóa CRUD của admin; trùng `tier` với ba gói gốc. */
  id: string
  tier: PlanTier
  /** Giá cho một chu kỳ, đơn vị VND. */
  price: number
  /** Số ngày hiệu lực của gói. */
  periodDays: number
  /** Số lượt thiết kế - dự toán trong kỳ. */
  designCredits: number
  /** Số lượt tra thư viện mẫu trong kỳ. */
  libraryCredits: number
  /**
   * Quyền lợi thêm ngoài hai hạn mức trên — một dòng, do admin soạn
   * (mục X, #4). Ví dụ "Ưu tiên hàng đợi render".
   */
  perk: string
  /** Dòng "Phù hợp: ..." dưới danh sách quyền lợi. */
  audience: string
  /** Thẻ nổi bật giữa trang, gắn badge "Phổ biến". */
  popular?: boolean
  /** Câu "Phù hợp khi bạn..." ngay dưới ảnh thẻ gói (S01). */
  fitLine?: string
  /** Danh sách tính năng in trên thẻ gói (S01). */
  features?: string[]
  /** Ảnh minh họa trên đầu thẻ gói (S01). */
  imageUrl?: string
  /** Quà tặng kèm — chỉ gói cao nhất có (S01, S02). */
  gift?: PlanGift
}

/* ===========================================================================
 * Gói giám sát thi công — S19
 * ======================================================================== */

/** Ba lựa chọn quản lý thi công (S19). */
export type SupervisionTier = 'self' | 'check' | 'control'

/**
 * Một lựa chọn trên trang Gói giám sát thi công (S19).
 *
 * `self` là gói 0đ (khách tự theo dõi) nên vẫn nằm chung bảng: nó là một lựa
 * chọn thật trong luồng "Chọn cách quản lý thi công" (R8), không phải chỗ trống.
 */
export interface SupervisionPackage {
  id: string
  tier: SupervisionTier
  /** Giá cho MỘT dự án, đơn vị VND. Gói tự quản lý là 0. */
  price: number
  /** Thời hạn áp dụng, tính theo tháng; hết hạn thì gia hạn qua add-on. */
  durationMonths: number
  /** Số lượt kỹ sư kiểm tra thực tế trong gói; `null` với gói tự quản lý. */
  inspections: number | null
  /** Câu "Phù hợp khi bạn..." trên thẻ. */
  fitLine: string
  /** Các dòng lợi ích in trên thẻ. */
  benefits: string[]
  /** Thẻ được khuyến nghị — gắn badge trên đầu thẻ. */
  recommended?: boolean
  imageUrl?: string
}

/* ===========================================================================
 * Tư vấn 1:1 — mục VIII
 * ======================================================================== */

/**
 * Chuyên môn của kiến trúc sư — danh mục do admin cấu hình (mục X, #5).
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

/* ===========================================================================
 * Vận hành — dữ liệu admin theo dõi, không phải nội dung site
 * ======================================================================== */

export type CmsBookingStatus = 'pending' | 'confirmed' | 'done' | 'cancelled'

/**
 * Lịch hẹn tư vấn. Khách đặt ở màn Tư vấn 1:1 (mục VIII.3), admin xác nhận /
 * hủy tại trang quản trị — spec ghi rõ SAVICO gọi lại trong 24h làm việc.
 */
export interface CmsBooking {
  id: string
  consultantId: string
  consultantName: string
  customerName: string
  phone: string
  /** ISO date `yyyy-mm-dd`. */
  date: string
  /** Giờ bắt đầu 24h, ví dụ "09:00". */
  time: string
  note?: string
  status: CmsBookingStatus
  createdAt: string
}

export type CmsCustomerStatus = 'active' | 'suspended'

/** Một tài khoản người dùng trong trang Người dùng của admin. */
export interface CmsCustomer {
  id: string
  name: string
  email: string
  phone?: string
  /** Vai trò khớp `shared/auth` ROLES. */
  role: 'customer' | 'admin'
  /** Gói đang dùng; `null` = chưa mua gói, đang dùng lượt miễn phí. */
  planTier: PlanTier | null
  /** Ngày hết hạn gói (ISO), bỏ trống khi chưa mua gói. */
  planExpiresAt?: string
  /** Lượt thiết kế - dự toán còn lại trong kỳ. */
  designCreditsLeft: number
  /** Lượt tra thư viện mẫu còn lại trong kỳ. */
  libraryCreditsLeft: number
  status: CmsCustomerStatus
  createdAt: string
}

export type CmsProjectStatus = 'input' | 'designing' | 'review' | 'completed'

/** Dự án khách hàng — admin theo dõi tiến độ render / duyệt hồ sơ. */
export interface CmsDesignProject {
  /** Mã dự án `SVC-YYYY-NNNN`. */
  id: string
  name: string
  customerName: string
  customerEmail: string
  address: string
  buildingTypeLabel: string
  styleLabel: string
  /** Bước đang dừng: 1 Nhập liệu · 2 Dự toán · 3 Hồ sơ. */
  currentStep: 1 | 2 | 3
  status: CmsProjectStatus
  /** Tổng dự toán, VND. `null` khi chưa chạy Bước 2. */
  estimateTotal: number | null
  createdAt: string
  updatedAt: string
}

/* ===========================================================================
 * Danh mục cấu hình — mục X, #6
 * ======================================================================== */

/** Loại công trình của Bước 1 (Phụ lục A, trường 3). */
export interface CmsBuildingTypeOption {
  id: string
  label: string
  /** Ẩn khỏi Bước 1 mà không phải xóa. */
  enabled: boolean
  order: number
}

/**
 * Kiểu kiến trúc & phong cách (Phụ lục A, trường 7) — danh mục hiển thị đổi
 * theo loại công trình, admin cấu hình (mục X, #6).
 */
export interface CmsStyleOption {
  id: string
  label: string
  imageUrl: string
  /** Id các loại công trình mà phong cách này xuất hiện. */
  buildingTypeIds: string[]
  enabled: boolean
  order: number
}

/** Hệ số / đơn giá dùng cho công thức dự toán (mục III.3). */
export interface CmsUnitPrice {
  id: string
  /** `structure` | `finishing` | `interior` — ba phần chi phí. */
  section: 'structure' | 'finishing' | 'interior'
  label: string
  unit: string
  /** Đơn giá theo gói Cơ bản, VND. */
  basic: number
  /** Gói Tiêu chuẩn, VND. */
  standard: number
  /** Gói VIP, VND. */
  vip: number
}

/* ===========================================================================
 * Tài liệu (singleton) — mỗi thứ chỉ có MỘT bản
 * ======================================================================== */

/** Một điểm cam kết dưới CTA hero (mục II.2). */
export interface CmsHomePromise {
  id: string
  title: string
  hint: string
}

/** Một bước trong dải "3 bước" dưới hero (mục II.2). */
export interface CmsHomeStep {
  id: string
  title: string
  description: string
}

/**
 * Nội dung trang chủ admin sửa được (mục II.2). Bỏ trống một trường thì giao
 * diện quay về chuỗi trong `messages/*.json` — CMS chỉ GHI ĐÈ, không thay thế
 * hệ i18n, nên site vẫn chạy khi kho nội dung rỗng.
 */
export interface CmsHomeContent {
  heroTitleLead: string
  heroTitleAccent: string
  heroSubtitle: string
  heroPrimaryCta: string
  heroSecondaryCta: string
  promises: CmsHomePromise[]
  steps: CmsHomeStep[]
}

/** Một mục đánh số của trang tĩnh (Điều khoản, Bảo mật). */
export interface CmsStaticSection {
  heading: string
  body: string
}

/**
 * Trang nội dung tĩnh — chân trang mục II.2: Điều khoản sử dụng, Chính sách bảo
 * mật. Bên A cung cấp nội dung chính thức trước go-live (Q&A §8.2) nên đây là
 * thứ admin phải sửa được ngay, không chờ deploy.
 */
export interface CmsStaticPage {
  title: string
  /** Dòng ghi chú cập nhật hiển thị dưới tiêu đề. */
  updatedNote: string
  /** Đoạn mở đầu. */
  intro: string
  sections: CmsStaticSection[]
}

/**
 * HẠN MỨC dùng thử & hạn mức theo ngày — mọi con số không gắn với gói trả tiền.
 *
 * Trước đây ba nhóm số này nằm rải rác và cứng trong code: hạn mức chat ở
 * `features/chatbot/constants`, hạn mức tra Cẩm nang ở `handbook.mock`, còn lượt
 * cho người chưa mua gói thì không tồn tại ở đâu — muốn đổi phải sửa code rồi
 * deploy. Gom về một tài liệu để vận hành tự chỉnh.
 *
 * Hạn mức của các gói TRẢ TIỀN vẫn nằm trong bảng `plans` (mỗi gói một dòng);
 * đây chỉ là phần miễn phí và phần tính theo ngày.
 *
 * Không có bản dịch riêng — con số thì ngôn ngữ nào cũng như nhau.
 */
export interface CmsQuotas {
  /** Lượt thiết kế - dự toán cho tài khoản CHƯA mua gói. */
  freeDesignCredits: number
  /** Lượt tra thư viện mẫu cho tài khoản chưa mua gói. */
  freeLibraryCredits: number
  /** Tin nhắn AI mỗi ngày — khách vãng lai chưa đăng nhập (Q&A §2.3.5). */
  chatDailyGuest: number
  /** Tin nhắn AI mỗi ngày — tài khoản đã đăng nhập. */
  chatDailyCustomer: number
  /** Lượt TRA thư viện mẫu mỗi ngày (mục VI). */
  handbookLookupPerDay: number
  /** Lượt XEM CHI TIẾT một mẫu mỗi ngày. */
  handbookDetailPerDay: number
}

/* ===========================================================================
 * Ghi đè chữ & ảnh của giao diện — phủ nốt phần site không nằm trong các bảng
 * nội dung ở trên (tiêu đề trang, nhãn nút, chữ trạng thái rỗng, ảnh minh họa).
 * ======================================================================== */

/**
 * Chữ giao diện admin soạn lại: KHÓA DỊCH PHẲNG → chữ mới.
 *
 * Chỉ chứa những khóa admin ĐÃ sửa; khóa vắng mặt thì site dùng nguyên bản trong
 * `messages/{locale}.json`. Nhờ vậy CMS chỉ GHI ĐÈ chứ không nhân bản toàn bộ
 * catalog dịch — thêm chuỗi mới trong code vẫn chạy ngay, không cần đụng kho.
 *
 * Tài liệu này lưu theo ngôn ngữ như mọi tài liệu khác, nên bản tiếng Việt và
 * tiếng Anh sửa độc lập.
 */
export type CmsUiStrings = Record<string, string>

/**
 * Ảnh minh họa admin thay: KHÓA TRONG SỔ ẢNH (`shared/lib/imagery`) → URL mới.
 *
 * Cùng nguyên tắc với {@link CmsUiStrings}: khóa vắng mặt thì dùng ảnh seed.
 * Ảnh nằm TRONG các bảng nội dung (mẫu, bài viết, KTS, phong cách) đã sửa được
 * ngay trên bảng của chúng — ở đây chỉ là các ảnh dùng chung của giao diện.
 */
export type CmsUiAssets = Record<string, string>

/** Thông tin liên hệ + mạng xã hội + pháp lý ở footer (mục II.2). */
export interface CmsSiteSettings {
  brandName: string
  tagline: string
  hotline: string
  email: string
  address: string
  zaloUrl: string
  messengerUrl: string
  facebookUrl: string
  youtubeUrl: string
  tiktokUrl: string
  companyName: string
  taxCode: string
  /** Thẻ meta mặc định. */
  seoTitle: string
  seoDescription: string
  /** Tắt toàn site để bảo trì — banner cảnh báo, không chặn truy cập. */
  maintenanceNotice: string
}

/* ===========================================================================
 * Vận hành mở rộng — subscription, giao dịch, đổi lịch, gói tư vấn, review,
 * báo cáo. Toàn bộ là dữ liệu backend sinh / khách gửi; admin theo dõi và đổi
 * trạng thái, không sáng tác hộ.
 * ======================================================================== */

export type CmsSubscriptionStatus = 'active' | 'cancelled' | 'expired'

/** Một kỳ đăng ký gói của một người dùng. */
export interface CmsSubscription {
  id: string
  customerName: string
  customerEmail: string
  tier: PlanTier
  /** ISO date — ngày bắt đầu kỳ. */
  startedAt: string
  /** ISO date — ngày hết hạn kỳ. */
  expiresAt: string
  status: CmsSubscriptionStatus
  /** Ghi chú vận hành: lý do hủy, lần gia hạn thủ công… */
  note?: string
}

export type CmsTransactionStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type CmsTransactionMethod = 'bank-qr' | 'card' | 'manual'

/** Một giao dịch thanh toán trong hệ thống. */
export interface CmsTransaction {
  /** Mã giao dịch `TXN-...`. */
  id: string
  customerName: string
  customerEmail: string
  /** Gói được mua / gia hạn. */
  tier: PlanTier
  /** Số tiền, VND. */
  amount: number
  method: CmsTransactionMethod
  status: CmsTransactionStatus
  /** ISO datetime. */
  createdAt: string
  note?: string
}

export type CmsRescheduleStatus = 'pending' | 'approved' | 'rejected'

/** Yêu cầu đổi lịch tư vấn — khách gửi, admin duyệt hoặc từ chối. */
export interface CmsRescheduleRequest {
  id: string
  /** Mã lịch hẹn gốc (`BOOK-...`). */
  bookingId: string
  customerName: string
  consultantName: string
  /** Khung giờ cũ. */
  fromDate: string
  fromTime: string
  /** Khung giờ khách muốn chuyển sang. */
  toDate: string
  toTime: string
  reason?: string
  status: CmsRescheduleStatus
  createdAt: string
}

/** Gói tư vấn 1:1 bán kèm (số buổi, thời lượng, giá). */
export interface CmsConsultPackage {
  id: string
  name: string
  /** Số buổi tư vấn trong gói. */
  sessions: number
  /** Thời lượng một buổi, phút. */
  durationMinutes: number
  /** Giá gói, VND. 0 = miễn phí. */
  price: number
  description: string
  enabled: boolean
}

export type CmsReviewStatus = 'pending' | 'approved' | 'rejected'

/** Review của khách về một gói tư vấn — duyệt xong mới hiện công khai. */
export interface CmsPackageReview {
  id: string
  packageName: string
  customerName: string
  /** 1–5 sao. */
  rating: number
  content: string
  status: CmsReviewStatus
  createdAt: string
}

export type CmsReportStatus = 'open' | 'resolved' | 'dismissed'

/** Báo cáo vi phạm do người dùng gửi (review sai sự thật, nội dung xấu…). */
export interface CmsReport {
  id: string
  reporterName: string
  /** Đối tượng bị báo cáo. */
  targetType: 'review' | 'consultant' | 'content'
  /** Mô tả ngắn đối tượng, ví dụ tên review / tên KTS. */
  targetLabel: string
  reason: string
  status: CmsReportStatus
  createdAt: string
}
