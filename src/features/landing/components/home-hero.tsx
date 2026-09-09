'use client'

import Image from 'next/image'
import { ArrowRight, Play, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { HERO_CARD_ROWS } from '../constants/landing.constants'

/**
 * Khối hero trang chủ (mục II.2, dựng theo ảnh mockup khách gửi).
 *
 * Dải ảnh TRÀN HẾT bề ngang màn hình, không viền không bo góc — chữ và thẻ "Hồ
 * sơ dự án" nằm đè lên ảnh. Dải 5 con số là thẻ trắng RIÊNG bên dưới
 * (`HomeStats`), không dùng chung khung với ảnh.
 *
 * Lưới BA cột (chữ · thẻ · khoảng trống) chứ không phải hai: cột trống bên phải
 * là chỗ để công trình trong ảnh lộ ra — đẩy thẻ sát mép phải là che mất đúng
 * phần đáng nhìn nhất của tấm ảnh.
 */
export function HomeHero({ onCreateProject }: { onCreateProject?: () => void }) {
  const t = useTranslations('landing.hero')
  // Chữ hero admin sửa được qua kho `uiStrings` (phủ thẳng lên i18n), nên ở đây
  // chỉ cần `t` — không còn tài liệu `home` song song để lệch nhau nữa.
  const background = useSiteImage('home.hero')

  return (
    <section className='relative isolate overflow-hidden'>
      <div aria-hidden className='absolute inset-0 -z-10'>
        <Image src={background} alt='' fill priority sizes='100vw' className='object-cover object-center' />
        {/* CHỈ phủ theo chiều ngang — đặc bên trái cho cột chữ, tan dần sang
            phải. Trước đây có thêm lớp phủ dọc làm mép dưới ảnh chìm vào nền
            trang; mất mép thì thẻ số liệu chẳng còn đường viền nào để nằm đè
            lên, nên bỏ. */}
        <div className='from-background via-background/85 absolute inset-0 bg-gradient-to-r to-transparent' />
      </div>

      {/* Dòng ghi chú viết tay góc phải trên (ảnh mockup). Ẩn dưới lg: chỗ đó
          không còn ảnh để chú thích, chen vào chỉ làm chật cột chữ. */}
      <p className='font-hand text-primary pointer-events-none absolute top-10 right-10 hidden max-w-[17rem] -rotate-4 text-center text-xl leading-snug text-balance lg:block xl:right-20 xl:text-[1.375rem]'>
        {t('note')}
      </p>

      <div className='mx-auto grid w-full max-w-[90rem] items-center gap-8 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_14rem_minmax(0,0.65fr)] lg:gap-10 lg:px-8 lg:py-20'>
        <div className='space-y-4'>
          <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('eyebrow')}</p>

          <h1 className='text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.4rem]'>
            {t('titleLead')}
            <br />
            <span className='text-primary-strong'>{t('titleAccent')}</span>
          </h1>

          {/* Chỗ xuống dòng nằm TRONG câu chữ (ký tự xuống dòng trong
              `messages/*.json`) và `whitespace-pre-line` tôn trọng nó: mô tả
              ngắt hết câu rồi mới xuống dòng, đúng như ảnh mockup, thay vì
              phó mặc trình duyệt ngắt giữa câu. */}
          <p className='text-muted-foreground max-w-[38rem] whitespace-pre-line'>{t('subtitle')}</p>

          <div className='flex flex-col gap-3 pt-1 sm:flex-row'>
            <Button
              className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'
              onClick={onCreateProject}
            >
              {t('primaryCta')}
              <ArrowRight className='size-4' />
            </Button>
            <Button asChild variant='outline' className='bg-card/85 h-11 rounded-full px-8 text-base has-[>svg]:px-8'>
              <Link href={ROUTES.GUIDE}>
                <Play className='size-4' />
                {t('secondaryCta')}
              </Link>
            </Button>
          </div>
        </div>

        <HeroDossierCard />
      </div>
    </section>
  )
}

/**
 * Thẻ "Hồ sơ dự án" nổi trên ảnh hero — bản rút gọn của khối Thông tin dự án ở
 * Bước 3 (mục III.4). Số liệu là ví dụ minh họa, không phải dự án thật, nên dòng
 * tổng cộng dẫn người xem vào hồ sơ mẫu thay vì nêu một con số tiền.
 */
function HeroDossierCard() {
  const t = useTranslations('landing.hero.card')

  return (
    <div className='bg-card/95 w-full space-y-2.5 rounded-2xl border p-3 shadow-lg backdrop-blur-sm lg:mt-10 lg:-translate-x-14'>
      <p className='flex items-center gap-2 text-xs font-semibold'>
        <Star className='fill-warning text-warning size-3.5' />
        {t('title')}
      </p>

      <dl className='space-y-1.5 text-xs'>
        {HERO_CARD_ROWS.map((row) => (
          <div key={row} className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>{t(`rows.${row}.label`)}</dt>
            <dd className='font-medium'>{t(`rows.${row}.value`)}</dd>
          </div>
        ))}
      </dl>

      <div className='flex items-center justify-between gap-4 border-t pt-2 text-xs'>
        <span className='font-semibold'>{t('totalLabel')}</span>
        <span className='text-primary font-semibold'>{t('totalValue')}</span>
      </div>

      <Button asChild className='brand-green-button h-8.5 w-full rounded-lg text-xs'>
        <Link href={ROUTES.HANDBOOK}>{t('cta')}</Link>
      </Button>
    </div>
  )
}
