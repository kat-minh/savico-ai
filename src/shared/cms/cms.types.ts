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
  /** Dòng điều kiện ĐẦY ĐỦ ở đáy popup S02. */
  conditions: string
  /** Bản rút gọn in trong khối quà ở thẻ gói (S01) — bản mô tả ghi hai câu khác nhau. */
  conditionsShort: string
  /**
   * Ảnh hộp quà / bộ sản phẩm — Hình S01 (khối quà thẻ PRO) và Hình S02 (popup).
   * Khách gửi file sau; còn trống thì hai chỗ đó dùng icon cùng khung, bố cục
   * không đổi khi ảnh về.
   */
  imageUrl?: string
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
  /** Ghi chú khách để lại khi đặt. */
  note?: string
  status: CmsBookingStatus
  createdAt: string
  /** Ghi chú nội bộ của vận hành — đã gọi ai, lý do hủy… Khách không thấy. */
  opsNote?: string
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
  /** Gói được mua / gia hạn — gói thiết kế hoặc gói giám sát. */
  tier: PlanTier | SupervisionTier
  /** Số tiền, VND. */
  amount: number
  method: CmsTransactionMethod
  /** Đơn hàng sinh ra giao dịch này (`SVC-YYNNN`), nếu có. */
  orderId?: string
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

/** Bốn nấc trạng thái của một lời mời báo giá (S18, R4). */
export type CmsInvitationStatus = 'sent' | 'received' | 'accepted' | 'done'

/** Một nấc đã đi qua trên thanh trạng thái lời mời. */
export interface CmsInvitationStep {
  status: CmsInvitationStatus
  at: string
}

/**
 * Trạng thái xử lý một lịch khảo sát — vận hành cập nhật sau khi đã gọi cho CẢ
 * khách lẫn nhà thầu (R3: buổi khảo sát diễn ra ngoài web).
 *
 * Bản ghi cũ không có trường này được coi là `requested`: khách vừa chọn giờ ở
 * S16, chưa ai gọi xác nhận.
 */
export type CmsSurveyStatus = 'requested' | 'confirmed' | 'rescheduled' | 'cancelled'

/** Lịch khảo sát khách chọn khi gửi lời mời (S16). */
export interface CmsSurveyBooking {
  contractorId: string
  /** ISO date `YYYY-MM-DD`. */
  date: string
  slotId: string
  note: string
  phone: string
  email: string
  /** Thiếu = `requested`. */
  status?: CmsSurveyStatus
  /** Lần vận hành đổi trạng thái gần nhất (ISO). */
  handledAt?: string
  /** Ghi chú nội bộ — lý do đổi lịch / hủy, đã gọi ai lúc nào. Khách không thấy. */
  opsNote?: string
}

/**
 * Một lời mời báo giá đã gửi (S17, S18).
 *
 * Nằm ở `shared/cms` chứ không ở `features/contractors` vì R4 giao việc đẩy bốn
 * nấc trạng thái cho ĐỘI VẬN HÀNH: màn admin phải ghi được, trang khách phải
 * đọc được, mà `features/admin` thì không được import `features/contractors`.
 * Để mỗi bên giữ một kho riêng thì admin sửa một nơi khách xem một nẻo.
 *
 * `contractorName` / `projectName` là dữ liệu lặp lại có chủ đích: bảng admin
 * cần tên để hiển thị và tìm kiếm, mà danh bạ nhà thầu nằm trong feature —
 * backend thật cũng trả kèm tên chứ không bắt admin join tay.
 *
 * R2/R3: không có trường tiền, không có "báo giá đã nhận" — sau khi nhà thầu
 * nhận lời mời, hai bên làm việc trực tiếp ngoài web.
 */
export interface CmsContractorInvitation {
  /** Mã lời mời `INV-YYYY-NNNN`. */
  id: string
  projectId: string
  projectName: string
  contractorId: string
  contractorName: string
  sentAt: string
  status: CmsInvitationStatus
  /** Lần cập nhật gần nhất, do đội hỗ trợ SAVICO thực hiện (R4). */
  updatedAt: string
  steps: CmsInvitationStep[]
  /** Phiên bản hồ sơ đã gửi kèm — "Hồ sơ v1 · 2 tệp". */
  dossierVersion: string
  fileCount: number
  survey: CmsSurveyBooking
}

/* ---------------------------------------------------------------------------
 * GIÁM SÁT THI CÔNG (S19–S24).
 *
 * Cả cây dữ liệu này nằm ở `shared/cms` chứ không ở `features/supervision` vì
 * R5 giao việc XÁC NHẬN GIAI ĐOẠN cho kỹ sư Giám sát của SAVICO: màn quản trị
 * phải ghi được kết quả kiểm tra mà bảng điều khiển của khách đang đọc, mà
 * `features/admin` thì không được import `features/supervision`.
 * ------------------------------------------------------------------------ */

