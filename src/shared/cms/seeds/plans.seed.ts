import { BUILDING_IMAGE, CONSTRUCTION_IMAGE, STYLE_IMAGE, TOPIC_IMAGE } from '@/shared/lib/imagery'
import type { CmsQuotas, SubscriptionPlan, SupervisionPackage } from '../cms.types'

/**
 * Ba gói thiết kế theo S01 — Bảng giá gói thiết kế.
 *
 * Giá, số lượt, quyền lợi và quà tặng là số MINH HỌA; admin sửa được không cần
 * deploy (S01, mục "Lưu ý"). Thanh toán MỘT LẦN: bản mô tả v1.1 ghi rõ lượt
 * không hết hạn, nên `periodDays` là 0 — không có chu kỳ gia hạn.
 */
export const PLANS_SEED: SubscriptionPlan[] = [
  {
    id: 'basic',
    tier: 'basic',
    price: 399_000,
    periodDays: 0,
    designCredits: 3,
    libraryCredits: 20,
    perk: 'Xuất hồ sơ thi công',
    audience: 'chủ nhà đã khá rõ nhu cầu',
    fitLine: 'Phù hợp khi bạn đã khá rõ nhu cầu và muốn bắt đầu nhanh.',
    imageUrl: TOPIC_IMAGE.blueprint,
    features: [
      '3 phương án thiết kế',
      '3 lượt chỉnh sửa phương án',
      'Tra cứu thư viện mẫu',
      'Dự toán nội thất sơ bộ',
      'Xuất hồ sơ thi công',
      'Hỗ trợ tư vấn online'
    ]
  },
  {
    id: 'advanced',
    tier: 'advanced',
    price: 1_490_000,
    periodDays: 0,
    designCredits: 10,
    libraryCredits: 50,
    perk: 'Bố trí công năng 2D & 3D',
    audience: 'chủ nhà muốn so sánh nhiều phương án',
    popular: true,
    fitLine: 'Phù hợp khi bạn muốn thử và so sánh nhiều phương án trước khi chốt.',
    imageUrl: BUILDING_IMAGE.townhouse,
    features: [
      '10 phương án thiết kế',
      '10 lượt chỉnh sửa phương án',
      'Dự toán nội thất chi tiết',
      'Bố trí công năng 2D & 3D',
      'Xuất hồ sơ thi công',
      'Hỗ trợ tư vấn ưu tiên'
    ]
  },
  {
    id: 'pro',
    tier: 'pro',
    price: 3_990_000,
    periodDays: 0,
    designCredits: 20,
    libraryCredits: 100,
    perk: 'Tư vấn 1:1 cùng chuyên gia',
    audience: 'chủ nhà muốn tối ưu ngân sách và vật liệu',
    fitLine: 'Phù hợp khi bạn muốn tối ưu ngân sách và vật liệu trước khi thi công.',
    imageUrl: BUILDING_IMAGE.villa,
    features: [
      '20 phương án thiết kế',
      '20 lượt chỉnh sửa phương án',
      'Dự toán nội thất chi tiết & tối ưu',
      'Phối cảnh 3D chân thực',
      'Xuất hồ sơ thi công',
      'Tư vấn 1:1 cùng chuyên gia'
    ],
    gift: {
      title: 'Bộ thiết bị vệ sinh châu Âu',
      value: 100_000_000,
      extraTitle: '+ Ưu đãi thêm',
      extraBody:
        'Phí gói 3.990.000đ sẽ được khấu trừ vào giá trị hợp đồng khi ký hợp đồng thi công trọn gói cùng SAVICO.',
      conditions: 'Áp dụng khi khách hàng ký hợp đồng thi công trọn gói cùng SAVICO và đáp ứng điều kiện chương trình.'
    }
  }
]

/**
 * Ba lựa chọn quản lý thi công theo S19 — Trang Gói giám sát thi công.
 *
 * Quyền lợi diễn đạt theo 6 GIAI ĐOẠN cố định của bảng điều khiển (R5), không
 * theo checklist: bản demo có dòng "checklist theo từng giai đoạn" nhưng R9 nói
 * rõ hoàn thành giai đoạn là tải ảnh/tài liệu kèm tên, không có checklist bắt buộc.
 *
 * Không dòng nào nhắc tới báo giá của nhà thầu (R2).
 */
export const SUPERVISION_PACKAGES_SEED: SupervisionPackage[] = [
  {
    id: 'self',
    tier: 'self',
    price: 0,
    durationMonths: 6,
    inspections: null,
    fitLine: 'Phù hợp khi bạn có kinh nghiệm hoặc có người nhà theo sát công trình.',
    imageUrl: CONSTRUCTION_IMAGE.rebar,
    benefits: [
      'Lưu toàn bộ hồ sơ dự án trên SAVICO',
      'Xem lại thiết kế và dự toán đã lập',
      'Tự cập nhật tiến độ 6 giai đoạn',
      'Nâng cấp lên gói giám sát bất kỳ lúc nào'
    ]
  },
  {
    id: 'check',
    tier: 'check',
    price: 8_900_000,
    durationMonths: 6,
    inspections: 6,
    fitLine: 'Phù hợp khi bạn tự theo dõi được nhưng cần kỹ sư kiểm tra tại các mốc quan trọng.',
    imageUrl: CONSTRUCTION_IMAGE.electrician,
    benefits: [
      'Bảng điều khiển 6 giai đoạn, timeline và % tiến độ',
      'Kỹ sư kiểm tra thực tế tại các mốc chính',
      'Kiểm tra đấm mốc ẩm, móng thấm, hoàn thiện',
      'Đối chiếu vật liệu theo từng lần kiểm tra',
      'Báo cáo sau mỗi lần kiểm tra',
      'Nghiệm thu và bàn giao theo mốc chính'
    ]
  },
  {
    id: 'control',
    tier: 'control',
    price: 18_900_000,
    durationMonths: 6,
    inspections: 12,
    recommended: true,
    fitLine: 'Phù hợp khi bạn ít thời gian hoặc muốn SAVICO theo sát cả quá trình thi công.',
    imageUrl: STYLE_IMAGE.modern,
    benefits: [
      'Bao gồm toàn bộ quyền lợi gói SVC CHECK',
      'Kiểm tra phần thô theo tất cả các mốc',
      'Đối chiếu vật liệu thực tế ở mọi lần kiểm tra',
      'Nghiệm thu theo từng giai đoạn',
      'Theo dõi xử lý lỗi đến khi khắc phục xong',
      'Báo cáo tổng kết công trình'
    ]
  }
]

/**
 * Hạn mức miễn phí & hạn mức theo ngày.
 *
 * Con số lấy đúng từ những chỗ trước đây hardcode: 30/10 tin nhắn chat mỗi ngày
 * (Q&A §2.3.5), 3 lượt tra + 2 lượt xem chi tiết Cẩm nang mỗi ngày. Phần "chưa
 * mua gói" trước không có ở đâu, đặt bằng đúng con số mock đang chạy.
 */
export const QUOTAS_SEED: CmsQuotas = {
  freeDesignCredits: 1,
  freeLibraryCredits: 10,
  chatDailyGuest: 10,
  chatDailyCustomer: 30,
  handbookLookupPerDay: 3,
  handbookDetailPerDay: 3
}
