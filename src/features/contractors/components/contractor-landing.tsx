'use client'

import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileLock2,
  Gift,
  Handshake,
  HardHat,
  Info,
  MapPin,
  Ruler,
  Scale,
  ShieldCheck,
  Star,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import { useAuth, useAuthDialogStore } from '@/shared/auth'
import { useSiteImage } from '@/shared/cms'
import { Photo } from '@/shared/components/common'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { CONTRACTOR_SORTS } from '../constants/contractors.constants'
import { CONTRACTORS_SEED } from '../api/contractors.seed'
import { useCreateBrief } from '../hooks/use-brief'
import { filterContractors } from '../services/contractor-list.service'
import type { ContractorSort } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { ContractorStats } from './contractor-stats'

/** Một dòng trong khối "Tìm đúng người theo đúng tiêu chí". */
interface CriterionItem {
  key: 'area' | 'type' | 'scale' | 'experience' | 'rating' | 'schedule'
  icon: typeof MapPin
  hint?: string
}

/**
 * Landing "Tìm nhà thầu" (S09) — trang công khai, khách chưa đăng nhập cũng xem
 * được.
 *
 * Nội dung theo bản mô tả: hero → 4 cam kết → tiêu chí ghép → danh sách xếp hạng
 * 4 tab → so sánh minh bạch → an toàn & minh bạch → ranh giới dịch vụ → FAQ →
 * CTA → dải đối tác.
 *
 * Hai chỗ bám sát QUY TẮC chứ không bám ảnh demo:
 * - R1: câu trả lời FAQ nói rõ tối đa 3 nhà thầu, không phải "gửi càng nhiều
 *   càng dễ so sánh".
 * - R2/R3: khối "So sánh minh bạch" chỉ đối chiếu NĂNG LỰC, và có một dòng dẫn
 *   nói thẳng báo giá đến từ nhà thầu sau khảo sát, không nằm trên web.
 */