/** 6 giai đoạn cố định (R5). Thứ tự mảng cũng là thứ tự thi công. */
export type CmsStageKey = 'legal' | 'foundation' | 'structure' | 'mep' | 'finishing' | 'handover'

/** Trạng thái một giai đoạn — quyết định luôn màn S20 / S21 / S22 / S23. */
export type CmsStageStatus = 'confirmed' | 'inProgress' | 'upcoming'

/** Vai trò trong lịch sử và trên nhãn tệp. */
export type CmsActor = 'GS' | 'KH' | 'SYS'

/** Phiên bản hồ sơ giai đoạn. Khóa ở v1, duyệt sửa đổi thì lên v2, v3... */
export type CmsStageVersion = string

/** Một tệp trong khối "Ảnh & tài liệu" của giai đoạn. */
export interface CmsStageFile {
  id: string
  name: string
  kind: 'photo' | 'document'
  /** Ai tải lên — nhãn KH / GS trên góc ảnh. */
  by: CmsActor
  /** Thời gian chụp lấy từ EXIF; tài liệu thì trống. */
  capturedAt?: string
  uploadedAt: string
  /** Ảnh do Giám sát chụp khi kiểm tra hiện trường. */
  fromInspection?: boolean
  /** Ảnh được thêm ở phiên bản nào — hiện nhãn "thêm ở v2". */
  addedInVersion?: CmsStageVersion
}

/** Một nhận xét trong khối "Nhận xét & trao đổi". */
export interface CmsStageComment {
  id: string
  author: string
  role: CmsActor
  at: string
  text: string
  /** Nhận xét gắn với một yêu cầu sửa đổi. */
  changeRequestId?: string
}

/** Kết quả kiểm tra thực tế của Giám sát — có thì giai đoạn mới khóa được. */
export interface CmsStageInspection {
  confirmedAt: string
  engineer: string
  /** Kỹ sư có tới công trình hay chỉ xét hồ sơ. */
  onSite: boolean
  note: string
}

/** Trạng thái một yêu cầu sửa đổi (CR). */
export type CmsChangeRequestStatus = 'pending' | 'applied' | 'rejected'

/**
 * Yêu cầu sửa đổi hồ sơ đã khóa.
 *
 * `by` quyết định AI DUYỆT: Giám sát đề xuất thì khách duyệt (S22), khách đề
 * xuất thì Giám sát duyệt (S23). Không có đường nào tự sửa hồ sơ đã khóa.
 */
export interface CmsChangeRequest {
  /** Mã hiển thị `CR-01`. */
  id: string
  by: CmsActor
  proposedAt: string
  status: CmsChangeRequestStatus
  /** Hạn bên kia phải trả lời (chỉ CR đang chờ). */
  dueAt?: string
  /** Thời điểm bên kia duyệt / từ chối — mốc của phiên bản hồ sơ sinh ra. */
  decidedAt?: string
  reason: string
  /** Phản hồi của bên duyệt. */
  response?: string
  /** Phiên bản sinh ra khi CR được duyệt. */
  resultVersion?: CmsStageVersion
}

/** Một sự kiện trong "Lịch sử & phiên bản" — không bao giờ bị xóa (R5). */
export interface CmsStageEvent {
  id: string
  at: string
  actor: CmsActor
  text: string
  /** Sự kiện mốc (hoàn thành, xác nhận, duyệt CR) — tô đậm trên dòng thời gian. */
  milestone?: boolean
}

/** Một giai đoạn trong bảng điều khiển. */
export interface CmsSupervisionStage {
  key: CmsStageKey
  /** 1..6 — hiện trong "Giai đoạn 4/6". */
  index: number
  plannedStart: string
  plannedEnd: string
  actualStart?: string
  actualEnd?: string
  status: CmsStageStatus
  version: CmsStageVersion
  files: CmsStageFile[]
  comments: CmsStageComment[]
  inspection?: CmsStageInspection
  changeRequests: CmsChangeRequest[]
  history: CmsStageEvent[]
  /** Gợi ý chuẩn bị cho giai đoạn sắp tới (S21) — admin sửa được. */
  prepHint?: string
}

/** Chủ dự án — người vận hành gọi khi cần hẹn kỹ sư hay nhắc tải hồ sơ. */
export interface CmsProjectOwner {
  name: string
  phone: string
  email: string
}

