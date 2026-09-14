'use client'

import {
  BadgeCheck,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  Copy,
  Headset,
  Lock,
  MapPin,
  MessageSquare,
  Send
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { revealContainerVariants, revealEase, revealItemVariants } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorInvitationsRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { formatDate } from '@/shared/utils'
import { SURVEY_SLOTS } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useInvitations, useSurveyRequest } from '../hooks/use-invitations'
import { fullAddress } from '../services/brief.service'
import { remainingInvites } from '../services/contractor-list.service'
import { ContractorLogo } from './contractor-logo'
import { ProjectContextBar } from './project-context-bar'

interface InviteSentProps {
  projectId: string
  requestId: string
}

/** "slot-3" → "11:00 – 12:00". Khung giờ là danh mục cố định (S16). */
function slotLabel(slotId: string): string {
  const index = Number(slotId.replace('slot-', ''))
  return SURVEY_SLOTS[index] ?? slotId
}

/**
 * Đã gửi lời mời & đăng ký khảo sát (S17).
 *
 * Thanh ngữ cảnh dự án chạy hết bề ngang trang, còn phần xác nhận nằm trong một
 * CỘT HẸP canh giữa (~59% bề ngang, đo từ ảnh S17): đây là màn đọc một lần rồi
 * đi, dàn ngang hết màn thì mắt phải quét quá xa cho vài dòng chữ.
 *
 * Khối "Chi tiết yêu cầu" liệt kê TẤT CẢ nhà thầu của lượt mời này (≤ 3, R1) —
 * mời ba nhà thầu thì đây là ba dòng, không phải ba màn xác nhận rời nhau.
 */