export function ContractorLanding() {
  const t = useTranslations('contractors.landing')
  const tSort = useTranslations('contractors.sort')
  const tCommon = useTranslations('contractors.common')
  const tCriteria = useTranslations('contractors.compare.criteria')

  const { isAuthenticated } = useAuth()
  const openAuthDialog = useAuthDialogStore((s) => s.open)
  const createBrief = useCreateBrief()

  const [sort, setSort] = useState<ContractorSort>('match')

  // Ảnh nền hero lấy từ kho ảnh site nên admin thay được ở màn "Hình ảnh site".
  const mapImage = useSiteImage('map.contractors')
  const featured = CONTRACTORS_SEED[0]
  const ranked = filterContractors(CONTRACTORS_SEED, { radiusKm: 50, sort }).slice(0, 3)

  /** "Tạo hồ sơ" cần tài khoản: chưa đăng nhập thì mở popup đăng nhập trước. */
  const startBrief = () => {
    if (!isAuthenticated) {
      // Đăng nhập xong thì chạy tiếp đúng việc người dùng đang định làm, không
      // bắt họ bấm lại "Tạo hồ sơ" lần nữa.
      openAuthDialog('login', () => createBrief.mutate())
      return
    }
    createBrief.mutate()
  }

  return (
    <div className='space-y-16 pb-16'>
      {/* Hero */}
      <section className='bg-accent/30 border-b'>
        <div className='mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-2 lg:px-8'>
          <div className='space-y-5'>
            <h1 className='text-primary-strong text-4xl leading-tight font-bold tracking-tight text-balance sm:text-[2.75rem]'>
              {t('hero.title')}
            </h1>
            <p className='text-muted-foreground max-w-lg text-lg text-pretty'>{t('hero.subtitle')}</p>
            {/* Hình S09: hai nút cao ~56px, nút phụ nền trắng viền xanh. */}
            <div className='flex flex-wrap gap-4 pt-1'>
              <Button size='lg' className='h-14 px-8 text-base' onClick={startBrief} disabled={createBrief.isPending}>
                {t('hero.createBrief')}
                <ArrowRight className='size-4' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-primary text-primary-strong h-14 px-8 text-base'
                onClick={startBrief}
                disabled={createBrief.isPending}
              >
                {t('hero.viewContractors')}
              </Button>
            </div>
          </div>

          {/* Hình S09: ảnh khu dân cư nhìn từ trên cao làm nền, một thẻ nhà thầu
              nổi lên trên. Là ẢNH TĨNH, không phải bản đồ tương tác — bản mô tả
              không yêu cầu chọn vị trí trên bản đồ, chỉ minh hoạ "gần công trình". */}
          <div className='relative'>
            <Photo
              src={mapImage}
              alt=''
              priority
              sizes='(max-width: 1024px) 100vw, 620px'
              className='aspect-4/3 w-full rounded-3xl border'
            />

            {featured ? (
              <div className='bg-card absolute right-4 bottom-4 left-4 rounded-2xl border p-4 shadow-lg sm:right-6 sm:left-auto sm:w-80'>
                <div className='flex items-center gap-3'>
                  <ContractorLogo contractor={featured} />
                  <div className='min-w-0 flex-1'>
                    <p className='flex items-center gap-1.5 truncate font-semibold'>
                      {featured.name}
                      <BadgeCheck className='text-primary size-4 shrink-0' />
                    </p>
                    <span className='bg-brand-orange text-brand-orange-foreground mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold'>
                      <Star className='size-3' />
                      {t('hero.bestMatch')}
                    </span>
                  </div>
                </div>
                <ContractorStats contractor={featured} className='mt-3' />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 4 cam kết */}
      <section className='mx-auto w-full max-w-6xl px-4 lg:px-8'>
        <ul className='bg-card grid gap-4 rounded-2xl border p-5 sm:grid-cols-2 lg:grid-cols-4'>
          {(
            [
              { key: 'free', icon: Gift },
              { key: 'verified', icon: ShieldCheck },
              { key: 'transparent', icon: Scale },
              { key: 'privacy', icon: FileLock2 }
            ] as const
          ).map((item) => (
            <li key={item.key} className='flex items-center gap-3'>
              <span className='bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-xl'>
                <item.icon className='size-5' />
              </span>
              <span className='text-sm font-medium text-pretty'>{t(`promises.${item.key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tiêu chí + danh sách xếp hạng */}
      <section className='mx-auto w-full max-w-6xl px-4 lg:px-8'>
        <div className='grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]'>
          <div>
            <h2 className='text-primary-strong text-lg font-bold tracking-wide uppercase'>{t('criteria.title')}</h2>
            <ul className='mt-4 space-y-2'>
              {(
                [
                  { key: 'area', icon: MapPin },
                  { key: 'type', icon: HardHat, hint: t('criteria.typeHint') },
                  { key: 'scale', icon: Ruler },
                  { key: 'experience', icon: ClipboardList },
                  { key: 'rating', icon: Star },
                  { key: 'schedule', icon: CalendarClock }
                ] as const
              ).map((item: CriterionItem) => (
                <li key={item.key} className='bg-card flex items-start gap-3 rounded-xl border px-3.5 py-3'>
                  <item.icon className='text-primary mt-0.5 size-4 shrink-0' />
                  <span className='min-w-0 flex-1 text-sm'>
                    {t(`criteria.${item.key}`)}
                    {item.hint ? <span className='text-muted-foreground block text-xs'>{item.hint}</span> : null}
                  </span>
                  <ChevronRight aria-hidden className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                </li>
              ))}
            </ul>
          </div>

          <div className='bg-card min-w-0 rounded-2xl border p-5'>
            <h2 className='text-lg font-semibold tracking-tight'>{t('ranking.title')}</h2>

            <div className='mt-3 flex flex-wrap gap-6 border-b'>
              {CONTRACTOR_SORTS.map((key) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => setSort(key)}
                  aria-pressed={key === sort}
                  className={cn(
                    '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors',
                    key === sort
                      ? 'border-primary text-primary-strong'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {tSort(key)}
                </button>
              ))}
            </div>

            <ul className='mt-4 divide-y'>
              {ranked.map((contractor) => (
                <li key={contractor.id} className='flex flex-wrap items-center gap-4 py-3.5'>
                  <ContractorLogo contractor={contractor} className='size-11' />
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium'>{contractor.name}</p>
                    <ContractorStats contractor={contractor} dense className='mt-1' />
                  </div>
                  <Button size='sm' variant='outline' onClick={startBrief}>
                    {t('ranking.choose')}
                  </Button>
                </li>
              ))}
            </ul>

            <p className='text-muted-foreground mt-3 flex items-start gap-2 text-xs'>
              <Info className='mt-0.5 size-3.5 shrink-0' />
              <span className='text-pretty'>{t('ranking.note')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* So sánh minh bạch — chỉ năng lực, không giá (R2). */}
      <section className='mx-auto w-full max-w-6xl px-4 lg:px-8'>
        <h2 className='text-center text-lg font-semibold tracking-tight'>{t('compare.title')}</h2>
        <p className='text-muted-foreground mx-auto mt-2 max-w-2xl text-center text-sm text-pretty'>
          {t('compare.lead')}
        </p>

        <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
          <table className='w-full min-w-[560px] border-collapse text-sm'>
            <thead>
              <tr className='bg-muted/40'>
                <th className='border-b p-3.5 text-left font-medium'>{t('compare.criterion')}</th>
                {CONTRACTORS_SEED.slice(0, 3).map((contractor) => (
                  <th key={contractor.id} className='border-b p-3.5 text-center font-medium'>
                    {contractor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['rating', 'similarProjects', 'surveyTime', 'warranty'] as const).map((row) => (
                <tr key={row} className='even:bg-muted/20'>
                  <th className='p-3.5 text-left text-xs font-medium'>{tCriteria(row)}</th>
                  {CONTRACTORS_SEED.slice(0, 3).map((contractor) => (
                    <td key={contractor.id} className='p-3.5 text-center text-xs'>
                      {row === 'rating' ? `${contractor.rating}/5` : null}
                      {row === 'similarProjects' ? contractor.similarProjects : null}
                      {row === 'surveyTime' ? tCommon('surveyWithin', { hours: contractor.surveyWithinHours }) : null}
                      {row === 'warranty' ? `${contractor.warrantyMonths}` : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className='text-muted-foreground mt-3 text-center text-xs'>{t('compare.note')}</p>
      </section>

      {/* An toàn & minh bạch */}
      <section className='mx-auto w-full max-w-6xl px-4 lg:px-8'>
        <h2 className='text-center text-lg font-semibold tracking-tight'>{t('safety.title')}</h2>
        <ul className='mt-5 grid gap-4 md:grid-cols-3'>
          {(
            [
              { key: 'privacy', icon: FileLock2 },
              { key: 'record', icon: ClipboardList },
              { key: 'review', icon: Star }
            ] as const
          ).map((item) => (
            <li key={item.key} className='bg-card rounded-2xl border p-5'>
              <span className='bg-accent text-primary flex size-11 items-center justify-center rounded-xl'>
                <item.icon className='size-5' />
              </span>
              <h3 className='mt-3 font-semibold'>{t(`safety.${item.key}Title`)}</h3>
              <p className='text-muted-foreground mt-1.5 text-sm text-pretty'>{t(`safety.${item.key}Body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Ranh giới dịch vụ */}
      <section className='mx-auto w-full max-w-6xl px-4 lg:px-8'>
        <h2 className='text-center text-lg font-semibold tracking-tight'>{t('boundary.title')}</h2>
        <div className='mt-5 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]'>
          <div className='bg-accent/40 rounded-2xl border p-5'>
            <h3 className='font-semibold'>{t('boundary.designTitle')}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>{t('boundary.designBody')}</p>
          </div>
          <p className='text-muted-foreground text-center text-xs font-medium'>{t('boundary.arrow')}</p>
          <div className='bg-warning/10 rounded-2xl border p-5'>
            <h3 className='font-semibold'>{t('boundary.findTitle')}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>{t('boundary.findBody')}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className='mx-auto w-full max-w-3xl px-4 lg:px-8'>
        <h2 className='text-center text-lg font-semibold tracking-tight'>{t('faq.title')}</h2>
        <Accordion type='single' collapsible className='mt-4'>
          {([1, 2, 3, 4, 5] as const).map((index) => (
            <AccordionItem key={index} value={`q${index}`}>
              <AccordionTrigger className='text-left'>{t(`faq.q${index}`)}</AccordionTrigger>
              <AccordionContent className='text-muted-foreground text-pretty'>{t(`faq.a${index}`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA + dải đối tác */}
      <section className='mx-auto w-full max-w-6xl space-y-3 px-4 lg:px-8'>
        <div className='bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5'>
          <p className='font-medium text-pretty'>{t('cta.title')}</p>
          <Button variant='secondary' onClick={startBrief} disabled={createBrief.isPending}>
            {t('cta.action')}
          </Button>
        </div>

        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed px-6 py-4 text-sm'>
          <span className='inline-flex items-center gap-2'>
            <Handshake className='text-primary size-4' />
            {t('partner.text')}
          </span>
          <Link href={ROUTES.CONSULT} className='text-primary inline-flex items-center gap-1.5 font-medium'>
            {t('partner.action')}
            <ArrowRight className='size-3.5' />
          </Link>
        </div>
      </section>

      <p className='text-muted-foreground flex items-center justify-center gap-2 text-xs'>
        <Users className='size-3.5' />
        {tCommon('noPriceNote')}
      </p>
    </div>
  )
}
