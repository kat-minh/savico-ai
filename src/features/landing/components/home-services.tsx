'use client'

import { useState } from 'react'
import { ArrowRight, HardHat, PencilRuler, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { revealEase, TurnkeyRequestDialog } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
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
 * Bố cục hai cột: bốn thẻ bên trái, bên phải là mẩu giấy nhớ viết tay + ảnh minh
 * hoạ (đang là ảnh TẠM, chờ ảnh khách gửi).
 *
 * ★ Thẻ hiện lần lượt; giấy nhớ "dán" vào (xoay + nảy) rồi chữ tay vẽ nét; ảnh
 * hiện dần. Rê thẻ: nhấc, viền sáng, nút đầy màu, lộ dòng "Dùng ở bước…" trong
 * khoảng đã chừa sẵn (thẻ không đổi kích thước). Rê giấy nhớ: lắc nhẹ.
 */
interface HomeServicesProps {
  ownedDesignRemaining?: number
}

export function HomeServices({ ownedDesignRemaining }: HomeServicesProps) {
  const t = useTranslations('landing.services')
  const illustration = useSiteImage('home.services')
  const [turnkeyOpen, setTurnkeyOpen] = useState(false)
  const [hovered, setHovered] = useState<HomeService | null>(null)
  const [noteReady, setNoteReady] = useState(false)

  return (
    <section id='home-services' className='bg-primary-strong text-primary-foreground relative isolate overflow-hidden'>
      {/* Ảnh minh hoạ TRÀN mép phải và cao hết dải (ảnh mockup), giấy nhớ ghim
          đè lên đầu ảnh. Đặt tuyệt đối chứ không phải một cột của lưới: trong
          ảnh nó vượt lên trên hàng thẻ và bị mép phải dải cắt ngang. */}
      <div aria-hidden className='pointer-events-none absolute inset-y-0 right-0 hidden w-[17rem] lg:block'>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: revealEase }}
          className='absolute inset-0'
        >
          <Image src={illustration} alt='' fill sizes='272px' className='object-contain object-right-bottom' />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: 18 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -6 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.3, ease: revealEase }}
          onAnimationComplete={() => setNoteReady(true)}
          className='absolute top-36 left-0'
        >
          <motion.div
            whileHover={{ rotate: [0, 2, -2, 1, 0] }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className='bg-brand-orange-soft text-foreground font-hand pointer-events-auto relative rounded-sm px-4 py-2 text-base leading-tight whitespace-pre-line shadow-lg'
          >
            <span className='bg-foreground/25 absolute top-1.5 left-2.5 size-1.5 rounded-full' />
            <span className='bg-foreground/25 absolute top-1.5 right-2.5 size-1.5 rounded-full' />
            {t('note')
              .split('\n')
              .map((line, index) => (
                <motion.span
                  key={line}
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: noteReady ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
                  transition={{ duration: 0.75, delay: 0.12 + index * 0.78, ease: revealEase }}
                  className='block'
                >
                  {line}
                </motion.span>
              ))}
          </motion.div>
        </motion.div>
      </div>

      <div className='relative mx-auto w-full max-w-[90rem] px-4 py-10 lg:px-8 lg:py-12'>
        <header className='flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
          <div className='space-y-2'>
            <p className='text-primary-foreground/70 text-xs font-semibold tracking-[0.16em] uppercase'>
              {t('eyebrow')}
            </p>
            <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
            <p className='text-primary-foreground/80 max-w-3xl text-sm'>{t('subtitle')}</p>
          </div>

          <Link
            href={ROUTES.PLANS}
            className='inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline'
          >
            {t('viewAll')}
            <ArrowRight className='size-4' />
          </Link>
        </header>

        {/* Chừa chỗ HẸP hơn bề ngang ảnh: thẻ cuối cố ý đè lên mép trái ảnh
            minh hoạ một chút, đúng như ảnh mockup. */}
        <div className='mt-8 lg:pr-[13rem]'>
          <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {HOME_SERVICES.map((service, index) => {
              const Icon = SERVICE_ICON[service]
              const isHovered = hovered === service
              const isOwned = service === 'design' && ownedDesignRemaining !== undefined

              return (
                <motion.li
                  key={service}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.65, delay: index * 0.12, ease: revealEase }}
                  onMouseEnter={() => setHovered(service)}
                  onMouseLeave={() => setHovered(null)}
                  id={`home-service-${service}`}
                  className={cn(
                    'bg-card text-card-foreground flex h-full flex-col gap-2 rounded-2xl border p-5 transition-[transform,box-shadow,border-color] duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none',
                    isHovered && 'border-primary/50 ring-primary/15 -translate-y-1 shadow-md ring-4'
                  )}
                >
                  <div className='flex items-center justify-between gap-2'>
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
                      không đổi chiều cao khi hiện/ẩn. */}
                  <div className='flex min-h-5 items-end'>
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
                  <div className='mt-auto pt-3'>
                    {isOwned ? (
                      <Button
                        asChild
                        variant={isHovered ? 'default' : 'outline'}
                        className='h-9 w-full rounded-lg text-xs transition-colors'
                      >
                        <Link href={ROUTES.DESIGN}>
                          {t('openPackage')}
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
