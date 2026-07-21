import { setRequestLocale, getTranslations } from 'next-intl/server'

import { AccountInfo, FavoriteGrid } from '@/features/account'
import { MyProjects } from '@/features/design'
import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'
import { AccountTabs } from './account-tabs'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/**
 * Màn hình 11 — Cửa sổ cá nhân (mục IV).
 * Ba khu vực: Thông tin tài khoản, Dự án của tôi, Dự án yêu thích.
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
            <AccountInfo />
          </div>

          <div className='min-w-0'>
            <AccountTabs
              projects={{
                label: t('projects.title'),
                description: t('projects.description'),
                content: <MyProjects />
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