/** Toàn bộ dữ liệu một dự án đang được giám sát. */
export interface CmsSupervisionProject {
  /** Mã dự án `SVC-YYYY-NNNN` — cũng là khóa của bản ghi trong kho. */
  id: string
  projectName: string
  /**
   * Chủ dự án. Backend trả kèm theo dự án; bản ghi cũ trong kho mock có thể
   * thiếu — màn quản trị khi đó tra người mua trong đơn gói giám sát.
   */
  customer?: CmsProjectOwner
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
  stages: CmsSupervisionStage[]
}

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

/* ===========================================================================
 * NHÀ THẦU (S12–S15).
 *
 * Danh bạ nằm ở `shared/cms` vì vận hành là bên nhập và xác minh nhà thầu:
 * màn quản trị ghi, luồng Tìm nhà thầu đọc — mà `features/admin` không được
 * import `features/contractors`. Không trường nào liên quan tới giá (R2).
 * ======================================================================== */

/** Vùng phục vụ — tab Bắc / Trung / Nam (S12). */
export type CmsServiceRegion = 'north' | 'central' | 'south'

/** Ảnh công trình trong hồ sơ năng lực (S13). */
export interface CmsContractorPhoto {
  url?: string
  caption: string
}

/** Dự án tiêu biểu của nhà thầu (S13). */
export interface CmsContractorProject {
  id: string
  name: string
  year: number
  imageUrl?: string
  /** Thế mạnh liên quan, dùng để lọc dự án khi bấm tag ở M06. */
  tags?: string[]
}

/**
 * Khối "Đối tác hợp tác cùng SAVICO" + bản scan thỏa thuận (S14).
 *
 * `pageCount` để dựng dải thumbnail bên trái viewer; bản scan thật do đội vận
 * hành tải lên, ở mock chỉ có siêu dữ liệu.
 */
export interface CmsContractorPartnership {
  verified: boolean
  /** Hợp tác từ tháng/năm — hiển thị "08/2026". */
  since: string
  contractCode: string
  signedAt: string
  pageCount: number
  scanUrl?: string
}

/**
 * Thông tin liên hệ THẬT của nhà thầu — chỉ vận hành thấy.
 *
 * S13: "Thông tin liên hệ được mở sau khi lịch khảo sát được xác nhận". Vận hành
 * là bên gọi nhà thầu để chốt lịch, nên số này nằm ở hồ sơ quản trị chứ không
 * nằm trên trang công khai.
 */
export interface CmsContractorContact {
  person: string
  phone: string
  email: string
}

/** Một nhà thầu — dùng chung cho thẻ danh sách, bảng so sánh và hồ sơ. */
export interface CmsContractor {
  id: string
  name: string
  logoUrl?: string
  /** Dòng phụ dưới tên: "Nhà thầu xây dựng". */
  kind: string
  verified: boolean
  rating: number
  reviewCount: number
  /** Số dự án tương tự dự án đang xét — cơ sở của xếp hạng "Phù hợp nhất". */
  similarProjects: number
  /**
   * Tổng số dự án đã hoàn thành — Hình S09 in nó ngay trên `similarProjects`
   * trong thẻ nhà thầu ở hero ("46 dự án" / "18 dự án tương tự"). Hai con số
   * khác nhau: một cái là bề dày, một cái là mức phù hợp với dự án đang xét.
   */
  completedProjects: number
  distanceKm: number
  serviceAreas: string[]
  region: CmsServiceRegion
  /** Có thể khảo sát trong bao nhiêu giờ — 24 hoặc 48 (S12, S15). */
  surveyWithinHours: number
  acceptingProjects: boolean
  intro: string
  strengths: string[]
  photos: CmsContractorPhoto[]
  foundedYear: number
  teamSize: string
  officeAddress: string
  warrantyMonths: number
  legalChecks: string[]
  featuredProjects: CmsContractorProject[]
  partnership: CmsContractorPartnership
  /** Chỉ vận hành thấy — xem `CmsContractorContact`. */
  contact?: CmsContractorContact
  /**
   * Ẩn khỏi mọi danh sách đề xuất (S09, S12) mà KHÔNG xóa hồ sơ: lời mời cũ vẫn
   * trỏ tới nhà thầu này, xóa đi thì thẻ lời mời của khách mất tên.
   */
  hidden?: boolean
  /** Ghi chú nội bộ của vận hành. */
  opsNote?: string
}

/* ===========================================================================
 * ĐƠN HÀNG — mua gói thiết kế (S01) và gói giám sát (S19), S03–S08.
 *
 * Nằm ở `shared/cms` vì R10 chỉ cho QR chuyển khoản: tới khi có đối soát tự
 * động với ngân hàng, NGƯỜI là bên xác nhận tiền đã về. Trang khách (S06) phải
 * đọc đúng bản ghi mà màn quản trị vừa đổi trạng thái — `features/admin` không
 * được import `features/checkout`, nên kiểu phải ở tầng dùng chung.
 * ======================================================================== */

