'use client'

import { ArrowRight, Files, Layers, Ruler } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { type SiteImageKey } from '@/shared/lib/imagery'
import { ROUTES } from '@/shared/constants/routes'
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
 */
export function HomeDossiers() {
  const t = useTranslations('landing.dossiers')

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8 lg:py-16'>
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

      <ul className='mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        {HOME_DOSSIERS.map((dossier) => (
          <DossierCard key={dossier} dossier={dossier} />
        ))}
      </ul>
    </section>
  )
}

function DossierCard({ dossier }: { dossier: HomeDossier }) {
  const t = useTranslations('landing.dossiers')
  const cover = useSiteImage(DOSSIER_IMAGE[dossier])

  const facts = [
    { key: 'area', Icon: Ruler },
    { key: 'floors', Icon: Layers },
    { key: 'options', Icon: Files }
  ] as const

  return (
    <li className='bg-card group flex flex-col overflow-hidden rounded-2xl border'>
      <div className='relative aspect-[4/3] w-full'>
        <Image src={cover} alt='' fill sizes='(max-width: 1024px) 50vw, 320px' className='object-cover' />
        {/* Nhãn loại công trình tô CAM, nằm trong ảnh (ảnh mockup). */}
        <span className='bg-brand-orange text-brand-orange-foreground absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-semibold'>
          {t(`items.${dossier}.badge`)}
        </span>
      </div>

      <div className='flex flex-1 flex-col gap-2 p-4'>
        <h3 className='font-bold'>{t(`items.${dossier}.title`)}</h3>

        <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
          {facts.map(({ key, Icon }) => (
            /* Vạch ngăn dọc giữa các thông số (ảnh mockup) — ô đầu không có. */
            <li
              key={key}
              className='flex items-center gap-1.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-4'
            >
              <Icon className='text-primary/70 size-3.5' />
              {t(`items.${dossier}.${key}`)}
            </li>
          ))}
        </ul>

        <Link
          href={ROUTES.HANDBOOK}
          className='text-primary mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium hover:underline'
        >
          {t('viewOne')}
          <ArrowRight className='size-3.5' />
        </Link>
      </div>
    </li>
  )
}