export function InviteSent({ projectId, requestId }: InviteSentProps) {
  const t = useTranslations('contractors.sent')
  const tCommon = useTranslations('contractors.common')
  const locale = useLocale() as Locale

  const { data: brief } = useBrief(projectId)
  const { data: contractors } = useContractors(projectId)
  const { data, isPending } = useSurveyRequest(requestId)
  const { data: invitations } = useInvitations(projectId)

  /** Sao chép mã yêu cầu → "Đã sao chép" hiện chéo rồi tự tắt (mục 2). */
  const [copied, setCopied] = useState(false)
  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  /** Còn lượt mời → gợi ý mời thêm, hiện sau vài giây (mục 4). */
  const [showMoreHint, setShowMoreHint] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setShowMoreHint(true), 2500)
    return () => window.clearTimeout(timer)
  }, [])

  if (isPending || !data) {
    return (
      <div className='mx-auto w-[94%] max-w-[88rem] py-8'>
        <Skeleton className='mx-auto h-96 max-w-[54rem] rounded-2xl' />
      </div>
    )
  }

  const contractorOf = (contractorId: string) => contractors?.find((c) => c.id === contractorId)
  const names = data.invitations
    .map((invitation) => contractorOf(invitation.contractorId)?.name ?? invitation.contractorId)
    .join(', ')
  const room = remainingInvites(invitations ?? [])

  return (
    <div className='mx-auto w-[94%] max-w-[88rem] py-8'>
      {/* Bản mô tả S17 vẫn giữ thanh ngữ cảnh dự án ở đầu trang như S15–S18. */}
      <ProjectContextBar brief={brief} compact />

      <div className='mx-auto mt-8 w-full max-w-[54rem] space-y-6'>
        <header className='space-y-3 text-center'>
          {/* Vòng tròn minh họa: máy bay giấy + lịch đã xác nhận, đúng ảnh S17.
              Chạy một lần khi vào trang (mục 1). */}
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
            className='bg-accent/70 text-primary relative mx-auto flex size-32 items-center justify-center rounded-full'
          >
            <motion.span
              initial={{ x: -40, y: 20, opacity: 0 }}
              animate={{ x: -6, y: -6, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: revealEase }}
            >
              <Send className='size-14' strokeWidth={1.25} />
            </motion.span>
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.6, duration: 0.4, delay: 0.5 }}
              className='bg-accent/70 absolute right-8 bottom-8 size-8 translate-x-1/2 translate-y-1/2 rounded'
            >
              <CalendarDays className='size-8' strokeWidth={1.5} />
            </motion.span>
            {/* "Tick vẽ nét" gần đúng bằng phóng-nảy vào — lucide xuất icon dạng
                một khối SVG, không tách được path để vẽ nét thật. Anh em của
                khối lịch (không lồng vào trong) để giữ đúng toạ độ neo gốc:
                cùng right-8 bottom-8 trên vòng tròn ngoài, chỉ khác độ dịch. */}
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.6, duration: 0.3, delay: 0.75 }}
              className='absolute right-8 bottom-8 translate-x-3/4 translate-y-3/4'
            >
              <CircleCheck className='fill-primary text-primary-foreground size-4' />
            </motion.span>
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.5 }}
            className='text-primary-strong text-2xl font-semibold tracking-tight sm:text-3xl'
          >
            {data.invitations.length > 1 ? t('titleMultiple', { count: data.invitations.length }) : t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.6 }}
            className='text-muted-foreground text-pretty'
          >
            {t('subtitle', { names })}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.7 }}
            className='text-muted-foreground group inline-flex items-center gap-1.5 text-sm'
          >
            {t('requestCode', { code: data.request.id })} ·{' '}
            {t('sentAt', {
              time: formatDate(data.request.createdAt, locale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            })}
            {/* Rê mã → nút sao chép hiện (mục 2). */}
            <button
              type='button'
              onClick={() => copyCode(data.request.id)}
              aria-label={t('copyCode')}
              className='text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100'
            >
              {copied ? <Check className='text-primary size-3.5' /> : <Copy className='size-3.5' />}
            </button>
            <AnimatePresence>
              {copied ? (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className='text-primary-strong'
                >
                  {t('copied')}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.p>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.85, ease: revealEase }}
          className='bg-card rounded-2xl border p-5'
        >
          <h2 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>{t('detailTitle')}</h2>

          <motion.ul
            variants={revealContainerVariants}
            initial='hidden'
            animate='show'
            transition={{ delayChildren: 0.95 }}
            className='mt-3 divide-y'
          >
            {data.invitations.map((invitation) => {
              const contractor = contractorOf(invitation.contractorId)
              return (
                <motion.li
                  variants={revealItemVariants}
                  key={invitation.id}
                  className='flex flex-wrap items-center gap-x-5 gap-y-2 py-3'
                >
                  {contractor ? (
                    <ContractorLogo contractor={contractor} className='size-10 shrink-0 rounded-lg' />
                  ) : null}

                  <span className='flex min-w-0 flex-1 items-center gap-1.5 font-medium'>
                    <span className='truncate'>{contractor?.name ?? invitation.contractorId}</span>
                    {contractor?.verified ? <BadgeCheck className='text-primary size-4 shrink-0' /> : null}
                  </span>

                  <motion.span
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
                    className='bg-primary/10 text-primary-strong inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium'
                  >
                    <CircleCheck className='size-3.5' />
                    {t('statusSent')}
                  </motion.span>

                  <span className='flex shrink-0 items-center gap-2 text-sm'>
                    <CalendarDays aria-hidden className='text-primary size-4' />
                    {formatDate(invitation.survey.date, locale, {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>

                  <span className='flex shrink-0 items-center gap-2 text-sm'>
                    <Clock aria-hidden className='text-primary size-4' />
                    {slotLabel(invitation.survey.slotId)}
                  </span>
                </motion.li>
              )
            })}
          </motion.ul>

          {/* Địa điểm và ghi chú nằm trong MỘT ô nền mờ, không phải hai cột trần
              ngăn bằng vạch — đúng ảnh S17. */}
          <dl className='bg-muted/40 mt-3 grid gap-4 rounded-xl p-4 sm:grid-cols-2'>
            <div className='flex items-start gap-2.5'>
              <MapPin aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
              <div className='min-w-0'>
                <dt className='text-muted-foreground text-xs'>{t('location')}</dt>
                <dd className='mt-0.5 text-sm font-medium text-pretty'>{brief ? fullAddress(brief) : ''}</dd>
              </div>
            </div>
            <div className='flex items-start gap-2.5'>
              <MessageSquare aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
              <div className='min-w-0'>
                <dt className='text-muted-foreground text-xs'>{t('note')}</dt>
                <dd className='text-muted-foreground mt-0.5 text-sm text-pretty'>
                  {data.invitations[0]?.survey.note || t('noNote')}
                </dd>
              </div>
            </div>
          </dl>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1, ease: revealEase }}
          className='bg-accent/40 flex flex-wrap items-start gap-4 rounded-2xl p-5'
        >
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className='bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-full'
          >
            <Headset className='size-6' />
          </motion.span>
          <div className='min-w-0 flex-1'>
            <h2 className='text-primary-strong font-semibold'>{t('supportTitle')}</h2>
            <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('supportBody')}</p>
            <p className='text-muted-foreground mt-2 flex items-center gap-2 text-sm'>
              <Clock aria-hidden className='size-4 shrink-0' />
              {t('supportTime')}
            </p>
            {/* Còn lượt mời → gợi ý mời thêm, hiện sau vài giây (mục 4). */}
            <AnimatePresence>
              {room > 0 && showMoreHint ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className='mt-2 text-sm'
                >
                  <Link
                    href={contractorMatchesRoute(projectId)}
                    className='text-primary-strong font-medium underline underline-offset-4'
                  >
                    {t('remainingInvites', { count: room })}
                  </Link>
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.1 }}
          className='flex flex-wrap justify-center gap-3'
        >
          <motion.span
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className='inline-block'
          >
            <Button asChild className='min-w-52'>
              <Link href={contractorInvitationsRoute(projectId)}>{t('track')}</Link>
            </Button>
          </motion.span>
          <Button asChild variant='outline' className='border-primary/50 text-primary-strong min-w-52'>
            <Link href={contractorMatchesRoute(projectId)}>{tCommon('backToList')}</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
          className='text-muted-foreground flex items-center justify-center gap-2 text-sm'
        >
          <Lock className='size-3.5' />
          {t('privacy')}
        </motion.p>
      </div>
    </div>
  )
}
