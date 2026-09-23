'use client'

import { useEffect, useRef, useState } from 'react'
import { Award, Briefcase, Star } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { Photo, revealEase } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { firstOpenDay } from '../services/consultation.service'
import type { Consultant, ConsultationDay } from '../types/consultation.types'
import { BookingDialog, type BookingDialogOrigin } from './booking-dialog'
import { SlotPicker } from './slot-picker'

interface ConsultantProfileProps {
  consultant: Consultant
  days: readonly ConsultationDay[]
  isPending?: boolean
  dateChoice: string
  onDateChoiceChange: (date: string) => void
  timeChoice: string
  onTimeChoiceChange: (time: string) => void
}

/**
 * Cột phải trang hồ sơ KTS (mục VIII.2, Hình 15): hồ sơ chi tiết + dải công
 * trình tiêu biểu + khối chọn khung giờ + nút "Đặt lịch tư vấn".
 *
 * Nút chỉ bật khi đã chọn một khung giờ — bấm mới mở modal xác nhận (mục VIII.3),
 * nên khách không thể gửi yêu cầu thiếu giờ.
 *
 * ★ Ảnh, tên/chức danh, dòng chỉ số, giới thiệu rồi dải công trình hiện LẦN
 * LƯỢT khi vào trang (component này remount mỗi lần đổi KTS nhờ `key` ở
 * `ConsultantDetail`) — một `motion.div` gốc dùng `staggerChildren` nên mỗi
 * khối chỉ cần khai `variants={revealItemVariants}`, không cần tự tính delay
 * (mục 4). Ảnh hồ sơ KHÔNG phóng khi rê để giữ trang trọng, khác thẻ danh
 * sách. Ngôi sao đánh giá tự loé sáng đúng một lần lúc vào trang, các con số
 * đứng yên (mục 5). Dải công trình rê tới đâu ảnh đó phóng nhẹ + sáng lên, ba
 * ảnh còn lại tối nhẹ đi (mục 6).
 */
