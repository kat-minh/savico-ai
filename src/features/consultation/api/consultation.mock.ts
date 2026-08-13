import { BUILDING_IMAGE, INTERIOR_IMAGE, PORTRAIT_IMAGE, STYLE_IMAGE, TOPIC_IMAGE } from '@/shared/lib/imagery'
import { mockDelay } from '@/shared/lib/mock'
import { AVAILABILITY_DAYS, SESSION_TIMES } from '../constants/consultation.constants'
import type {
  BookConsultationPayload,
  Consultant,
  ConsultationBooking,
  ConsultationDay,
  ConsultationSlot
} from '../types/consultation.types'

/**
 * 6 kiến trúc sư theo Hình 14. Nội dung (ảnh, giới thiệu, công trình tiêu biểu,
 * danh mục chuyên môn) do admin biên soạn — mục X, #5; đây là seed minh họa.
 */
const CONSULTANTS: Consultant[] = [
  {
    id: 'ktsvc-01',
    name: 'KTS. Nguyễn Minh Trí',
    title: 'Kiến trúc sư trưởng SAVICO',
    avatarUrl: PORTRAIT_IMAGE.man1,
    specialties: [
      { id: 'townhouse', label: 'Nhà phố' },
      { id: 'villa', label: 'Biệt thự' }
    ],
    yearsExperience: 12,
    projectCount: 85,
    headline: 'Chuyên thiết kế không gian sống hiện đại, tối ưu công năng và thẩm mỹ bền vững.',
    bio: [
      'Tôi luôn lắng nghe nhu cầu và ngân sách của bạn.',
      'Thiết kế tối ưu công năng, thẩm mỹ và chi phí trong từng chi tiết.',
      'Đồng hành cùng bạn từ ý tưởng đến hiện thực.'
    ],
    rating: 4.9,
    reviewCount: 128,
    works: [
      { imageUrl: STYLE_IMAGE.modern, label: 'Nhà phố hiện đại 3 tầng' },
      { imageUrl: BUILDING_IMAGE.villa, label: 'Biệt thự sân vườn' },
      { imageUrl: INTERIOR_IMAGE.modern, label: 'Phòng khách hiện đại' },
      { imageUrl: TOPIC_IMAGE.blueprint, label: 'Hồ sơ kỹ thuật' }
    ]
  },
  {
    id: 'ktsvc-02',
    name: 'KTS. Trần Thu Hà',
    title: 'Kiến trúc sư SAVICO',
    avatarUrl: PORTRAIT_IMAGE.woman1,
    specialties: [
      { id: 'apartment', label: 'Căn hộ' },
      { id: 'interior', label: 'Nội thất' }
    ],
    yearsExperience: 9,
    projectCount: 62,
    headline: 'Tập trung vào thiết kế nội thất tinh tế, tiện nghi và tối ưu trải nghiệm sống.',
    bio: [
      'Tôi bắt đầu từ thói quen sinh hoạt thật của gia đình bạn.',
      'Mỗi mét vuông căn hộ đều phải có công năng rõ ràng.',
      'Vật liệu và ánh sáng là hai thứ tôi cân nhắc kỹ nhất.'
    ],
    rating: 4.8,
    reviewCount: 96,
    works: [
      { imageUrl: BUILDING_IMAGE.apartment, label: 'Căn hộ 2 phòng ngủ' },
      { imageUrl: INTERIOR_IMAGE.minimal, label: 'Nội thất tối giản' },
      { imageUrl: TOPIC_IMAGE.kitchen, label: 'Bếp mở' },
      { imageUrl: TOPIC_IMAGE.livingRoom, label: 'Phòng khách sáng' }
    ]
  },
  {
    id: 'ktsvc-03',
    name: 'KTS. Lê Quang Vinh',
    title: 'Kiến trúc sư SAVICO',
    avatarUrl: PORTRAIT_IMAGE.man2,
    specialties: [
      { id: 'garden', label: 'Nhà vườn' },
      { id: 'roofed', label: 'Nhà mái' }
    ],
    yearsExperience: 11,
    projectCount: 74,
    headline: 'Yêu thích kiến trúc xanh, gắn giải pháp nhiên và bền vững theo thời gian.',
    bio: [
      'Tôi thiết kế nhà vườn và nhà mái theo khí hậu từng vùng.',
      'Ưu tiên thông gió tự nhiên, che nắng và vật liệu địa phương.',
      'Công trình phải bền và dễ bảo trì sau nhiều năm sử dụng.'
    ],
    rating: 4.9,
    reviewCount: 88,
    works: [
      { imageUrl: STYLE_IMAGE['thai-roof'], label: 'Nhà mái Thái hiện đại' },
      { imageUrl: STYLE_IMAGE['garden-villa'], label: 'Biệt thự sân vườn' },
      { imageUrl: STYLE_IMAGE['japanese-roof'], label: 'Nhà mái Nhật' },
      { imageUrl: BUILDING_IMAGE.garden, label: 'Nhà vườn cấp 4' }
    ]
  },
  {
    id: 'ktsvc-04',
    name: 'KTS. Phạm Ngọc Anh',
    title: 'Kiến trúc sư SAVICO',
    avatarUrl: PORTRAIT_IMAGE.woman2,
    specialties: [
      { id: 'townhouse', label: 'Nhà phố' },
      { id: 'minimal', label: 'Tối giản' }
    ],
    yearsExperience: 8,
    projectCount: 51,
    headline: 'Đam mê phong cách tối giản, tạo nên không gian sống thanh lịch và tinh tế.',
    bio: [
      'Tôi tin một ngôi nhà đẹp là ngôi nhà ít thứ thừa.',
      'Đường nét gọn, bảng màu trung tính, ánh sáng làm điểm nhấn.',
      'Phù hợp với gia đình trẻ ở nhà phố diện tích vừa.'
    ],
    rating: 4.7,
    reviewCount: 64,
    works: [
      { imageUrl: STYLE_IMAGE.minimal, label: 'Nhà phố tối giản' },
      { imageUrl: INTERIOR_IMAGE.minimal, label: 'Nội thất tối giản' },
      { imageUrl: TOPIC_IMAGE.warmLiving, label: 'Phòng khách ấm' },
      { imageUrl: STYLE_IMAGE.modern, label: 'Mặt tiền hiện đại' }
    ]
  },
  {
    id: 'ktsvc-05',
    name: 'KTS. Vũ Đình Long',
    title: 'Kiến trúc sư SAVICO',
    avatarUrl: PORTRAIT_IMAGE.man3,
    specialties: [
      { id: 'villa', label: 'Villa' },
      { id: 'neoclassical', label: 'Tân cổ điển' }
    ],
    yearsExperience: 14,
    projectCount: 96,
    headline: 'Chuyên thiết kế biệt thự sang trọng, đẳng cấp và bền vững với thời gian.',
    bio: [
      'Tôi làm biệt thự tân cổ điển với tỷ lệ chuẩn mực.',
      'Chi tiết phào chỉ, vật liệu cao cấp được kiểm soát chặt.',
      'Hồ sơ đủ chi tiết để đội thi công triển khai đúng ý đồ.'
    ],
    rating: 4.9,
    reviewCount: 142,
    works: [
      { imageUrl: STYLE_IMAGE.neoclassical, label: 'Biệt thự tân cổ điển' },
      { imageUrl: BUILDING_IMAGE.villa, label: 'Villa 2 tầng' },
      { imageUrl: INTERIOR_IMAGE.neoclassical, label: 'Nội thất tân cổ điển' },
      { imageUrl: TOPIC_IMAGE.gallery, label: 'Phòng khách lớn' }
    ]
  },
  {
    id: 'ktsvc-06',
    name: 'KTS. Đỗ Hải Yến',
    title: 'Kiến trúc sư SAVICO',
    avatarUrl: PORTRAIT_IMAGE.woman3,
    specialties: [
      { id: 'apartment', label: 'Căn hộ' },
      { id: 'wabi-sabi', label: 'Wabi-sabi' }
    ],
    yearsExperience: 7,
    projectCount: 48,
    headline: 'Theo đuổi sự mộc mạc, tự nhiên trong không gian và cảm xúc sống.',
    bio: [
      'Tôi thích vật liệu thô, bề mặt để lại dấu thời gian.',
      'Không gian ít đồ nhưng ấm, dễ chịu khi ở lâu.',
      'Hợp với căn hộ và nhà phố muốn sống chậm.'
    ],
    rating: 4.8,
    reviewCount: 57,
    works: [
      { imageUrl: STYLE_IMAGE['wabi-sabi'], label: 'Không gian wabi-sabi' },
      { imageUrl: BUILDING_IMAGE.apartment, label: 'Căn hộ ban công xanh' },
      { imageUrl: INTERIOR_IMAGE.indochine, label: 'Nội thất mộc' },
      { imageUrl: TOPIC_IMAGE.warmLiving, label: 'Góc sinh hoạt chung' }
    ]
  }
]

