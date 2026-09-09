import { setRequestLocale, getTranslations } from 'next-intl/server'

import { FavoriteGrid } from '@/features/account'
import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'
import { AccountProjects } from './account-projects'
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
      {/* Bề ngang lấy thẳng từ Hình S24: khung nội dung chiếm ~96% bề ngang cửa
          sổ, cột trái 340px, khoảng cách hai cột 32px — nên mỗi thẻ dự án rộng
          ~500px. Hẹp hơn thì dòng "Tiến độ 50% · Sớm hơn kế hoạch · bàn giao …"
          ở khối giám sát tràn xuống hai hàng, còn `max-w-6xl` của bản đầu thì
          tên dự án bị cắt cụt ngay từ thẻ đầu. */}
      <div className='mx-auto w-[96%] max-w-[88rem] py-10'>
        {/* Cột trái 340px: dòng "Tiến độ 6 giai đoạn: 50% · Giai đoạn 4/6 ·
            Còn 16 ngày" ở thẻ giám sát cần đủ chỗ để nằm gọn một dòng. */}
        <div className='grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]'>
          <div className='space-y-5 lg:sticky lg:top-24 lg:self-start'>
            {/* Cột trái ba thẻ theo Hình S24: hồ sơ → GÓI CỦA TÔI → GIÁM SÁT
                CỦA TÔI. */}
            <AccountSide />
            <AccountSupervision />
          </div>

          <div className='min-w-0'>
            {/* Tiêu đề nằm TRONG cột chính, không có dòng mô tả — Hình S24 để
                thẻ hồ sơ bên trái bắt đầu ngang hàng với tiêu đề. */}
            <h1 className='mb-5 text-3xl font-semibold tracking-tight'>{t('title')}</h1>

            <AccountTabs
              projects={{
                label: t('projects.title'),
                description: t('projects.description'),
                content: <AccountProjects />
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
