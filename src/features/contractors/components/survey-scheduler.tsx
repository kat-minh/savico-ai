'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Info, Lock, MapPin } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth } from '@/shared/auth'
import { Button } from '@/shared/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Textarea } from '@/shared/components/ui/textarea'
import { contractorInviteRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { MAX_INVITATIONS, SURVEY_WINDOW_DAYS } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractor } from '../hooks/use-contractors'
import { useInvitations, useSendInvitations, useSurveySlots } from '../hooks/use-invitations'
import { fullAddress } from '../services/brief.service'
import { remainingInvites } from '../services/contractor-list.service'
import { createSurveySchema, SURVEY_NOTE_MAX_LENGTH, type SurveyFormValues } from '../schemas/survey.schema'
import { useContractorsStore } from '../store/contractors.store'
import type { SurveyBooking } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { ContractorStats } from './contractor-stats'
import { ProjectContextBar } from './project-context-bar'

interface SurveySchedulerProps {
  projectId: string
  contractorId: string
}

/** `YYYY-MM-DD` theo giờ địa phương — `toISOString()` sẽ lệch ngày ở múi giờ VN. */
function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Chọn thời gian khảo sát (S16).
 *
 * Mời nhiều nhà thầu thì màn này lặp lại cho từng nhà thầu (mỗi bên một lịch
 * riêng). Bản mô tả không nói người dùng biết mình đang ở đâu trong chuỗi đó,
 * nên ở đây có thêm chỉ báo "Nhà thầu 2/3" và các lịch đã chọn được GOM LẠI,
 * chỉ gửi một lần ở nhà thầu cuối — để S17 hiện đúng một mã yêu cầu cho cả lượt.
 */