/** Thứ được bán: gói thiết kế (S01) hoặc gói giám sát thi công (S19). */
export type CmsOrderKind = 'design' | 'supervision'

/**
 * Trạng thái đơn — cũng là thứ quyết định màn nào của khách được mở:
 * `awaiting` → S04 (QR), `verifying` → S06, `failed` → S07, `paid` → S08.
 */
export type CmsOrderStatus = 'awaiting' | 'verifying' | 'failed' | 'paid'

/** Thông tin người mua, sửa được ngay trên màn xác nhận đơn (S03). */
export interface CmsOrderBuyer {
  name: string
  phone: string
  email: string
}

/** Khối "Xuất hóa đơn" (S03) — tắt mặc định, bật thì cần đủ thông tin công ty. */
export interface CmsOrderInvoice {
  enabled: boolean
  company: string
  taxCode: string
  address: string
  email: string
}

/** Bản chụp sản phẩm tại thời điểm đặt — giá đổi sau đó không làm đơn cũ đổi theo. */
export interface CmsOrderProduct {
  id: string
  kind: CmsOrderKind
  /** Nhãn hiển thị, ví dụ "PLUS" hoặc "Gói An Tâm". */
  name: string
  price: number
  /** Vài dòng quyền lợi in trong khối "Đơn hàng của bạn". */
  benefits: string[]
}

/** Thông tin chuyển khoản hiện ở S04 và nhắc lại ở S06. */
export interface CmsTransferInfo {
  bankName: string
  accountNumber: string
  accountName: string
  /** Nội dung chuyển khoản — sai nội dung là đơn phải xác nhận thủ công. */
  content: string
  /** Chuỗi mã QR (bản mock dựng từ chính thông tin trên). */
  qrPayload: string
}

/** Một đơn mua gói. */
export interface CmsOrder {
  /** Mã đơn hàng `SVC-YYNNN`, hiện ở S04, S06, S07. */
  id: string
  product: CmsOrderProduct
  /** Dự án gắn với đơn — chỉ có với gói giám sát (R8). */
  projectId?: string
  buyer: CmsOrderBuyer
  invoice: CmsOrderInvoice
  /** Mã giảm giá đã áp dụng, rỗng nếu chưa áp. */
  discountCode: string
  subtotal: number
  discountAmount: number
  total: number
  status: CmsOrderStatus
  createdAt: string
  /** Hạn của mã QR hiện tại (ISO) — hết hạn thì tạo lại mã (S04). */
  expiresAt: string
  transfer: CmsTransferInfo
  /** Lúc khách bấm "Tôi đã chuyển khoản" (S04 → S06). */
  transferredAt?: string
  /** Lúc vận hành xác nhận tiền đã về. */
  paidAt?: string
  /** Ghi chú nội bộ — số tham chiếu sao kê, lý do báo chưa nhận… Khách không thấy. */
  opsNote?: string
}

/* ===========================================================================
 * MÃ GIẢM GIÁ (S03).
 * ======================================================================== */

export type CmsDiscountType = 'percent' | 'amount'

/**
 * Một mã giảm giá.
 *
 * Số lượt đã dùng KHÔNG lưu ở đây mà đếm từ đơn đã thanh toán: một con số lưu
 * riêng sẽ lệch ngay lần đầu có đơn bị xác nhận lại hay báo chưa nhận tiền.
 */
export interface CmsDiscountCode {
  id: string
  /** Mã khách gõ — luôn lưu chữ in hoa. */
  code: string
  type: CmsDiscountType
  /** Phần trăm (1–100) hoặc số tiền VND, tùy `type`. */
  value: number
  /** Trần số tiền giảm cho mã phần trăm, VND. Trống = không giới hạn. */
  maxDiscount?: number | null
  /** Đơn tối thiểu để dùng mã, VND. Trống = không yêu cầu. */
  minOrder?: number | null
  /** ISO date `YYYY-MM-DD`, tính cả ngày đó. Trống = không giới hạn. */
  startsAt?: string | null
  endsAt?: string | null
  /** Tổng số lượt dùng tối đa. Trống = không giới hạn. */
  usageLimit?: number | null
  /** Số lần một email được dùng. Trống = không giới hạn. */
  perAccountLimit?: number | null
  /** Mã sản phẩm (gói) áp dụng. Rỗng = mọi gói. */
  productIds: string[]
  enabled: boolean
  /** Ghi chú nội bộ — chương trình nào, ai tạo. */
  note?: string
}
