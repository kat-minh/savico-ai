'use client'

import { useState } from 'react'
import { ArrowRight, ChevronRight, HardHat, PencilRuler, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { revealEase, TurnkeyRequestDialog } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { useMediaQuery } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { HOME_SERVICES, type HomeService } from '../constants/landing.constants'

const SERVICE_ICON: Record<HomeService, LucideIcon> = {
  design: PencilRuler,
  contractors: Users,
  supervision: ShieldCheck,
  turnkey: HardHat
}

/**
 * Nút của từng thẻ dẫn đi đâu. `turnkey` KHÔNG có trang riêng — bản mô tả nói
 * "Đăng ký triển khai" là một form Ops gọi lại (S08), nên nó mở hộp thoại dùng
 * chung thay vì điều hướng.
 */
const SERVICE_HREF: Record<Exclude<HomeService, 'turnkey'>, string> = {
  design: ROUTES.PLANS,
  contractors: ROUTES.CONTRACTORS,
  supervision: ROUTES.PLANS_SUPERVISION
}

/**
 * Dải xanh "Gói dịch vụ SAVICO" — bốn gói, mỗi gói một việc rõ ràng.
 *
 * Bốn thẻ dàn một hàng (góp ý BuildX: bỏ ảnh minh hoạ + giấy nhớ bên phải).
 *
 * ★ Thẻ hiện lần lượt. Rê thẻ: nhấc, viền sáng, nút đầy màu, lộ dòng "Dùng ở
 * bước…" trong khoảng đã chừa sẵn (thẻ không đổi kích thước).
 */
interface HomeServicesProps {
  ownedDesignRemaining?: number
  /** Đã mua gói giám sát → nút thẻ Giám sát là "Mở gói" tới Tài khoản của tôi (góp ý BuildX). */
  ownsSupervision?: boolean
}

export function HomeServices({ ownedDesignRemaining, ownsSupervision = false }: HomeServicesProps) {
  const t = useTranslations('landing.services')
  const [turnkeyOpen, setTurnkeyOpen] = useState(false)
  const [hovered, setHovered] = useState<HomeService | null>(null)
  // Mobile cuộn ngang: thẻ kế tiếp chỉ LÓ một mép nên không đạt 40% diện tích → kẹt ở opacity 0
  // (thẻ trống) cho tới khi vuốt. `some` = chỉ cần thấy 1 pixel là hiện.
  const isMobile = useMediaQuery('(max-width: 639px)')
  const revealAmount = isMobile ? 'some' : 0.4

  return (
    <section id='home-services' className='bg-primary-strong text-primary-foreground relative isolate overflow-hidden'>
      <div className='relative mx-auto w-full max-w-[90rem] px-4 pt-5 pb-5 lg:px-8 lg:py-12'>
        <header className='flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
          <div className='space-y-2'>
            {/* Dưới `lg` khối đầu chỉ còn tiêu đề + mô tả: dòng nhãn ẩn, tiêu đề đổi thành
                "Gói dịch vụ BuildX" (`titleMobile`) thay cho nhãn. Từ `lg` giữ nguyên cả hai. */}
            <p className='text-primary-foreground/70 hidden text-xs font-semibold tracking-[0.16em] uppercase lg:block'>
              {t('eyebrow')}
            </p>
            <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>
              <span className='lg:hidden'>{t('titleMobile')}</span>
              <span className='hidden lg:inline'>{t('title')}</span>
            </h2>
            <p className='text-primary-foreground/80 max-w-3xl text-sm'>{t('subtitle')}</p>
          </div>

          {/* Dưới `lg` bỏ "Xem tất cả gói", thay bằng dòng "Tham khảo: Bảng giá" (Responsive case 11). */}
          <p className='text-primary-foreground/80 flex items-center gap-1.5 text-sm lg:hidden'>
            {t('referenceLabel')}
            <Link
              href={ROUTES.PLANS}
              className='text-primary-foreground inline-flex items-center gap-1 font-medium underline underline-offset-4'
            >
              {t('referenceLink')}
              <ChevronRight className='size-4' />
            </Link>
          </p>
          <Link
            href={ROUTES.PLANS}
            className='hidden items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline lg:inline-flex'
          >
            {t('viewAll')}
            <ArrowRight className='size-4' />
          </Link>
        </header>

        <div className='mt-8'>
          {/* Dưới `sm`: 4 thẻ thành MỘT HÀNG NGANG cuộn được. Từ `sm` lưới 2 cột, `lg` đủ 4 thẻ một hàng. */}
          <ul className='-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4'>
            {HOME_SERVICES.map((service, index) => {
              const Icon = SERVICE_ICON[service]
              const isHovered = hovered === service
              const isOwned = service === 'design' && ownedDesignRemaining !== undefined

              return (
                <motion.li
                  key={service}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: revealAmount }}
                  transition={{ duration: 0.65, delay: index * 0.12, ease: revealEase }}
                  onMouseEnter={() => setHovered(service)}
                  onMouseLeave={() => setHovered(null)}
                  id={`home-service-${service}`}
                  className={cn(
                    'bg-card text-card-foreground flex h-full w-[68%] shrink-0 snap-start flex-col gap-2 rounded-2xl border p-4 transition-[transform,box-shadow,border-color] sm:w-auto sm:shrink sm:p-5 duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none',
                    isHovered && 'border-primary/50 ring-primary/15 -translate-y-1 shadow-md ring-4'
                  )}
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <Icon className='text-primary size-6 shrink-0' strokeWidth={1.75} />
                    {isOwned ? (
                      <span className='bg-primary/10 text-primary rounded-full px-2 py-1 text-[11px] font-semibold whitespace-nowrap'>
                        {t('ownedLabel', { count: ownedDesignRemaining })}
                      </span>
                    ) : null}
                  </div>
                  <h3 className='text-sm leading-snug font-bold'>{t(`items.${service}.title`)}</h3>
                  <p className='text-muted-foreground text-xs leading-relaxed text-pretty'>
                    {t(`items.${service}.description`)}
                  </p>

                  {/* Dòng "Dùng ở bước…" nằm trong khoảng ĐÃ CHỪA SẴN — thẻ
                      không đổi chiều cao khi hiện/ẩn. Dưới `sm` (cảm ứng, không có rê chuột)
                      bỏ hẳn khoảng chừa này để thẻ không trống; đệm thẻ 16px, đệm trên nút 4px. */}
                  <div className='flex min-h-5 items-end max-sm:hidden'>
                    <span
                      className={cn(
                        'text-primary text-[11px] font-semibold transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                        isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                      )}
                    >
                      {t(`items.${service}.usedAtStep`)}
                    </span>
                  </div>

                  {/* Nút chiếm TRỌN bề ngang thẻ, chữ căn giữa (ảnh mockup);
                      rê thẻ thì nút đầy màu thay vì viền. */}
                  <div className='mt-auto pt-3 max-sm:pt-1'>
                    {isOwned ? (
                      <Button
                        asChild
                        variant={isHovered ? 'default' : 'outline'}
                        className='h-9 w-full rounded-lg text-xs transition-colors'
                      >
                        {/* Góp ý BuildX: nút đúng với nơi đến — "Xem gói thiết kế" mở Bảng giá. */}
                        <Link href={ROUTES.PLANS}>
                          {t('openPackage')}
                          <ArrowRight className='size-3.5' />
                        </Link>
                      </Button>
                    ) : service === 'supervision' && ownsSupervision ? (
                      <Button
                        asChild
                        variant={isHovered ? 'default' : 'outline'}
                        className='h-9 w-full rounded-lg text-xs transition-colors'
                      >
                        <Link href={ROUTES.ACCOUNT}>
                          {t('openSupervision')}
                          <ArrowRight className='size-3.5' />
                        </Link>
                      </Button>
                    ) : service === 'turnkey' ? (
                      <Button
                        variant={isHovered ? 'default' : 'outline'}
                        className='h-9 w-full rounded-lg text-xs transition-colors'
                        onClick={() => setTurnkeyOpen(true)}
                      >
                        {t(`items.${service}.action`)}
                        <ArrowRight className='size-3.5' />
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant={isHovered ? 'default' : 'outline'}
                        className='h-9 w-full rounded-lg text-xs transition-colors'
                      >
                        <Link href={SERVICE_HREF[service]}>
                          {t(`items.${service}.action`)}
                          <ArrowRight className='size-3.5' />
                        </Link>
                      </Button>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>

      <TurnkeyRequestDialog open={turnkeyOpen} onOpenChange={setTurnkeyOpen} />
    </section>
  )
}