export function SurveyScheduler({ projectId, contractorId }: SurveySchedulerProps) {
  const t = useTranslations('contractors.survey')
  const tValidation = useTranslations('validation')
  const locale = useLocale() as Locale
  const router = useRouter()
  const { user } = useAuth()

  const { data: brief } = useBrief(projectId)
  const { data: contractor } = useContractor(contractorId)
  const { data: invitations } = useInvitations(projectId)
  const send = useSendInvitations(projectId)

  const inviteQueue = useContractorsStore((s) => s.inviteQueue)
  const queueIndex = useContractorsStore((s) => s.queueIndex)
  const pendingBookings = useContractorsStore((s) => s.pendingBookings)
  const addBooking = useContractorsStore((s) => s.addBooking)
  const advanceQueue = useContractorsStore((s) => s.advanceQueue)
  const clearQueue = useContractorsStore((s) => s.clearQueue)
  const clearCompare = useContractorsStore((s) => s.clearCompare)

  /**
   * 7 ngày làm việc kế tiếp — BỎ CHỦ NHẬT.
   *
   * Khung giờ ghi rõ "08:00–17:00, Thứ 2 – Thứ 7"; liệt kê cả Chủ nhật rồi để
   * khách chọn xong mới biết không ai đi khảo sát là mời họ đặt một lịch chết.
   */
  const days = useMemo(() => {
    const today = new Date()
    const result: Date[] = []
    for (let offset = 1; result.length < SURVEY_WINDOW_DAYS; offset += 1) {
      const date = new Date(today)
      date.setDate(today.getDate() + offset)
      if (date.getDay() !== 0) result.push(date)
    }
    return result
  }, [])

  const firstDay = days[0]
  const [date, setDate] = useState(() => (firstDay ? toDateKey(firstDay) : ''))
  const { data: slots, isPending: slotsPending } = useSurveySlots(contractorId, date)

  const schema = useMemo(
    () =>
      createSurveySchema({
        dateRequired: tValidation('required'),
        slotRequired: tValidation('required'),
        phoneRequired: tValidation('required'),
        phoneInvalid: tValidation('phone'),
        emailInvalid: tValidation('email'),
        noteMaxLength: tValidation('maxLength', { max: SURVEY_NOTE_MAX_LENGTH })
      }),
    [tValidation]
  )

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date,
      slotId: '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      note: ''
    }
  })

  const room = remainingInvites(invitations ?? []) - pendingBookings.length
  const inQueue = inviteQueue.length > 1
  const isLastOfQueue = !inQueue || queueIndex >= inviteQueue.length - 1

  /**
   * Bấm "Xác nhận" mà form còn thiếu trường thì RHF chặn im lặng — mà hai ô bắt
   * buộc dễ trống nhất (SĐT, email) lại nằm cuối trang, ngay trên nút. Người
   * dùng chỉ thấy bấm không ăn. Nói thẳng ra và kéo về ô lỗi đầu tiên.
   */
  const onInvalid = () => {
    toast.error(t('invalid'))
    const firstError = document.querySelector<HTMLElement>('[data-slot="form-message"]')
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onSubmit = (values: SurveyFormValues) => {
    const booking: SurveyBooking = { contractorId, ...values }
    // Lọc trùng theo nhà thầu: quay lại đặt lại lịch cho cùng một bên thì thay
    // lịch cũ chứ không gửi hai lời mời cho họ.
    const bookings = [...pendingBookings.filter((item) => item.contractorId !== contractorId), booking]

    if (isLastOfQueue) {
      clearCompare()
      clearQueue()
      send.mutate(bookings)
      return
    }

    // Còn nhà thầu trong hàng đợi: giữ lịch vừa chọn lại và mở nhà thầu kế tiếp.
    addBooking(booking)
    advanceQueue()
    const next = inviteQueue[queueIndex + 1]
    if (next) router.push(contractorInviteRoute(projectId, next))
  }

  if (!contractor) {
    return (
      <div className='mx-auto w-full max-w-5xl space-y-5 px-4 py-8 lg:px-8'>
        <Skeleton className='h-20 rounded-2xl' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-5xl space-y-5 px-4 py-8 lg:px-8'>
      <ProjectContextBar brief={brief} compact />

      <header className='space-y-1 text-center'>
        {inQueue ? (
          <p className='text-primary-strong bg-accent mx-auto w-fit rounded-full px-3 py-1 text-xs font-medium'>
            {t('queue', { current: queueIndex + 1, total: inviteQueue.length })}
          </p>
        ) : null}
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle', { name: contractor.name })}</p>
      </header>

      {room <= 0 ? (
        <p className='border-destructive/40 text-destructive rounded-xl border px-4 py-3 text-sm'>
          {t('limitReached', { max: MAX_INVITATIONS })}
        </p>
      ) : null}

      <section className='bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-4'>
        <ContractorLogo contractor={contractor} />
        <div className='min-w-0 flex-1'>
          <p className='font-semibold'>{contractor.name}</p>
          <ContractorStats contractor={contractor} dense className='mt-1.5' />
        </div>
      </section>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className='space-y-5'>
          <div className='grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]'>
            {/* Chọn ngày — chỉ 7 ngày tới, đúng cửa sổ nhà thầu nhận khảo sát. */}
            <section className='bg-card rounded-2xl border p-4'>
              <h2 className='flex items-center gap-2 text-sm font-semibold'>
                <CalendarDays className='text-primary size-4' />
                {t('dateTitle')}
              </h2>
              <p className='text-muted-foreground mt-1 text-xs'>{t('dateHint', { days: SURVEY_WINDOW_DAYS })}</p>

              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem className='mt-3'>
                    <ul className='space-y-1.5'>
                      {days.map((day) => {
                        const key = toDateKey(day)
                        const active = field.value === key
                        return (
                          <li key={key}>
                            <button
                              type='button'
                              onClick={() => {
                                field.onChange(key)
                                setDate(key)
                                form.setValue('slotId', '')
                              }}
                              className={cn(
                                'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                                active
                                  ? 'border-primary bg-accent text-primary-strong font-medium'
                                  : 'hover:border-primary/40'
                              )}
                            >
                              <span>
                                {formatDate(day, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              </span>
                              {active ? <ChevronRight className='size-4' /> : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Chọn khung giờ + ghi chú. */}
            <div className='min-w-0 space-y-5'>
              <section className='bg-card rounded-2xl border p-4'>
                <h2 className='flex items-center gap-2 text-sm font-semibold'>
                  <Clock className='text-primary size-4' />
                  {t('slotTitle')}
                  <span className='text-muted-foreground text-xs font-normal'>({t('slotOffice')})</span>
                </h2>

                <FormField
                  control={form.control}
                  name='slotId'
                  render={({ field }) => (
                    <FormItem className='mt-3'>
                      {slotsPending ? (
                        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
                          {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className='h-11 rounded-lg' />
                          ))}
                        </div>
                      ) : (
                        <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
                          {slots?.map((slot) => {
                            const active = field.value === slot.id
                            return (
                              <li key={slot.id}>
                                <button
                                  type='button'
                                  disabled={!slot.available}
                                  title={slot.available ? undefined : t('slotTaken')}
                                  onClick={() => field.onChange(slot.id)}
                                  className={cn(
                                    'w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
                                    active && 'border-primary bg-accent text-primary-strong font-medium',
                                    !active && slot.available && 'hover:border-primary/40',
                                    !slot.available &&
                                      'text-muted-foreground cursor-not-allowed line-through opacity-60'
                                  )}
                                >
                                  {slot.label}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className='text-muted-foreground bg-muted/50 mt-3 flex items-start gap-2 rounded-lg p-3 text-xs'>
                  <Info className='text-primary mt-0.5 size-3.5 shrink-0' />
                  <span>
                    {t('workingHours')}
                    <br />
                    {t('callAhead')}
                  </span>
                </p>
              </section>

              <section className='bg-card rounded-2xl border p-4'>
                <FormField
                  control={form.control}
                  name='note'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('noteTitle')}</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder={t('notePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-3'
                  onClick={() => form.setValue('note', t('notePlaceholder'), { shouldDirty: true })}
                >
                  {t('suggestNote')}
                </Button>
              </section>
            </div>
          </div>

          <section className='bg-card grid gap-5 rounded-2xl border p-4 sm:grid-cols-2'>
            <div>
              <h2 className='flex items-center gap-2 text-sm font-semibold'>
                <MapPin className='text-primary size-4' />
                {t('locationTitle')}
              </h2>
              <p className='text-muted-foreground mt-2 text-sm'>{brief ? fullAddress(brief) : ''}</p>
            </div>

            <div className='space-y-3'>
              <h2 className='text-sm font-semibold'>{t('contactTitle')}</h2>
              <div className='grid gap-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('phone')}</FormLabel>
                      <FormControl>
                        <Input inputMode='tel' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input inputMode='email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Button type='button' variant='outline' onClick={() => router.push(contractorMatchesRoute(projectId))}>
              <ChevronLeft className='size-4' />
              {t('cancel')}
            </Button>

            <Button type='submit' disabled={room <= 0 || send.isPending}>
              {isLastOfQueue ? t('submit') : t('submitNext')}
            </Button>
          </div>

          <p className='text-muted-foreground flex items-center justify-center gap-2 text-xs'>
            <Lock className='size-3.5' />
            {t('privacy')}
          </p>
        </form>
      </Form>
    </div>
  )
}
