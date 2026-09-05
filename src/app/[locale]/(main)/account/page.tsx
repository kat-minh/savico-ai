import { setRequestLocale, getTranslations } from 'next-intl/server'

import { FavoriteGrid } from '@/features/account'
import { MyProjects } from '@/features/design'
import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'
import { AccountSide } from './account-side'
import { AccountSupervision } from './account-supervision'
import { AccountTabs } from './account-tabs'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/**
 * Trang "Tài khoản của tôi" (mục IX, Hình 17–18; S24 của bản mô tả v1.1).
 * Bốn khu vực: hồ sơ + gói đang dùng, Giám sát của tôi, Dự án của tôi, Dự án
 * yêu thích.
 *
 * Bố cục hai cột: hồ sơ tài khoản là thẻ cố định bên trái (nội dung ngắn, ít
 * thay đổi); hai danh sách còn lại là hai tab của cột phải.
 *
 * Lớp app compose cả `features/account` và `features/design` — hai feature
 * không được import lẫn nhau.
 */
export default async function AccountPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <ProtectedRoute>
      {/* Cùng bề rộng với thanh công cụ và footer để mép trái thẳng hàng. */}
      <div className='mx-auto w-full max-w-6xl px-4 py-10 lg:px-8'>
        <header className='mb-8 space-y-2'>
          <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
        </header>

        <div className='grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]'>
          <div className='lg:sticky lg:top-24 lg:self-start'>
            {/* Thẻ hồ sơ + thẻ "GÓI CỦA TÔI" (mục IX, Hình 17). */}
            <AccountSide />
          </div>

          <div className='min-w-0'>
            <AccountTabs
              projects={{
                label: t('projects.title'),
                description: t('projects.description'),
                content: (
                  <>
                    {/* S24 — khối giám sát đặt TRÊN lưới dự án, và chỉ ở đây.
                        Bản mô tả vẽ nó hai lần trên cùng một màn (cột trái và
                        trong thẻ dự án) với gần như cùng một bộ số. */}
                    <AccountSupervision />
                    <MyProjects />
                  </>
                )
              }}
              favorites={{
                label: t('favorites.title'),
                description: t('favorites.description'),
                content: <FavoriteGrid />
              }}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
