'use client'

import { useState } from 'react'
import { Award, Briefcase, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { firstOpenDay } from '../services/consultation.service'
import type { Consultant, ConsultationDay } from '../types/consultation.types'
import { BookingDialog } from './booking-dialog'
import { SlotPicker } from './slot-picker'

interface ConsultantProfileProps {
  consultant: Consultant
  days: readonly ConsultationDay[]
  isPending?: boolean
}

/**
 * Cột phải trang hồ sơ KTS (mục VIII.2, Hình 15): hồ sơ chi tiết + dải công
 * trình tiêu biểu + khối chọn khung giờ + nút "Đặt lịch tư vấn".
 *
 * Nút chỉ bật khi đã chọn một khung giờ — bấm mới mở modal xác nhận (mục VIII.3),
 * nên khách không thể gửi yêu cầu thiếu giờ.
 */
export function ConsultantProfile({ consultant, days, isPending }: ConsultantProfileProps) {
  const t = useTranslations('consult.profile')

  const [dateChoice, setDateChoice] = useState('')
  const [timeChoice, setTimeChoice] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Lịch về sau khi trang đã render nên ngày đang chọn được SUY RA thay vì đặt
  // bằng effect: chưa chọn gì (hoặc ngày đã chọn không còn trong lịch mới) thì
  // mở sẵn ngày còn chỗ đầu tiên.
  const activeDay = days.find((day) => day.date === dateChoice) ?? firstOpenDay(days)
  const selectedDate = activeDay?.date ?? ''

  // Slot vừa đặt xong chuyển "Kín" — bỏ chọn luôn để nút không mở lại modal cho
  // một khung giờ đã hết chỗ.
  const chosenSlot = activeDay?.slots.find((slot) => slot.time === timeChoice)
  const selectedTime = chosenSlot && !chosenSlot.full ? chosenSlot.time : ''

  return (
    <div className='bg-card space-y-6 rounded-xl border p-4 sm:p-6'>
      <header className='flex flex-col gap-4 sm:flex-row'>
        <Photo
          className='aspect-square w-28 shrink-0 rounded-xl sm:w-32'
          src={consultant.avatarUrl}
          alt={consultant.name}
          sizes='128px'
          priority
        />

        <div className='min-w-0 space-y-2'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>{consultant.name}</h1>
            <p className='text-muted-foreground text-sm'>{consultant.title}</p>
          </div>

          <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
            <li className='flex items-center gap-1'>
              <Star className='size-3.5 fill-amber-400 text-amber-400' />
              <span className='text-foreground font-medium'>{consultant.rating.toFixed(1)}</span>
              {t('reviews', { count: consultant.reviewCount })}
            </li>
            <li className='flex items-center gap-1'>
              <Award className='text-primary size-3.5' />
              {t('experience', { years: consultant.yearsExperience })}
            </li>
            <li className='flex items-center gap-1'>
              <Briefcase className='text-primary size-3.5' />
              {t('specialtyPrefix', {
                value: consultant.specialties.map((specialty) => specialty.label).join(', ')
              })}
            </li>
          </ul>

          <div className='space-y-0.5'>
            {consultant.bio.map((line) => (
              <p key={line} className='text-sm leading-relaxed'>
                {line}
              </p>
            ))}
          </div>
        </div>
      </header>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {consultant.works.map((work) => (
          <figure key={work.imageUrl + work.label}>
            <Photo
              className='aspect-4/3 w-full rounded-lg'
              src={work.imageUrl}
              alt={work.label}
              sizes='(max-width: 640px) 45vw, 200px'
            />
            <figcaption className='sr-only'>{work.label}</figcaption>
          </figure>
        ))}
      </div>

      {isPending ? (
        <Skeleton className='h-44 w-full rounded-xl' />
      ) : (
        <SlotPicker
          days={days}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setDateChoice(date)
            setTimeChoice('')
          }}
          selectedTime={selectedTime}
          onSelectTime={setTimeChoice}
        />
      )}

      <Button size='lg' className='w-full' disabled={!selectedTime} onClick={() => setConfirmOpen(true)}>
        {t('bookCta')}
      </Button>

      {selectedDate && selectedTime ? (
        <BookingDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          consultant={consultant}
          date={selectedDate}
          time={selectedTime}
          onBooked={() => setTimeChoice('')}
        />
      ) : null}
    </div>
  )
}
