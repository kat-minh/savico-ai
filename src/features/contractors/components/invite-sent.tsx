'use client'

import { CalendarCheck, Headset, Lock, MapPin, MessageSquare, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorInvitationsRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { formatDate } from '@/shared/utils'
import { SURVEY_SLOTS } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useSurveyRequest } from '../hooks/use-invitations'
import { fullAddress } from '../services/brief.service'

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
 * Khối "Chi tiết yêu cầu" liệt kê TẤT CẢ nhà thầu của lượt mời này (≤ 3, R1) —
 * mời ba nhà thầu thì đây là ba dòng, không phải ba màn xác nhận rời nhau.
 *
 * Sau màn này mọi việc diễn ra ngoài web (R3), nên dòng cuối nói thẳng điều đó
 * thay vì để người dùng ngồi đợi một thông báo không bao giờ tới.
 */
export function InviteSent({ projectId, requestId }: InviteSentProps) {
  const t = useTranslations('contractors.sent')
  const locale = useLocale() as Locale

  const { data: brief } = useBrief(projectId)
  const { data: contractors } = useContractors(projectId)
  const { data, isPending } = useSurveyRequest(requestId)

  if (isPending || !data) {
    return (
      <div className='mx-auto w-full max-w-3xl px-4 py-12 lg:px-8'>
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  const nameOf = (contractorId: string) => contractors?.find((c) => c.id === contractorId)?.name ?? contractorId

  const names = data.invitations.map((invitation) => nameOf(invitation.contractorId)).join(', ')

  return (
    <div className='mx-auto w-full max-w-3xl space-y-6 px-4 py-12 lg:px-8'>
      <header className='space-y-3 text-center'>
        <span className='bg-accent text-primary mx-auto flex size-16 items-center justify-center rounded-full'>
          <Send className='size-7' />
        </span>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle', { names })}</p>
        <p className='text-muted-foreground text-xs'>
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
        </p>
      </header>

      <section className='bg-card rounded-2xl border p-5'>
        <h2 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>{t('detailTitle')}</h2>

        <ul className='mt-3 divide-y'>
          {data.invitations.map((invitation) => (
            <li key={invitation.id} className='flex flex-wrap items-center gap-x-4 gap-y-2 py-3'>
              <span className='min-w-0 flex-1 font-medium'>{nameOf(invitation.contractorId)}</span>
              <span className='bg-accent text-primary-strong inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs'>
                <CalendarCheck className='size-3.5' />
                {formatDate(invitation.survey.date, locale, { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </span>
              <span className='text-muted-foreground text-xs'>{slotLabel(invitation.survey.slotId)}</span>
            </li>
          ))}
        </ul>

        <dl className='mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2'>
          <div className='flex items-start gap-2.5'>
            <MapPin className='text-primary mt-0.5 size-4 shrink-0' />
            <div>
              <dt className='text-muted-foreground text-xs'>{t('location')}</dt>
              <dd className='text-sm'>{brief ? fullAddress(brief) : ''}</dd>
            </div>
          </div>
          <div className='flex items-start gap-2.5'>
            <MessageSquare className='text-primary mt-0.5 size-4 shrink-0' />
            <div>
              <dt className='text-muted-foreground text-xs'>{t('note')}</dt>
              <dd className='text-sm'>{data.invitations[0]?.survey.note || t('noNote')}</dd>
            </div>
          </div>
        </dl>
      </section>

      <section className='bg-accent/40 flex flex-wrap items-start gap-4 rounded-2xl border p-5'>
        <span className='bg-card text-primary flex size-11 shrink-0 items-center justify-center rounded-full'>
          <Headset className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='font-semibold'>{t('supportTitle')}</h2>
          <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('supportBody')}</p>
          <p className='text-muted-foreground mt-2 text-xs'>{t('supportTime')}</p>
        </div>
      </section>

      <div className='flex flex-wrap justify-center gap-3'>
        <Button asChild>
          <Link href={contractorInvitationsRoute(projectId)}>{t('track')}</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href={contractorMatchesRoute(projectId)}>{t('backToList')}</Link>
        </Button>
      </div>

      <div className='text-muted-foreground space-y-1.5 text-center text-xs'>
        <p className='flex items-center justify-center gap-2'>
          <Lock className='size-3.5' />
          {t('privacy')}
        </p>
        <p className='text-pretty'>{t('afterNote')}</p>
      </div>
    </div>
  )
}
