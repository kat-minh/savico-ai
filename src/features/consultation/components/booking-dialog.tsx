'use client'

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { useAuthStore } from '@/shared/auth'
import { FieldLabel } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { normalizePhone } from '@/shared/utils'
import { useBookConsultation } from '../hooks/use-consultation'
import { BOOKING_NOTE_MAX_LENGTH, createBookingSchema, type BookingFormValues } from '../schemas/booking.schema'
import { parseDateKey, slotEndTime } from '../services/consultation.service'
import type { Consultant } from '../types/consultation.types'

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultant: Consultant
  /** Ngày `yyyy-mm-dd` và giờ bắt đầu đã chọn ở khối chọn khung giờ. */
  date: string
  time: string
  /** Chạy sau khi đặt lịch xong — màn hồ sơ dùng để bỏ chọn slot vừa đặt. */
  onBooked?: () => void
}

/**
 * Modal "Xác nhận đặt lịch tư vấn" (mục VIII.3, Hình 16).
 *
 * KTS / ngày / khung giờ chỉ hiện lại ở dòng tóm tắt — sửa thì đóng modal chọn
 * lại, nên modal chỉ còn hai trường: SĐT liên lạc và ghi chú. SĐT tự điền theo
 * tài khoản nhưng sửa được vì khách có thể muốn KTS gọi vào số khác.
 */
export function BookingDialog({ open, onOpenChange, consultant, date, time, onBooked }: BookingDialogProps) {
  const t = useTranslations('consult.booking')
  const tv = useTranslations('validation')
  const format = useFormatter()

  const accountPhone = useAuthStore((s) => s.user?.phone)
  const bookConsultation = useBookConsultation()

  const schema = useMemo(
    () =>
      createBookingSchema({
        phoneRequired: tv('required'),
        phoneInvalid: tv('phone'),
        noteMaxLength: tv('maxLength', { max: BOOKING_NOTE_MAX_LENGTH })
      }),
    [tv]
  )

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: accountPhone ?? '', note: '' }
  })

  // SĐT tài khoản về sau lần render đầu (store hydrate từ localStorage), và mỗi
  // lần mở lại modal phải sạch ghi chú của lần đặt trước.
  const { reset } = form
  useEffect(() => {
    if (open) reset({ phone: accountPhone ?? '', note: '' })
  }, [open, accountPhone, reset])

  // "Thứ Năm 13/08" — ngày/tháng viết tay vì Intl trả "13-08" ở locale vi, lệch
  // với dạng dd/mm dùng ở chip ngày và trong Hình 16.
  const day = parseDateKey(date)
  const dayLabel = `${format.dateTime(day, { weekday: 'long' })} ${`${day.getDate()}`.padStart(2, '0')}/${`${day.getMonth() + 1}`.padStart(2, '0')}`
  const summary = [consultant.name, dayLabel, `${time} - ${slotEndTime(time)}`].join(' · ')

  function onSubmit(values: BookingFormValues) {
    bookConsultation.mutate(
      {
        consultantId: consultant.id,
        date,
        time,
        phone: normalizePhone(values.phone),
        ...(values.note ? { note: values.note } : {})
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onBooked?.()
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <p className='bg-accent text-primary-strong rounded-lg px-3 py-2 text-center text-sm font-medium'>{summary}</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FieldLabel htmlFor='booking-phone' hint={t('phoneHint')} required>
                    {t('phoneLabel')}
                  </FieldLabel>
                  <FormControl>
                    <Input
                      id='booking-phone'
                      type='tel'
                      inputMode='tel'
                      placeholder={t('phonePlaceholder')}
                      // Nếu không chỉ định, Radix focus phần tử focusable đầu
                      // tiên là nút (i) và tooltip bật sẵn đè lên dòng tóm tắt.
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <p className='text-muted-foreground text-xs'>{t('phoneNote')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='note'
              render={({ field }) => (
                <FormItem>
                  <FieldLabel htmlFor='booking-note' hint={t('noteHint')}>
                    {t('noteLabel')}
                  </FieldLabel>
                  <FormControl>
                    <Textarea
                      id='booking-note'
                      rows={3}
                      maxLength={BOOKING_NOTE_MAX_LENGTH}
                      placeholder={t('notePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' size='lg' className='w-full' disabled={bookConsultation.isPending}>
              {bookConsultation.isPending ? <Loader2 className='size-4 animate-spin' /> : null}
              {t('submit')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
