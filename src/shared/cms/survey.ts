/**
 * Khung giờ khảo sát (S16) — dùng chung giữa màn chọn giờ của khách và hàng đợi
 * lịch khảo sát của vận hành. Mã khung giờ là `slot-<vị trí>` trong mảng này,
 * nên thứ tự mảng KHÔNG được đổi khi đã có lịch được đặt.
 */

/** Giờ hành chính T2–T7, mỗi khung 1 tiếng, nghỉ trưa 12:00–13:00 (S16). */
export const SURVEY_SLOTS: readonly string[] = [
  '08:00 – 09:00',
  '09:00 – 10:00',
  '10:00 – 11:00',
  '11:00 – 12:00',
  '13:00 – 14:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00'
] as const

export function surveySlotId(index: number): string {
  return `slot-${index}`
}

/** `slot-2` → `10:00 – 11:00`. Mã lạ thì trả nguyên mã. */
export function surveySlotLabel(slotId: string): string {
  const index = Number(slotId.replace('slot-', ''))
  return SURVEY_SLOTS[index] ?? slotId
}
