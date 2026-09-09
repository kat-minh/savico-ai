'use client'

import { useState } from 'react'
import { ArrowRight, HardHat, PencilRuler, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { TurnkeyRequestDialog } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
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
 */
export function HomeServices() {
  const t = useTranslations('landing.services')
  const illustration = useSiteImage('home.services')
  const [turnkeyOpen, setTurnkeyOpen] = useState(false)

  return (
    <section className='bg-primary-strong text-primary-foreground relative isolate overflow-hidden'>
      {/* Ảnh minh hoạ TRÀN mép phải và cao hết dải (ảnh mockup), giấy nhớ ghim
          đè lên đầu ảnh. Đặt tuyệt đối chứ không phải một cột của lưới: trong
          ảnh nó vượt lên trên hàng thẻ và bị mép phải dải cắt ngang. */}
      <div aria-hidden className='pointer-events-none absolute inset-y-0 right-0 hidden w-[17rem] lg:block'>
        <Image src={illustration} alt='' fill sizes='272px' className='object-contain object-right-bottom' />
        <p className='bg-brand-orange-soft text-foreground font-hand absolute top-36 left-0 -rotate-6 rounded-sm px-4 py-2 text-base leading-tight whitespace-pre-line shadow-lg'>
          <span className='bg-foreground/25 absolute top-1.5 left-2.5 size-1.5 rounded-full' />
          <span className='bg-foreground/25 absolute top-1.5 right-2.5 size-1.5 rounded-full' />
          {t('note')}
        </p>
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
            {HOME_SERVICES.map((service) => {
              const Icon = SERVICE_ICON[service]
              return (
                <li
                  key={service}
                  className='bg-card text-card-foreground flex h-full flex-col gap-2 rounded-2xl border p-5'
                >
                  <Icon className='text-primary size-6' strokeWidth={1.75} />
                  <h3 className='text-sm leading-snug font-bold'>{t(`items.${service}.title`)}</h3>
                  <p className='text-muted-foreground text-xs leading-relaxed text-pretty'>
                    {t(`items.${service}.description`)}
                  </p>

                  {/* Nút chiếm TRỌN bề ngang thẻ, chữ căn giữa (ảnh mockup). */}
                  <div className='mt-auto pt-3'>
                    {service === 'turnkey' ? (
                      <Button
                        variant='outline'
                        className='h-9 w-full rounded-lg text-xs'
                        onClick={() => setTurnkeyOpen(true)}
                      >
                        {t(`items.${service}.action`)}
                        <ArrowRight className='size-3.5' />
                      </Button>
                    ) : (
                      <Button asChild variant='outline' className='h-9 w-full rounded-lg text-xs'>
                        <Link href={SERVICE_HREF[service]}>
                          {t(`items.${service}.action`)}
                          <ArrowRight className='size-3.5' />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <TurnkeyRequestDialog open={turnkeyOpen} onOpenChange={setTurnkeyOpen} />
    </section>
  )
}
