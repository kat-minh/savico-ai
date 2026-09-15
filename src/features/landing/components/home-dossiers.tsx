'use client'

import { ArrowRight, Files, Layers, Ruler } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { revealEase, RevealPhoto } from '@/shared/components/common'
import { useScrollSnapIndex } from '@/shared/hooks'
import { type SiteImageKey } from '@/shared/lib/imagery'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { HOME_DOSSIERS, type HomeDossier } from '../constants/landing.constants'

/** Khóa ảnh của từng thẻ — admin thay từng ảnh ở màn "Hình ảnh site". */
const DOSSIER_IMAGE: Record<HomeDossier, SiteImageKey> = {
  townhouse: 'home.dossierTownhouse',
  villa: 'home.dossierVilla',
  resort: 'home.dossierResort',
  garden: 'home.dossierGarden'
}

/**
 * Dải "Hồ sơ mẫu" — bốn hồ sơ thiết kế & dự toán mẫu để khách hình dung thứ
 * mình sẽ nhận, trước khi phải tạo dự án.
 *
 * Số liệu trên thẻ (diện tích · số tầng · số phương án) là chữ trong i18n chứ
 * không phải dữ liệu tính ra: đây là hồ sơ MẪU do admin biên soạn, chưa gắn với
 * dự án thật nào.
 *
 * ★ Thẻ hiện lần lượt; ảnh mờ→nét (khung chờ có vệt sáng), nhãn loại nhà trượt
 * vào từ trái, thông số hiện từng mục; rê thẻ thì nhấc + phóng ảnh nhẹ. Thẻ
 * đầu mang `id="home-dossier-0"` — đích của nút "Xem hồ sơ mẫu" ở hero. Mobile
 * cuộn ngang có điểm dừng + chấm chỉ vị trí.
 */
export function HomeDossiers() {
  const t = useTranslations('landing.dossiers')
  const { ref: trackRef, active, scrollTo } = useScrollSnapIndex<HTMLUListElement>()

  return (
    <section id='home-dossiers' className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8 lg:py-16'>
      <header className='flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('eyebrow')}</p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
        </div>

        <Link
          href={ROUTES.HANDBOOK}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          {t('viewAll')}
          <ArrowRight className='size-4' />
        </Link>
      </header>

      <ul
        ref={trackRef}
        className='mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4'
      >
        {HOME_DOSSIERS.map((dossier, index) => (
          <DossierCard key={dossier} dossier={dossier} index={index} />
        ))}
      </ul>

      {/* Chấm chỉ vị trí — chỉ có ý nghĩa trên mobile (cuộn ngang, lộ mép thẻ kế). */}
      <div className='mt-4 flex items-center justify-center gap-2 sm:hidden'>
        {HOME_DOSSIERS.map((dossier, index) => (
          <button
            key={dossier}
            type='button'
            aria-label={t(`items.${dossier}.title`)}
            onClick={() => scrollTo(index)}
            className={cn('size-1.5 rounded-full transition-colors', index === active ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </div>
    </section>
  )
}

function DossierCard({ dossier, index }: { dossier: HomeDossier; index: number }) {
  const t = useTranslations('landing.dossiers')
  const cover = useSiteImage(DOSSIER_IMAGE[dossier])

  const facts = [
    { key: 'area', Icon: Ruler },
    { key: 'floors', Icon: Layers },
    { key: 'options', Icon: Files }
  ] as const

  return (
    <motion.li
      id={index === 0 ? 'home-dossier-0' : undefined}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.65, delay: index * 0.12, ease: revealEase }}
      className='bg-card group w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border transition-[box-shadow,transform] duration-500 ease-out hover:-translate-y-0.5 hover:shadow-lg sm:w-auto sm:shrink'
    >
      <Link href={ROUTES.HANDBOOK} className='flex h-full flex-col'>
        <div className='relative aspect-[4/3] w-full'>
          <RevealPhoto className='size-full' src={cover} alt='' />
          {/* Nhãn loại công trình trượt vào từ mép trái, đúng sau khi ảnh bắt
              đầu hiện. */}
          <motion.span
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.1 + 0.25, ease: revealEase }}
            className='bg-brand-orange text-brand-orange-foreground absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-semibold'
          >
            {t(`items.${dossier}.badge`)}
          </motion.span>
        </div>

        <div className='flex flex-1 flex-col gap-2 p-4'>
          <h3 className='font-bold'>{t(`items.${dossier}.title`)}</h3>

          <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
            {facts.map(({ key, Icon }, factIndex) => (
              /* Vạch ngăn dọc giữa các thông số (ảnh mockup) — ô đầu không có;
                 mỗi mục hiện lần lượt sau nhãn loại công trình. */
              <motion.li
                key={key}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.35 + factIndex * 0.08 }}
                className='flex items-center gap-1.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-4'
              >
                <Icon className='text-primary/70 size-3.5' />
                {t(`items.${dossier}.${key}`)}
              </motion.li>
            ))}
          </ul>

          <span className='text-primary mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium group-hover:underline'>
            {t('viewOne')}
            <ArrowRight className='size-3.5' />
          </span>
        </div>
      </Link>
    </motion.li>
  )
}
