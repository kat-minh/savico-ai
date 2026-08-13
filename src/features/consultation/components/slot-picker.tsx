'use client'

import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import { parseDateKey, sessionSlots } from '../services/consultation.service'
import type { ConsultationDay, ConsultationSlot } from '../types/consultation.types'

interface SlotPickerProps {
  days: readonly ConsultationDay[]
  selectedDate: string
  onSelectDate: (date: string) => void
  /** Giờ đang chọn trong ngày đang xem; rỗng nghĩa là chưa chọn. */
  selectedTime: string
  onSelectTime: (time: string) => void
}

/** Khóa dịch của nhãn thứ, đánh theo `Date.getDay()` (0 = Chủ nhật). */
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** "04/08" — viết tay thay vì Intl để mọi locale hiện cùng một dạng như Hình 15. */
function dayMonth(date: Date): string {
  return `${`${date.getDate()}`.padStart(2, '0')}/${`${date.getMonth() + 1}`.padStart(2, '0')}`
}

/** `getDay()` luôn trả 0-6 nên nhánh mặc định không bao giờ chạy — chỉ để hết cảnh báo index. */
const weekdayKey = (date: Date) => WEEKDAY_KEYS[date.getDay()] ?? 'sun'

/**
 * Khối "CHỌN KHUNG GIỜ TƯ VẤN" (mục VIII.2, Hình 15).
 *
 * Hàng chip 7 ngày ở trên, hai hàng khung giờ Sáng / Chiều ở dưới, mỗi slot 30
 * phút. Slot kín hiện chữ "Kín", mờ và không bấm được — vẫn giữ chỗ trong lưới
 * để hàng giờ không xô lệch khi lịch đổi.
 */
export function SlotPicker({ days, selectedDate, onSelectDate, selectedTime, onSelectTime }: SlotPickerProps) {
  const t = useTranslations('consult.slots')

  const activeDay = days.find((day) => day.date === selectedDate)

  return (
    <section className='space-y-4'>
      <h3 className='text-sm font-semibold tracking-wide uppercase'>{t('title')}</h3>

      <div className='grid grid-cols-4 gap-2 sm:grid-cols-7'>
        {days.map((day) => {
          const date = parseDateKey(day.date)
          const active = day.date === selectedDate
          const soldOut = day.slots.every((slot) => slot.full)

          return (
            <button
              key={day.date}
              type='button'
              onClick={() => onSelectDate(day.date)}
              aria-pressed={active}
              className={cn(
                'rounded-lg border px-2 py-2 text-center transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:border-primary/50 text-foreground',
                soldOut && !active && 'text-muted-foreground'
              )}
            >
              <span className='block text-sm font-semibold'>{t(`weekday.${weekdayKey(date)}`)}</span>
              <span className={cn('block text-xs', active ? 'opacity-80' : 'text-muted-foreground')}>
                {dayMonth(date)}
              </span>
            </button>
          )
        })}
      </div>

      <div className='space-y-2'>
        {(['morning', 'afternoon'] as const).map((session) => (
          <SessionRow
            key={session}
            label={t(`session.${session}`)}
            slots={sessionSlots(activeDay, session)}
            selectedTime={selectedTime}
            onSelectTime={onSelectTime}
            fullLabel={t('full')}
          />
        ))}
      </div>
    </section>
  )
}

interface SessionRowProps {
  label: string
  slots: ConsultationSlot[]
  selectedTime: string
  onSelectTime: (time: string) => void
  fullLabel: string
}

function SessionRow({ label, slots, selectedTime, onSelectTime, fullLabel }: SessionRowProps) {
  return (
    <div className='flex flex-wrap items-center gap-2 sm:flex-nowrap'>
      <span className='text-muted-foreground w-14 shrink-0 text-sm'>{label}</span>

      <div className='grid flex-1 grid-cols-3 gap-2 sm:grid-cols-6'>
        {slots.map((slot) => {
          const active = slot.time === selectedTime

          return (
            <button
              key={slot.id}
              type='button'
              disabled={slot.full}
              onClick={() => onSelectTime(slot.time)}
              aria-pressed={active}
              className={cn(
                'rounded-lg border py-1.5 text-sm font-medium transition-colors',
                slot.full
                  ? 'bg-muted/60 text-muted-foreground cursor-not-allowed'
                  : active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card hover:border-primary/50'
              )}
            >
              <span className={cn('block leading-tight', slot.full && 'opacity-60')}>{slot.time}</span>
              {slot.full ? <span className='block text-[10px] leading-tight'>{fullLabel}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