/** `yyyy-mm-dd` theo giờ địa phương (không dùng toISOString vì lệch múi giờ). */
function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Slot nào "Kín" — băm từ (mã KTS, ngày, giờ) thay vì `Math.random` để lịch
 * không nhảy mỗi lần render và mock giữ nguyên kết quả giữa các lần gọi.
 */
function isFull(seed: string): boolean {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997
  return hash % 5 === 0
}

/** Lịch trống 7 ngày kể từ hôm nay của một KTS (mục VIII.2). */
function buildAvailability(consultantId: string): ConsultationDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: AVAILABILITY_DAYS }, (_, dayOffset) => {
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset)
    const dateKey = toDateKey(date)

    const slots: ConsultationSlot[] = (['morning', 'afternoon'] as const).flatMap((session) =>
      SESSION_TIMES[session].map((time) => ({
        id: `${dateKey}-${time}`,
        time,
        session,
        full: isFull(`${consultantId}-${dateKey}-${time}`)
      }))
    )

    return { date: dateKey, slots }
  })
}

/** Lịch đã sinh, giữ trong bộ nhớ tab để slot vừa đặt chuyển "Kín" (mục VIII.3). */
const availabilityByConsultant = new Map<string, ConsultationDay[]>()

function availabilityOf(consultantId: string): ConsultationDay[] {
  const existing = availabilityByConsultant.get(consultantId)
  if (existing) return existing

  const created = buildAvailability(consultantId)
  availabilityByConsultant.set(consultantId, created)
  return created
}

let bookingCounter = 0

export const mockConsultationApi = {
  listConsultants: async (): Promise<Consultant[]> => {
    await mockDelay(250)
    return CONSULTANTS
  },

  getConsultant: async (id: string): Promise<Consultant | null> => {
    await mockDelay(200)
    return CONSULTANTS.find((consultant) => consultant.id === id) ?? null
  },

  getAvailability: async (consultantId: string): Promise<ConsultationDay[]> => {
    await mockDelay(250)
    return availabilityOf(consultantId)
  },

  bookConsultation: async (payload: BookConsultationPayload): Promise<ConsultationBooking> => {
    await mockDelay(500)

    const consultant = CONSULTANTS.find((item) => item.id === payload.consultantId)
    const day = availabilityOf(payload.consultantId).find((item) => item.date === payload.date)
    const slot = day?.slots.find((item) => item.time === payload.time)
    if (slot) slot.full = true

    bookingCounter += 1

    return {
      id: `BOOK-${`${bookingCounter}`.padStart(4, '0')}`,
      consultantId: payload.consultantId,
      consultantName: consultant?.name ?? '',
      date: payload.date,
      time: payload.time,
      phone: payload.phone,
      ...(payload.note ? { note: payload.note } : {}),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  }
}
