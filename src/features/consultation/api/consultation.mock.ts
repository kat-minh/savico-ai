import { cmsDb } from '@/shared/cms'
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
 * Mock của Tư vấn 1:1. Hồ sơ KTS đọc từ kho `shared/cms` (admin biên soạn, mục
 * X #5); lịch hẹn khách vừa đặt được ghi ngược vào kho để trang quản trị thấy
 * ngay ở mục "Lịch hẹn".
 */

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

export const mockConsultationApi = {
  listConsultants: async (): Promise<Consultant[]> => {
    await mockDelay(250)
    return cmsDb.list('consultants')
  },

  getConsultant: async (id: string): Promise<Consultant | null> => {
    await mockDelay(200)
    return cmsDb.find('consultants', id)
  },

  getAvailability: async (consultantId: string): Promise<ConsultationDay[]> => {
    await mockDelay(250)
    return availabilityOf(consultantId)
  },

  bookConsultation: async (payload: BookConsultationPayload): Promise<ConsultationBooking> => {
    await mockDelay(500)

    const consultant = cmsDb.find('consultants', payload.consultantId)
    const day = availabilityOf(payload.consultantId).find((item) => item.date === payload.date)
    const slot = day?.slots.find((item) => item.time === payload.time)
    if (slot) slot.full = true

    // Mã lịch hẹn nối tiếp số đang có trong kho để không đụng seed.
    const nextNumber = cmsDb.list('bookings').length + 1
    const booking: ConsultationBooking = {
      id: `BOOK-${`${nextNumber}`.padStart(4, '0')}`,
      consultantId: payload.consultantId,
      consultantName: consultant?.name ?? '',
      date: payload.date,
      time: payload.time,
      phone: payload.phone,
      ...(payload.note ? { note: payload.note } : {}),
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    cmsDb.upsert('bookings', {
      ...booking,
      // Backend thật lấy tên từ phiên đăng nhập; mock chỉ có số điện thoại.
      customerName: `Khách ${payload.phone.slice(-4)}`
    })

    return booking
  }
}
