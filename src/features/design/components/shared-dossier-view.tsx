'use client'

import { Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { EmptyState, LoadingSpinner } from '@/shared/components/common'
import { Table, TableBody, TableCell, TableRow } from '@/shared/components/ui/table'
import { formatCurrency, formatDisplayDate, formatNumber } from '@/shared/utils'
import { designApi } from '../api/design.api'
import { designKeys } from '../api/design.keys'
import { COST_SECTIONS } from '../constants/design.constants'

/**
 * Xem bộ hồ sơ qua link chia sẻ — chỉ đọc, không cần đăng nhập (mục III.4c).
 *
 * Bản rút gọn: thông tin dự án + toàn bộ bảng dự toán 3 phần. Không hiện số
 * điện thoại hay thao tác chỉnh sửa; người xem muốn làm dự án riêng thì tự tạo.
 */
export function SharedDossierView({ token, share }: { token: string; share?: { shareId: string; token: string } }) {
  const t = useTranslations('design.share')
  const tEstimate = useTranslations('design.estimate')
  const locale = useLocale() as Locale

  const { data, isPending } = useQuery({
    queryKey: [...designKeys.all, 'share', share ? `${share.shareId}` : token],
    queryFn: () => (share ? designApi.getSharedEstimate(share.shareId, share.token) : designApi.getSharedDossier(token))
  })

  if (isPending) {
    return (
      <div className='flex justify-center py-24'>
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className='mx-auto w-full max-w-md px-4 py-24'>
        <EmptyState title={t('invalidTitle')} description={t('invalidDescription')} />
      </div>
    )
  }

  const ordered = COST_SECTIONS.map((key) => data.sections.find((section) => section.section === key)).filter(
    (section) => section !== undefined
  )

  return (
    <div className='mx-auto w-full max-w-3xl space-y-8 px-4 py-12 lg:px-8'>
      <header className='space-y-2'>
        <p className='text-muted-foreground text-xs tracking-widest uppercase'>{t('eyebrow')}</p>
        <h1 className='text-3xl font-semibold tracking-tight text-balance'>{data.projectName}</h1>
        <p className='text-muted-foreground text-sm'>
          {[data.address, data.createdAt ? formatDisplayDate(data.createdAt, locale) : ''].filter(Boolean).join(' · ')}
        </p>
      </header>

      <section className='bg-card overflow-hidden rounded-2xl border'>
        <div className='flex items-center justify-between gap-4 border-b p-5'>
          <div>
            <p className='text-muted-foreground text-xs font-medium'>{tEstimate('grandTotal')}</p>
            <p className='text-primary text-2xl font-semibold tabular-nums'>
              {formatCurrency(data.grandTotal, locale)}
            </p>
          </div>
          {data.estimatedFloorArea > 0 ? (
            <p className='text-muted-foreground text-sm'>
              {t('floorArea', { value: formatNumber(data.estimatedFloorArea, locale) })}
            </p>
          ) : null}
        </div>

        <Table>
          <TableBody>
            {ordered.map((section) => (
              <Fragment key={section.section}>
                <TableRow className='bg-muted/40'>
                  <TableCell className='py-3 pl-5 font-semibold'>{tEstimate(`sections.${section.section}`)}</TableCell>
                  <TableCell className='py-3 pr-5 text-right font-semibold tabular-nums'>
                    {formatCurrency(section.total, locale)}
                  </TableCell>
                </TableRow>
                {section.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='text-muted-foreground py-2.5 pl-8'>{item.label}</TableCell>
                    <TableCell className='py-2.5 pr-5 text-right tabular-nums'>
                      {formatCurrency(item.amount, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </section>

      <p className='text-muted-foreground text-xs'>{tEstimate('xlsx.note')}</p>
    </div>
  )
}