export function ConsultantProfile({
  consultant,
  days,
  isPending,
  dateChoice,
  onDateChoiceChange,
  timeChoice,
  onTimeChoiceChange
}: ConsultantProfileProps) {
  const t = useTranslations('consult.profile')
  const reduceMotion = useReducedMotion()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [hoveredWork, setHoveredWork] = useState<number | null>(null)

  // Lịch về sau khi trang đã render nên ngày đang chọn được SUY RA thay vì đặt
  // bằng effect: chưa chọn gì (hoặc ngày đã chọn không còn trong lịch mới) thì
  // mở sẵn ngày còn chỗ đầu tiên.
  const activeDay = days.find((day) => day.date === dateChoice) ?? firstOpenDay(days)
  const selectedDate = activeDay?.date ?? ''

  // Slot vừa đặt xong chuyển "Kín" — bỏ chọn luôn để nút không mở lại modal cho
  // một khung giờ đã hết chỗ.
  const chosenSlot = activeDay?.slots.find((slot) => slot.time === timeChoice)
  const selectedTime = chosenSlot && !chosenSlot.full ? chosenSlot.time : ''

  // Nút "Đặt lịch" vừa chuyển từ mờ sang bật (mục 10): phát một vệt sáng lướt
  // qua đúng một lần và tự cuộn cho nút vào khung nhìn nếu đang khuất — bỏ
  // chọn giờ thì không có gì chạy lại (chỉ mờ đi theo `disabled:opacity-50` có
  // sẵn của Button).
  const hasTime = Boolean(selectedTime)
  const hadTimeRef = useRef(false)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [sweepKey, setSweepKey] = useState(0)

  useEffect(() => {
    let scrollFrame = 0
    if (hasTime && !hadTimeRef.current) {
      setSweepKey((key) => key + 1)
      scrollFrame = requestAnimationFrame(() => {
        const rect = ctaRef.current?.getBoundingClientRect()
        if (rect && (rect.top < 16 || rect.bottom > window.innerHeight - 16)) {
          ctaRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
        }
      })
    }
    hadTimeRef.current = hasTime
    return () => cancelAnimationFrame(scrollFrame)
  }, [hasTime, reduceMotion])

  // CC-04 (M3 → M4): ô ngày/giờ đang chọn nhấp sáng một nhịp ngay lúc bấm
  // "Đặt lịch tư vấn" — `bookPulse` đi xuống `SlotPicker` để chính hai ô đó tự
  // phát hiệu ứng. Hộp thoại thì "nở ra" đúng từ vị trí nút (mục 2, CC-04) nên
  // cần rect của nút ngay lúc bấm — tính độ lệch so với tâm màn hình ở ĐÂY,
  // trong sự kiện click, để `BookingDialog` không phải tự đọc `window` lúc render.
  const [bookPulse, setBookPulse] = useState(0)
  const [bookOrigin, setBookOrigin] = useState<BookingDialogOrigin | null>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current)
    },
    []
  )

  function openBookingDialog() {
    const rect = ctaRef.current?.getBoundingClientRect()
    setBookOrigin(
      rect
        ? {
            dx: rect.x + rect.width / 2 - window.innerWidth / 2,
            dy: rect.y + rect.height / 2 - window.innerHeight / 2
          }
        : null
    )
    setBookPulse((key) => key + 1)
    if (openTimerRef.current) clearTimeout(openTimerRef.current)
    // Để nhịp sáng ở ngày + giờ nhìn thấy được trước khi overlay phủ lên M3.
    openTimerRef.current = setTimeout(
      () => {
        setConfirmOpen(true)
        openTimerRef.current = null
      },
      reduceMotion ? 0 : 180
    )
  }

  const entrance = (order: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0.01 : 0.38,
      delay: reduceMotion ? 0 : 0.04 + order * 0.085,
      ease: revealEase
    }
  })

  return (
    <AnimatePresence>
      <motion.div key={consultant.id} className='space-y-6'>
        <header className='flex flex-col gap-4 sm:flex-row'>
          <motion.div {...entrance(0)} className='aspect-square w-28 shrink-0 sm:w-32'>
            <Photo
              className='size-full rounded-xl'
              src={consultant.avatarUrl}
              alt={consultant.name}
              sizes='128px'
              priority
            />
          </motion.div>

          <div className='min-w-0 space-y-2'>
            <motion.div {...entrance(1)}>
              <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>{consultant.name}</h1>
              <p className='text-muted-foreground text-sm'>{consultant.title}</p>
            </motion.div>

            <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
              <motion.li {...entrance(2)} className='flex items-center gap-1'>
                <SparkleStar />
                <span className='text-foreground font-medium'>{consultant.rating.toFixed(1)}</span>
                {t('reviews', { count: consultant.reviewCount })}
              </motion.li>
              <motion.li {...entrance(3)} className='flex items-center gap-1'>
                <Award className='text-primary size-3.5' />
                {t('experience', { years: consultant.yearsExperience })}
              </motion.li>
              <motion.li {...entrance(4)} className='flex items-center gap-1'>
                <Briefcase className='text-primary size-3.5' />
                {t('specialtyPrefix', {
                  value: consultant.specialties.map((specialty) => specialty.label).join(', ')
                })}
              </motion.li>
            </ul>

            <motion.div {...entrance(5)} className='space-y-0.5'>
              {consultant.bio.map((line) => (
                <p key={line} className='text-sm leading-relaxed'>
                  {line}
                </p>
              ))}
            </motion.div>
          </div>
        </header>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {consultant.works.map((work, index) => (
            <motion.figure
              key={work.imageUrl + work.label}
              {...entrance(6 + index)}
              onMouseEnter={() => setHoveredWork(index)}
              onMouseLeave={() => setHoveredWork((current) => (current === index ? null : current))}
            >
              <div
                className={cn(
                  'transition-[filter,transform] duration-300',
                  hoveredWork === index ? 'scale-105 brightness-110' : hoveredWork !== null ? 'brightness-90' : ''
                )}
              >
                <Photo
                  className='aspect-4/3 w-full rounded-lg'
                  src={work.imageUrl}
                  alt={work.label}
                  sizes='(max-width: 640px) 45vw, 200px'
                />
              </div>
              <figcaption className='sr-only'>{work.label}</figcaption>
            </motion.figure>
          ))}
        </div>

        {isPending ? (
          <Skeleton className='h-44 w-full rounded-xl' />
        ) : (
          <SlotPicker
            days={days}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              if (date === selectedDate) return
              onDateChoiceChange(date)
              onTimeChoiceChange('')
            }}
            selectedTime={selectedTime}
            onSelectTime={onTimeChoiceChange}
            pulseKey={bookPulse}
          />
        )}

        <div ref={ctaRef}>
          <Button
            size='lg'
            className='relative w-full transition-[opacity,transform,filter] duration-300 hover:-translate-y-0.5 hover:brightness-110'
            disabled={!selectedTime}
            onClick={openBookingDialog}
          >
            {t('bookCta')}
            {hasTime && sweepKey > 0 && !reduceMotion ? (
              <motion.span
                key={sweepKey}
                aria-hidden
                className='pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-white/40'
                initial={{ x: '-140%', opacity: 0 }}
                animate={{ x: '480%', opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut' }}
              />
            ) : null}
          </Button>
        </div>

        {selectedDate && selectedTime ? (
          <BookingDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            consultant={consultant}
            date={selectedDate}
            time={selectedTime}
            onBooked={() => onTimeChoiceChange('')}
            origin={bookOrigin}
          />
        ) : null}
      </motion.div>
    </AnimatePresence>
  )
}

/** Ngôi sao đánh giá loé sáng đúng một lần lúc vào trang — con số bên cạnh đứng yên (mục 5). */
function SparkleStar() {
  return (
    <span className='relative inline-flex size-3.5 shrink-0'>
      <motion.span
        aria-hidden
        className='bg-amber-400/60 absolute inset-0 rounded-full'
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
      />
      <motion.span
        initial={{ scale: 0.5 }}
        animate={{ scale: [0.5, 1.35, 1] }}
        transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
        className='inline-flex'
      >
        <Star className='fill-amber-400 text-amber-400 size-3.5' />
      </motion.span>
    </span>
  )
}
