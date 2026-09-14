'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  BadgeCheck,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  X
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth } from '@/shared/auth'
import { revealEase } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/shared/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Textarea } from '@/shared/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { contractorInviteRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate, formatNumber } from '@/shared/utils'
import { MAX_INVITATIONS, SURVEY_WINDOW_DAYS } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractor } from '../hooks/use-contractors'
import { useInvitations, useSendInvitations, useSurveySlots } from '../hooks/use-invitations'
import { SURVEY_NOTE_MAX_LENGTH, createSurveySchema, type SurveyFormValues } from '../schemas/survey.schema'
import { fullAddress } from '../services/brief.service'
import { remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { SurveyBooking } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
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
 * Bố cục lấy từ ảnh S16: MỘT thẻ duy nhất chứa dải nhận diện nhà thầu, rồi hai
 * cột ngăn bằng vạch dọc (lịch tháng bên trái, khung giờ + ghi chú bên phải),
 * rồi hàng địa điểm + liên hệ. Ba nút thao tác nằm NGOÀI thẻ.
 *
 * Lịch là LỊCH THÁNG chứ không phải danh sách 7 ngày như bản trước: khách nhìn
 * ngay được thứ mấy, tuần nào — thứ mà một danh sách dọc không nói được.
 *
 * Mời nhiều nhà thầu thì màn này lặp lại cho từng nhà thầu (mỗi bên một lịch
 * riêng). Bản mô tả không nói người dùng biết mình đang ở đâu trong chuỗi đó,
 * nên ở đây có thêm chỉ báo "Nhà thầu 2/3" và các lịch đã chọn được GOM LẠI,
 * chỉ gửi một lần ở nhà thầu cuối — để S17 hiện đúng một mã yêu cầu cho cả lượt.
 */
export function SurveyScheduler({ projectId, contractorId }: SurveySchedulerProps) {
  const t = useTranslations('contractors.survey')
  const tCommon = useTranslations('contractors.common')
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

  const selectable = useMemo(() => new Set(days.map(toDateKey)), [days])

  const firstDay = days[0]
  /**
   * Mời nhiều nhà thầu: ngày vừa chọn cho nhà thầu TRƯỚC được giữ làm gợi ý
   * cho nhà thầu này (mục 3 của M07, mục 3 của M08) — đọc từ hàng đợi chung
   * chứ không phải state riêng, nên vẫn đúng dù trang này có dựng lại hay không
   * khi chuyển sang nhà thầu kế tiếp.
   */
  const preferredDate = pendingBookings[pendingBookings.length - 1]?.date
  const initialDay = preferredDate ? new Date(`${preferredDate}T00:00:00`) : firstDay
  const [date, setDate] = useState(() => preferredDate ?? (firstDay ? toDateKey(firstDay) : ''))
  /** Tháng đang hiển thị trên lịch — tách khỏi ngày đã chọn để lật tháng xem được. */
  const [month, setMonth] = useState(() =>
    initialDay ? new Date(initialDay.getFullYear(), initialDay.getMonth(), 1) : new Date()
  )
  const { data: slots, isPending: slotsPending } = useSurveySlots(contractorId, date)

  /** Nhà thầu kế tiếp trong hàng đợi trượt vào từ phải; lần đầu thì trượt lên (mục 3). */
  const isQueueAdvance = queueIndex > 0

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

  /**
   * Ảnh S16 vẽ khối liên hệ ở dạng CHỈ ĐỌC kèm nút "Chỉnh sửa" — thông tin này
   * lấy sẵn từ tài khoản, phần lớn khách không phải sửa gì.
   *
   * Luôn mở ở dạng chỉ đọc, kể cả khi hồ sơ còn thiếu số/email: bấm "Xác nhận"
   * mà thiếu thì `onInvalid` bung ô nhập ra và kéo tới chỗ lỗi, nên không ai bị
   * kẹt — còn mở sẵn ô nhập thì màn hình lệch hẳn so với bản thiết kế.
   */
  const [editingContact, setEditingContact] = useState(false)
  const [contactPhone, contactEmail] = useWatch({ control: form.control, name: ['phone', 'email'] })

  /**
   * Giá trị trước khi mở ô nhập, để nút bỏ thay đổi trả lại đúng cái cũ. Giữ
   * bằng `useState` chứ không `useRef`: `onInvalid` được truyền vào lúc render
   * nên chạm `ref.current` trong đó là vi phạm quy tắc refs của React.
   */
  const [contactSnapshot, setContactSnapshot] = useState<Pick<SurveyFormValues, 'phone' | 'email'> | null>(null)

  /** Viền loé xanh một lần khi vào chế độ nhập (mục 8). */
  const [contactFlash, setContactFlash] = useState(false)

  const openContactEditor = () => {
    setContactSnapshot({ phone: form.getValues('phone'), email: form.getValues('email') })
    setEditingContact(true)
    setContactFlash(true)
    window.setTimeout(() => setContactFlash(false), 700)
  }

  const { phone: phoneError, email: emailError } = form.formState.errors
  const contactError = phoneError?.message ?? emailError?.message

  const cancelContactEdit = () => {
    if (contactSnapshot) {
      form.setValue('phone', contactSnapshot.phone)
      form.setValue('email', contactSnapshot.email)
    }
    form.clearErrors(['phone', 'email'])
    setEditingContact(false)
  }

  /** Lưu liên hệ xong → tick xanh + thông báo một lần (mục 8). */
  const [contactJustSaved, setContactJustSaved] = useState(false)
  const saveContactWithFeedback = async () => {
    const valid = await form.trigger(['phone', 'email'])
    if (!valid) return
    setEditingContact(false)
    setContactJustSaved(true)
    toast.success(t('contactUpdated'))
    window.setTimeout(() => setContactJustSaved(false), 2000)
  }

  /** Huỷ khi đã chọn ngày/giờ → hỏi xác nhận nhỏ (mục 9). */
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const slotIdValue = useWatch({ control: form.control, name: 'slotId' })
  const requestCancel = () => {
    if (date && slotIdValue) {
      setCancelConfirmOpen(true)
      return
    }
    router.push(contractorMatchesRoute(projectId))
  }

  /** Bấm khung giờ đã bận → rung + thông báo (mục 5). */
  const [busySlotShake, setBusySlotShake] = useState<string | null>(null)
  /** Hộp "Khung giờ làm việc…" trượt xuống một lần sau khi chọn giờ (mục 5). */
  const [slotChosenOnce, setSlotChosenOnce] = useState(false)

  /** Nút "Xác nhận" thở một nhịp ngay khi vừa đủ ngày + giờ (mục 9). */
  const wasReadyRef = useRef(false)
  const [submitBreathe, setSubmitBreathe] = useState(false)
  const isReadyToSubmit = Boolean(date && slotIdValue)
  useEffect(() => {
    if (isReadyToSubmit && !wasReadyRef.current) {
      setSubmitBreathe(true)
      const timer = window.setTimeout(() => setSubmitBreathe(false), 500)
      wasReadyRef.current = true
      return () => window.clearTimeout(timer)
    }
    wasReadyRef.current = isReadyToSubmit
  }, [isReadyToSubmit])

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
    if (form.formState.errors.phone || form.formState.errors.email) openContactEditor()
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
      <div className='mx-auto w-[94%] max-w-[80rem] space-y-5 py-8'>
        <Skeleton className='h-20 rounded-2xl' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  /** Dải chỉ số cạnh tên nhà thầu — ba ô, đúng ảnh S16 (không có phạm vi phục vụ). */
  const facts = [
    {
      key: 'similar',
      icon: CalendarCheck,
      value: tCommon('similarShort', { count: contractor.similarProjects }),
      hint: tCommon('similarSuffix')
    },
    {
      key: 'distance',
      icon: MapPin,
      value: tCommon('distanceShort', {
        km: formatNumber(contractor.distanceKm, locale, { minimumFractionDigits: 1 })
      }),
      hint: tCommon('distanceSuffix')
    },
    {
      key: 'survey',
      icon: Clock,
      value: tCommon('surveyLabel'),
      hint: tCommon('surveyHours', { hours: contractor.surveyWithinHours })
    }
  ]

  const selectedDate = date ? new Date(`${date}T00:00:00`) : null

  return (
    <div className='mx-auto w-[94%] max-w-[80rem] space-y-5 py-8'>
      <ProjectContextBar brief={brief} compact />

      {/* Liên kết quay lại sát mép trái, tiêu đề canh giữa TRANG. */}
      <div className='relative space-y-3 lg:space-y-0'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link
            href={contractorMatchesRoute(projectId)}
            className='text-primary-strong inline-flex items-center gap-2 text-sm font-medium lg:absolute lg:top-1 lg:left-0'
          >
            ← {tCommon('backToList')}
          </Link>
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className='space-y-1 text-center'
        >
          {inQueue ? (
            <p className='text-primary-strong bg-accent mx-auto w-fit rounded-full px-3 py-1 text-xs font-medium'>
              {t('queue', { current: queueIndex + 1, total: inviteQueue.length })}
            </p>
          ) : null}
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
            {inQueue ? t('titleQueue', { current: queueIndex + 1, total: inviteQueue.length }) : t('title')}
          </h1>
          <p className='text-muted-foreground text-pretty'>{t('subtitle', { name: contractor.name })}</p>
        </motion.header>
      </div>

      {room <= 0 ? (
        <p className='border-destructive/40 text-destructive rounded-xl border px-4 py-3 text-sm'>
          {t('limitReached', { max: MAX_INVITATIONS })}
        </p>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className='space-y-5'>
          <motion.div
            key={contractorId}
            initial={isQueueAdvance ? { opacity: 0, x: 32 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.4, ease: revealEase }}
            className='bg-card rounded-2xl border'
          >
            {/* Dải nhận diện nhà thầu. */}
            <div className='flex flex-wrap items-center gap-y-4 border-b px-5 py-4'>
              <ContractorLogo contractor={contractor} className='size-16 shrink-0 rounded-xl' />

              <div className='min-w-0 grow basis-52 px-4 lg:grow-0 lg:basis-[28%]'>
                <p className='flex items-center gap-1.5 font-semibold'>
                  <span className='truncate'>{contractor.name}</span>
                  {contractor.verified ? <BadgeCheck className='text-primary size-4 shrink-0' /> : null}
                </p>
                <p className='mt-1 flex items-center gap-1.5 text-sm'>
                  <Star className='text-warning size-4 shrink-0 fill-current' />
                  {formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}/5
                  <span className='text-muted-foreground'>
                    {tCommon('reviewCount', { count: contractor.reviewCount })}
                  </span>
                </p>
              </div>

              <div className='divide-border border-border flex min-w-0 grow basis-full divide-x border-l lg:basis-0'>
                {facts.map((fact) => (
                  <div key={fact.key} className='min-w-0 flex-1 px-3'>
                    <p className='flex min-w-0 items-center gap-1.5 text-sm font-semibold'>
                      <fact.icon aria-hidden className='text-primary size-4 shrink-0' />
                      <span className='truncate'>{fact.value}</span>
                    </p>
                    <p className='text-muted-foreground mt-1 truncate pl-5.5 text-xs'>{fact.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid lg:grid-cols-[39%_minmax(0,1fr)]'>
              {/* Cột trái: lịch tháng. */}
              <section className='border-b p-5 lg:border-r lg:border-b-0'>
                <h2 className='font-semibold'>{t('dateTitle')}</h2>
                <p className='text-muted-foreground mt-1 text-sm'>{t('dateHint', { days: SURVEY_WINDOW_DAYS })}</p>

                <FormField
                  control={form.control}
                  name='date'
                  render={({ field }) => (
                    <FormItem className='mt-4'>
                      <MonthCalendar
                        locale={locale}
                        month={month}
                        onMonthChange={setMonth}
                        value={field.value}
                        selectable={selectable}
                        onSelect={(key) => {
                          field.onChange(key)
                          setDate(key)
                          form.setValue('slotId', '')
                        }}
                        prevLabel={t('prevMonth')}
                        nextLabel={t('nextMonth')}
                        firstAvailableDate={firstDay}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ul className='text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs'>
                  <li className='flex items-center gap-2'>
                    <span aria-hidden className='bg-accent size-3 rounded-full' />
                    {t('available')}
                  </li>
                  <li className='flex items-center gap-2'>
                    <span aria-hidden className='bg-muted size-3 rounded-full' />
                    {t('unavailable')}
                  </li>
                </ul>
              </section>

              {/* Cột phải: khung giờ, dòng lưu ý, ghi chú. */}
              <div className='min-w-0 space-y-4 p-5'>
                <div>
                  <h2 className='font-semibold'>
                    {t('slotTitle')} <span className='font-normal'>({t('slotOffice')})</span>
                  </h2>
                  {selectedDate ? (
                    <AnimatePresence mode='wait'>
                      <motion.p
                        key={date}
                        initial={{ opacity: 0, x: 8, y: -4 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className='text-muted-foreground mt-1 text-sm capitalize'
                      >
                        {formatDate(selectedDate, locale, {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </motion.p>
                    </AnimatePresence>
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name='slotId'
                  render={({ field }) => {
                    const earliestId = slots?.find((slot) => slot.available)?.id
                    return (
                      <FormItem>
                        {slotsPending ? (
                          <div className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4'>
                            {[0, 1, 2, 3].map((i) => (
                              <Skeleton key={i} className='h-12 rounded-lg' />
                            ))}
                          </div>
                        ) : (
                          <AnimatePresence mode='wait'>
                            <motion.ul
                              key={date}
                              initial='hidden'
                              animate='show'
                              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                              className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4'
                            >
                              {slots?.map((slot) => {
                                const active = field.value === slot.id
                                const isEarliest = slot.id === earliestId
                                const isBusyShake = busySlotShake === slot.id
                                return (
                                  <motion.li
                                    key={slot.id}
                                    variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } }}
                                    className='relative'
                                  >
                                    <motion.button
                                      type='button'
                                      onClick={() => {
                                        if (!slot.available) {
                                          setBusySlotShake(slot.id)
                                          window.setTimeout(() => setBusySlotShake(null), 400)
                                          return
                                        }
                                        field.onChange(slot.id)
                                        if (!slotChosenOnce) setSlotChosenOnce(true)
                                      }}
                                      animate={isBusyShake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                                      transition={{ duration: 0.35 }}
                                      className={cn(
                                        'flex h-12 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors',
                                        active && 'border-primary bg-accent/60 text-primary-strong font-medium',
                                        !active && slot.available && 'hover:border-primary/40',
                                        !slot.available &&
                                          'text-muted-foreground cursor-not-allowed line-through opacity-60'
                                      )}
                                    >
                                      {slot.label}
                                      {/* Vòng tròn xanh đặc, dấu tick trắng — `fill` ăn
                                          vào vòng tròn, nét tick giữ màu chữ. */}
                                      <AnimatePresence>
                                        {active ? (
                                          <motion.span
                                            key='tick'
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: 'spring', bounce: 0.6, duration: 0.35 }}
                                          >
                                            <CircleCheck className='fill-primary text-primary-foreground size-5 shrink-0' />
                                          </motion.span>
                                        ) : null}
                                      </AnimatePresence>
                                    </motion.button>
                                    {isEarliest && !active ? (
                                      <>
                                        <span className='bg-primary text-primary-foreground pointer-events-none absolute -top-2 left-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold'>
                                          {t('earliestSlot')}
                                        </span>
                                        <motion.span
                                          aria-hidden
                                          initial={{ opacity: 0.6, scale: 1 }}
                                          animate={{ opacity: 0, scale: 1.08 }}
                                          transition={{ duration: 1, delay: 0.4 }}
                                          className='border-primary pointer-events-none absolute inset-0 rounded-lg border-2'
                                        />
                                      </>
                                    ) : null}
                                  </motion.li>
                                )
                              })}
                            </motion.ul>
                          </AnimatePresence>
                        )}
                        <FormMessage />
                        <AnimatePresence>
                          {busySlotShake ? (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className='text-destructive mt-1.5 overflow-hidden text-xs'
                            >
                              {t('slotBusyClick')}
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </FormItem>
                    )
                  }}
                />

                {/* Trượt xuống lần đầu sau khi chọn giờ, rồi đứng yên (mục 5) —
                    `y` chỉ nhận dãy keyframe đúng lần đổi từ chưa chọn sang đã
                    chọn, các lần re-render sau target vẫn là 0 nên không lặp lại. */}
                <motion.p
                  animate={{ opacity: 1, y: slotChosenOnce ? [-10, 0] : 0 }}
                  transition={{ duration: 0.35, ease: revealEase }}
                  className='text-info-foreground bg-info-soft flex items-start gap-2.5 rounded-xl p-3 text-sm'
                >
                  <Info className='text-info mt-0.5 size-4 shrink-0' />
                  <span>
                    {t('workingHours')}
                    <br />
                    {t('callAhead')}
                  </span>
                </motion.p>

                <FormField
                  control={form.control}
                  name='note'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('noteTitle')}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder={t('notePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Địa điểm khảo sát + liên hệ nhận xác nhận. */}
            {/* Hàng cuối KHÔNG có vạch dọc: ảnh S16 chỉ kẻ vạch ngăn ở khối
                lịch/khung giờ phía trên, tới hàng này thì hai cột chạy liền. */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, ease: revealEase }}
              className='grid border-t lg:grid-cols-[39%_minmax(0,1fr)]'
            >
              <section className='group border-b p-5 lg:border-b-0'>
                <h2 className='font-semibold'>{t('locationTitle')}</h2>
                <p className='bg-muted/40 text-muted-foreground mt-3 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm'>
                  <MapPin className='text-primary size-4 shrink-0 transition-transform group-hover:-translate-y-0.5' />
                  <span className='truncate'>{brief ? fullAddress(brief) : ''}</span>
                </p>
              </section>

              <section className='min-w-0 p-5'>
                <h2 className='font-semibold'>{t('contactTitle')}</h2>

                {/* Ô chỉ đọc và ô nhập DÙNG CHUNG một khung: cùng chiều cao, cùng
                    icon, nên hàng này luôn thẳng hàng với "Địa điểm khảo sát"
                    bên trái dù đang xem hay đang sửa. Đổi sang cặp input có nhãn
                    riêng thì cả hàng tụt xuống và lệch hẳn so với ảnh S16. */}
                <div className='mt-3 flex flex-wrap items-center gap-3'>
                  {/* Viền loé xanh một lần khi vào chế độ nhập (mục 8) — công tắc
                      ring qua CSS thay vì nội suy `box-shadow` bằng JS, vì màu
                      lấy từ biến CSS (`--color-ring`) không nội suy được. */}
                  <div
                    className={cn(
                      'bg-muted/40 text-muted-foreground flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-1 rounded-lg border px-3 py-2.5 text-sm ring-0 ring-ring transition-shadow duration-700',
                      contactFlash && 'ring-2'
                    )}
                  >
                    <span className='flex min-w-0 flex-1 items-center gap-2'>
                      <Phone aria-hidden className='text-primary size-4 shrink-0' />
                      {editingContact ? (
                        <FormField
                          control={form.control}
                          name='phone'
                          render={({ field }) => (
                            <FormItem className='min-w-0 flex-1'>
                              <FormControl>
                                <input
                                  inputMode='tel'
                                  aria-label={t('phone')}
                                  placeholder={t('phone')}
                                  className='text-foreground w-full bg-transparent outline-hidden'
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className='flex min-w-0 items-center gap-1.5 truncate'>
                          {contactPhone || t('contactMissing')}
                          <AnimatePresence>
                            {contactJustSaved ? (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', bounce: 0.6, duration: 0.35 }}
                              >
                                <Check className='text-primary size-3.5 shrink-0' />
                              </motion.span>
                            ) : null}
                          </AnimatePresence>
                        </span>
                      )}
                    </span>

                    <span className='flex min-w-0 flex-1 items-center gap-2'>
                      <Mail aria-hidden className='text-primary size-4 shrink-0' />
                      {editingContact ? (
                        <FormField
                          control={form.control}
                          name='email'
                          render={({ field }) => (
                            <FormItem className='min-w-0 flex-1'>
                              <FormControl>
                                <input
                                  inputMode='email'
                                  aria-label={t('email')}
                                  placeholder={t('email')}
                                  className='text-foreground w-full bg-transparent outline-hidden'
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className='truncate'>{contactEmail || t('contactMissing')}</span>
                      )}
                    </span>
                  </div>

                  {editingContact ? (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className='flex items-center gap-2'
                    >
                      <Button type='button' onClick={saveContactWithFeedback}>
                        {t('saveContact')}
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        aria-label={t('cancelEdit')}
                        title={t('cancelEdit')}
                        onClick={cancelContactEdit}
                      >
                        <X className='size-4' />
                      </Button>
                    </motion.div>
                  ) : (
                    <Button
                      type='button'
                      variant='outline'
                      className='border-primary/50 text-primary-strong'
                      onClick={openContactEditor}
                    >
                      <Pencil className='size-4' />
                      {t('editContact')}
                    </Button>
                  )}
                </div>

                {/* Lỗi để DƯỚI hàng, không nhét vào trong khung — nhét vào là
                    khung cao lên và hàng lại lệch. */}
                {contactError ? <p className='text-destructive mt-2 text-sm'>{contactError}</p> : null}
              </section>
            </motion.div>
          </motion.div>

          {/* Hai nút nằm NGOÀI thẻ. Bản mô tả S16 còn nút "Đề xuất ghi chú" nhưng
              khách đã bỏ: nó chỉ chép nguyên placeholder vào ô ghi chú, tức là
              gửi cho nhà thầu đúng cái câu mẫu khách chưa đọc. */}
          <div className='flex flex-wrap items-start justify-end gap-3'>
            <div className='flex flex-col items-end gap-2'>
              <div className='flex flex-wrap gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  className='border-primary/50 text-primary-strong min-w-32'
                  onClick={requestCancel}
                >
                  {t('cancel')}
                </Button>
                {/* Mờ tới khi đủ ngày + giờ; đủ → màu đầy đủ + một nhịp thở (mục 9). */}
                <motion.span
                  animate={{ scale: submitBreathe ? [1, 1.03, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                  className='inline-block'
                >
                  <Button
                    type='submit'
                    disabled={room <= 0 || send.isPending}
                    className={cn(!(date && slotIdValue) && 'opacity-60')}
                  >
                    {send.isPending ? <Loader2 className='size-4 animate-spin' /> : null}
                    {send.isPending ? t('sending') : isLastOfQueue ? t('submit') : t('submitNext')}
                  </Button>
                </motion.span>
              </div>
              <p className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Lock className='size-3.5' />
                {t('privacy')}
              </p>
            </div>
          </div>
        </form>
      </Form>

      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('cancelConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('cancelConfirmBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCancelConfirmOpen(false)}>
              {t('keepEditing')}
            </Button>
            <Button variant='destructive' onClick={() => router.push(contractorMatchesRoute(projectId))}>
              {t('cancelConfirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Lịch tháng tự dựng.
 *
 * Không kéo `react-day-picker` về chỉ để vẽ 42 ô: màn này cần đúng một hành vi
 * (chọn một ngày trong tập cho trước) và cần khớp ảnh tới từng chi tiết — ô
 * xanh đặc bo tròn cho ngày đang chọn, nền nhạt cho ngày còn đặt được, xám cho
 * phần còn lại.
 *
 * Tuần bắt đầu THỨ HAI theo lịch Việt Nam, nên chỉ số cột = (getDay() + 6) % 7.
 */
function MonthCalendar({
  locale,
  month,
  onMonthChange,
  value,
  selectable,
  onSelect,
  prevLabel,
  nextLabel,
  firstAvailableDate
}: {
  locale: Locale
  month: Date
  onMonthChange: (next: Date) => void
  value: string
  selectable: Set<string>
  onSelect: (key: string) => void
  prevLabel: string
  nextLabel: string
  /** Nhảy về đây khi tháng đang xem không có ngày khả dụng nào (mục 4). */
  firstAvailableDate?: Date
}) {
  const t = useTranslations('contractors.survey')
  const weekdays = t.raw('weekdays') as string[]

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - lead)
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [month])

  const hasAvailableInMonth = cells.some((day) => day.getMonth() === month.getMonth() && selectable.has(toDateKey(day)))

  /** Hướng trượt khi đổi tháng — mẫu "điều chỉnh state khi prop đổi" của React. */
  const [renderedMonthKey, setRenderedMonthKey] = useState(`${month.getFullYear()}-${month.getMonth()}`)
  const [monthDirection, setMonthDirection] = useState(1)
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`
  if (monthKey !== renderedMonthKey) {
    setMonthDirection(monthKey > renderedMonthKey ? 1 : -1)
    setRenderedMonthKey(monthKey)
  }

  /** 7 ngày khả dụng "sáng lên" thêm một nhịp sau khi lưới hiện xong (mục 4). */
  const [pulseOnce, setPulseOnce] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setPulseOnce(true), 350)
    return () => window.clearTimeout(timer)
  }, [monthKey])

  /** Bấm ngày không khả dụng → rung nhẹ + chú giải (mục 4). */
  const [shakeKey, setShakeKey] = useState<string | null>(null)
  const shakeUnavailable = (key: string) => {
    setShakeKey(key)
    window.setTimeout(() => setShakeKey(null), 400)
  }

  const shift = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))

  return (
    <div>
      <div className='flex items-center justify-between'>
        <button
          type='button'
          aria-label={prevLabel}
          onClick={() => shift(-1)}
          className='text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md'
        >
          <ChevronLeft className='size-4' />
        </button>
        {/* Ảnh S16 ghi "Tháng 8, 2026" — Intl vi cho ra "tháng 9 năm 2026" nên
            tháng và năm được ghép tay. `capitalize` của Tailwind viết hoa MỌI
            từ ("Tháng 9 Năm 2026"), phải dùng `first-letter:uppercase`. */}
        <AnimatePresence mode='wait'>
          <motion.p
            key={monthKey}
            initial={{ opacity: 0, x: monthDirection * 10, y: -4 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='text-sm font-semibold first-letter:uppercase'
          >
            {formatDate(month, locale, { month: 'long' })}, {month.getFullYear()}
          </motion.p>
        </AnimatePresence>
        <button
          type='button'
          aria-label={nextLabel}
          onClick={() => shift(1)}
          className='text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md'
        >
          <ChevronRight className='size-4' />
        </button>
      </div>

      <div className='text-muted-foreground mt-2 grid grid-cols-7 text-center text-xs'>
        {weekdays.map((label) => (
          <span key={label} className='py-1.5'>
            {label}
          </span>
        ))}
      </div>

      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, x: monthDirection * 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -monthDirection * 16 }}
          transition={{ duration: 0.25 }}
          className='grid grid-cols-7 gap-y-1 text-center text-sm'
        >
          {cells.map((day, index) => {
            const key = toDateKey(day)
            const inMonth = day.getMonth() === month.getMonth()
            const canPick = selectable.has(key)
            const active = value === key
            const isShaking = shakeKey === key

            return (
              <div key={key} className='flex justify-center py-0.5'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      type='button'
                      onClick={() => (canPick ? onSelect(key) : shakeUnavailable(key))}
                      animate={isShaking ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                      transition={{ duration: 0.35 }}
                      className={cn(
                        'relative isolate flex size-9 items-center justify-center rounded-full transition-colors hover:scale-105',
                        active && 'font-semibold',
                        !active && canPick && 'bg-accent text-primary-strong hover:bg-accent/70 font-medium',
                        !canPick && (inMonth ? 'text-muted-foreground' : 'text-muted-foreground/45'),
                        !canPick && 'cursor-default'
                      )}
                    >
                      {/* Vòng tròn tô đặc của ngày đang chọn — overlay riêng để
                          trượt + nảy giữa các ô bằng `layoutId` (mục 4). */}
                      {active ? (
                        <motion.span
                          layoutId='calendar-active-day'
                          transition={{ type: 'spring', bounce: 0.45, duration: 0.4 }}
                          className='bg-primary absolute inset-0 -z-10 rounded-full'
                        />
                      ) : null}
                      {/* Sáng lên thêm một nhịp sau khi lưới vừa hiện (mục 4). */}
                      {canPick && !active && pulseOnce ? (
                        <motion.span
                          aria-hidden
                          initial={{ opacity: 0.5, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.6 }}
                          transition={{ duration: 0.6, delay: index * 0.03 }}
                          className='bg-accent absolute inset-0 -z-10 rounded-full'
                        />
                      ) : null}
                      <span className={cn('relative z-10', active && 'text-primary-foreground')}>{day.getDate()}</span>
                    </motion.button>
                  </TooltipTrigger>
                  {!canPick ? <TooltipContent>{t('dateHint', { days: SURVEY_WINDOW_DAYS })}</TooltipContent> : null}
                </Tooltip>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Tháng không có ngày khả dụng → thông báo + lối về tháng có lịch (mục 4). */}
      {!hasAvailableInMonth && firstAvailableDate ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className='mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3 text-sm'
        >
          <span className='text-muted-foreground'>{t('noMonthAvailable')}</span>
          <button
            type='button'
            onClick={() => onMonthChange(new Date(firstAvailableDate.getFullYear(), firstAvailableDate.getMonth(), 1))}
            className='text-primary-strong font-medium underline underline-offset-4'
          >
            {t('backToAvailableMonth')}
          </button>
        </motion.div>
      ) : null}
    </div>
  )
}
