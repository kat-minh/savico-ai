'use client'

import { useTranslations } from 'next-intl'

import { HOME_BRANDS } from '../constants/landing.constants'

/**
 * Dải "SAVICO được tin tưởng bởi" — bảy thương hiệu vật liệu.
 *
 * Hiện dựng bằng CHỮ (wordmark) chứ không nhúng logo: file logo là tài sản của
 * bên thứ ba, phải do khách cung cấp bản được phép dùng. Tên nằm trong i18n nên
 * đổi danh sách không cần deploy; khi có file logo thì thay `<span>` bằng ảnh.
 */
export function HomeBrands() {
  const t = useTranslations('landing.brands')

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 lg:px-8'>
      <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('label')}</p>

      <ul className='bg-card mt-3 grid grid-cols-2 items-center gap-x-6 gap-y-4 rounded-2xl border px-6 py-5 sm:grid-cols-4 lg:grid-cols-7'>
        {HOME_BRANDS.map((brand) => (
          <li
            key={brand}
            className='text-muted-foreground text-center text-sm font-bold tracking-wide whitespace-nowrap uppercase'
          >
            {t(`items.${brand}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}
