import { BUILDING_IMAGE, CONSTRUCTION_IMAGE, TOPIC_IMAGE } from '@/shared/lib/imagery'
import type { Contractor } from '../types/contractor.types'

/**
 * Danh bạ nhà thầu mẫu cho bản mock (S12–S15).
 *
 * Số liệu là dữ liệu minh họa — khi có backend, danh bạ này do đội vận hành
 * quản lý trong khu quản trị. Cố ý KHÔNG có trường nào liên quan tới giá: web
 * không hiển thị báo giá của nhà thầu (R2).
 *
 * Khoảng cách trải từ 2 tới 26 km để bộ lọc bán kính ở S12 (5/10/20/50 km)
 * thật sự lọc ra kết quả khác nhau chứ không phải nút bấm cho có.
 */
export const CONTRACTORS_SEED: readonly Contractor[] = [
  {
    id: 'ctr-abc',
    name: 'ABC Construction',
    kind: 'Nhà thầu xây dựng',
    verified: true,
    rating: 4.8,
    reviewCount: 126,
    similarProjects: 18,
    distanceKm: 2.3,
    serviceAreas: ['TP. Buôn Ma Thuột', 'Cư M’gar', 'Krông Pắc'],
    region: 'central',
    surveyWithinHours: 24,
    acceptingProjects: true,
    intro:
      'ABC Construction là đơn vị thiết kế và thi công nhà ở dân dụng với hơn 8 năm kinh nghiệm. Công ty sở hữu đội ngũ kiến trúc sư, kỹ sư và giám sát chuyên môn, đồng hành cùng khách hàng từ ý tưởng đến khi hoàn thiện công trình.',
    strengths: ['Nhà phố', 'Thi công trọn gói', 'Phần thô', 'Hoàn thiện'],
    photos: [
      { url: TOPIC_IMAGE.blueprint, caption: 'Văn phòng làm việc' },
      { url: CONSTRUCTION_IMAGE.electrician, caption: 'Đội ngũ nhân sự' },
      { url: CONSTRUCTION_IMAGE.rebar, caption: 'Công trình đang thi công' }
    ],
    foundedYear: 2016,
    teamSize: '32',
    officeAddress: 'TP. Buôn Ma Thuột, Đắk Lắk',
    warrantyMonths: 24,
    legalChecks: [
      'Giấy phép kinh doanh đã xác minh',
      'Đội ngũ kỹ sư phụ trách',
      'Bảo hiểm công trình',
      'Cam kết bảo hành'
    ],
    featuredProjects: [
      { id: 'p1', name: 'Nhà phố Nguyễn Văn Linh', year: 2023, imageUrl: BUILDING_IMAGE.townhouse },
      { id: 'p2', name: 'Nhà phố Tân Quy', year: 2024, imageUrl: BUILDING_IMAGE.roofed },
      { id: 'p3', name: 'Cải tạo nhà Hòa Bình', year: 2023, imageUrl: BUILDING_IMAGE.apartment }
    ],
    partnership: {
      verified: true,
      since: '08/2026',
      contractCode: 'SVC-HT-2026-018',
      signedAt: '2026-08-15',
      pageCount: 4
    }
  },
  {
    id: 'ctr-angia',
    name: 'An Gia Build',
    kind: 'Nhà thầu xây dựng',
    verified: true,
    rating: 4.6,
    reviewCount: 98,
    similarProjects: 15,
    distanceKm: 4.1,
    serviceAreas: ['TP. Buôn Ma Thuột', 'Buôn Đôn'],
    region: 'central',
    surveyWithinHours: 24,
    acceptingProjects: true,
    intro:
      'An Gia Build tập trung vào nhà phố và biệt thự trọn gói, có xưởng nội thất riêng nên chủ động được tiến độ phần hoàn thiện.',
    strengths: ['Nhà phố', 'Biệt thự', 'Thi công trọn gói', 'Nội thất'],
    photos: [
      { url: TOPIC_IMAGE.blueprint, caption: 'Văn phòng làm việc' },
      { url: CONSTRUCTION_IMAGE.rebar, caption: 'Công trình đang thi công' }
    ],
    foundedYear: 2014,
    teamSize: '45',
    officeAddress: 'TP. Buôn Ma Thuột, Đắk Lắk',
    warrantyMonths: 18,
    legalChecks: ['Giấy phép kinh doanh đã xác minh', 'Đội ngũ kỹ sư phụ trách', 'Cam kết bảo hành'],
    featuredProjects: [
      { id: 'p1', name: 'Biệt thự Tân An', year: 2025, imageUrl: BUILDING_IMAGE.villa },
      { id: 'p2', name: 'Nhà phố Lê Duẩn', year: 2024, imageUrl: BUILDING_IMAGE.townhouse }
    ],
    partnership: {
      verified: true,
      since: '05/2026',
      contractCode: 'SVC-HT-2026-011',
      signedAt: '2026-05-06',
      pageCount: 4
    }
  },
  {
    id: 'ctr-hungphat',
    name: 'Hưng Phát Home',
    kind: 'Nhà thầu xây dựng',
    verified: true,
    rating: 4.5,
    reviewCount: 76,
    similarProjects: 12,
    distanceKm: 3.7,
    serviceAreas: ['TP. Buôn Ma Thuột', 'Krông Ana'],
    region: 'central',
    surveyWithinHours: 48,
    acceptingProjects: true,
    intro:
      'Hưng Phát Home nhận phần thô và hoàn thiện cho nhà phố quy mô vừa, thế mạnh là kiểm soát khối lượng vật tư theo từng hạng mục.',
    strengths: ['Nhà phố', 'Phần thô', 'Hoàn thiện'],
    photos: [
      { url: CONSTRUCTION_IMAGE.rebar, caption: 'Công trình đang thi công' },
      { url: CONSTRUCTION_IMAGE.electrician, caption: 'Đội ngũ nhân sự' }
    ],
    foundedYear: 2018,
    teamSize: '24',
    officeAddress: 'TP. Buôn Ma Thuột, Đắk Lắk',
    warrantyMonths: 24,
    legalChecks: ['Giấy phép kinh doanh đã xác minh', 'Đội ngũ kỹ sư phụ trách', 'Bảo hiểm công trình'],
    featuredProjects: [
      { id: 'p1', name: 'Nhà phố Y Jút', year: 2024, imageUrl: BUILDING_IMAGE.townhouse },
      { id: 'p2', name: 'Nhà phố Phan Chu Trinh', year: 2023, imageUrl: BUILDING_IMAGE.roofed }
    ],
    partnership: {
      verified: true,
      since: '07/2026',
      contractCode: 'SVC-HT-2026-016',
      signedAt: '2026-07-02',
      pageCount: 3
    }
  },
  {
    id: 'ctr-truongthinh',
    name: 'Trường Thịnh E&C',
    kind: 'Nhà thầu xây dựng',
    verified: true,
    rating: 4.4,
    reviewCount: 54,
    similarProjects: 9,
    distanceKm: 12.4,
    serviceAreas: ['Cư M’gar', 'TP. Buôn Ma Thuột'],
    region: 'central',
    surveyWithinHours: 48,
    acceptingProjects: true,
    intro:
      'Trường Thịnh E&C thi công biệt thự và công trình có kết cấu phức tạp, có bộ phận quản lý chất lượng độc lập với đội thi công.',
    strengths: ['Biệt thự', 'Thi công trọn gói'],
    photos: [{ url: CONSTRUCTION_IMAGE.rebar, caption: 'Công trình đang thi công' }],
    foundedYear: 2012,
    teamSize: '60',
    officeAddress: 'Cư M’gar, Đắk Lắk',
    warrantyMonths: 36,
    legalChecks: [
      'Giấy phép kinh doanh đã xác minh',
      'Đội ngũ kỹ sư phụ trách',
      'Bảo hiểm công trình',
      'Cam kết bảo hành'
    ],
    featuredProjects: [{ id: 'p1', name: 'Biệt thự vườn Ea Kao', year: 2025, imageUrl: BUILDING_IMAGE.garden }],
    partnership: {
      verified: true,
      since: '03/2026',
      contractCode: 'SVC-HT-2026-004',
      signedAt: '2026-03-18',
      pageCount: 4
    }
  },
  {
    id: 'ctr-daiviet',
    name: 'Đại Việt Group',
    kind: 'Nhà thầu xây dựng',
    verified: true,
    rating: 4.2,
    reviewCount: 41,
    similarProjects: 6,
    distanceKm: 25.8,
    serviceAreas: ['Krông Pắc', 'Ea Kar'],
    region: 'central',
    surveyWithinHours: 48,
    acceptingProjects: false,
    intro:
      'Đại Việt Group nhận phần thô và hoàn thiện tại khu vực Krông Pắc – Ea Kar, quy mô đội nhỏ nên nhận số lượng dự án hạn chế.',
    strengths: ['Phần thô', 'Hoàn thiện'],
    photos: [{ url: CONSTRUCTION_IMAGE.rebar, caption: 'Công trình đang thi công' }],
    foundedYear: 2019,
    teamSize: '18',
    officeAddress: 'Krông Pắc, Đắk Lắk',
    warrantyMonths: 12,
    legalChecks: ['Giấy phép kinh doanh đã xác minh', 'Cam kết bảo hành'],
    featuredProjects: [{ id: 'p1', name: 'Nhà phố Phước An', year: 2024, imageUrl: BUILDING_IMAGE.townhouse }],
    partnership: {
      verified: true,
      since: '09/2026',
      contractCode: 'SVC-HT-2026-021',
      signedAt: '2026-09-01',
      pageCount: 3
    }
  }
] as const
