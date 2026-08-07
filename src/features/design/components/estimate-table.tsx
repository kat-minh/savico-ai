'use client'

import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils'
import { COST_SECTIONS } from '../constants/design.constants'
import { useDownloadEstimate } from '../hooks/use-download-estimate'
import type { EstimateXlsxContext } from '../services/estimate-xlsx.service'
import type { CostSection, EstimateResult } from '../types/design.types'

interface EstimateTableProps {
  result: EstimateResult
  /** Tên dự án + địa chỉ in lên đầu file Excel. */
  context: EstimateXlsxContext
}

/**
 * Khối bảng dự toán (mục IV.5, Hình 08).
 *
 * Hàng trên: tiêu đề "Dự toán" bên trái, ô "Tổng dự toán" nền xanh nhạt bên phải.
 * Rồi 3 tab Phần thô / Phần hoàn thiện / Phần nội thất, bảng 2 cột
 * Hạng mục — Thành tiền, dòng tổng của tab, và hai lối tải Excel.
 * Thân bảng chỉ liệt kê hạng mục LỚN; hạng mục con nằm trong file Excel.
 */
export function EstimateTable({ result, context }: EstimateTableProps) {
  const t = useTranslations('design.estimate')
  const locale = useLocale() as Locale
  const [tab, setTab] = useState<CostSection>('structure')
  const { download, isPending } = useDownloadEstimate(result, context)

  const active = result.sections.find((section) => section.section === tab)

  return (
    <section className='bg-card rounded-2xl border p-5 sm:p-6'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <h2 className='text-xl font-semibold tracking-tight'>{t('title')}</h2>

        {/* Ô tổng luôn hiển thị, nhãn trên số dưới như Hình 08. */}
        <div className='bg-accent border-primary/30 rounded-xl border px-5 py-2.5 sm:text-right'>
          <p className='text-muted-foreground text-xs font-medium'>{t('grandTotal')}</p>
          <p className='text-primary-strong text-2xl font-bold tabular-nums'>
            {formatCurrency(result.grandTotal, locale)}
          </p>
        </div>
      </header>

      {/* Tab dạng nút chữ nhật kề nhau: tab đang chọn nền xanh đậm chữ trắng. */}
      <div role='tablist' aria-label={t('title')} className='mt-5 flex flex-wrap gap-1.5'>
        {COST_SECTIONS.map((section) => {
          const selected = section === tab
          return (
            <button
              key={section}
              type='button'
              role='tab'
              aria-selected={selected}
              onClick={() => setTab(section)}
              className={cn(
                'rounded-lg border px-5 py-2 text-sm font-medium transition-colors',
                selected
                  ? 'border-primary-strong bg-primary-strong text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              )}
            >
              {t(`sections.${section}`)}
            </button>
          )
        })}
      </div>

      <div className='mt-4 overflow-hidden rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='py-2.5 pl-4 text-xs font-semibold'>{t('columns.item')}</TableHead>
              <TableHead className='py-2.5 pr-4 text-right text-xs font-semibold'>{t('columns.amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='py-3 pl-4'>{item.label}</TableCell>
                <TableCell className='py-3 pr-4 text-right tabular-nums'>
                  {formatCurrency(item.amount, locale)}
                </TableCell>
              </TableRow>
            ))}
            {/* Dòng tổng nêu rõ đang tổng phần nào, nền xanh nhạt (Hình 08). */}
            <TableRow className='bg-accent hover:bg-accent'>
              <TableCell className='py-3 pr-2 text-right font-semibold'>
                {t('sectionTotal', { section: t(`sections.${tab}`).toLowerCase() })}
              </TableCell>
              <TableCell className='text-primary-strong py-3 pr-4 text-right font-bold tabular-nums'>
                {formatCurrency(active?.total ?? 0, locale)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Cả hai lối vào đều tải cùng một file Excel đầy đủ hạng mục con. */}
      <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-3'>
        <Button variant='outline' className='tracking-wide' onClick={download} disabled={isPending}>
          {isPending ? <Loader2 className='size-4 animate-spin' /> : null}
          {t('viewDetail')}
        </Button>

        <button
          type='button'
          onClick={download}
          disabled={isPending}
          className='text-primary hover:text-primary/80 flex items-center gap-2 text-sm underline-offset-4 transition-colors hover:underline disabled:opacity-60'
        >
          <FileSpreadsheet className='size-4' />
          {t('downloadXlsx')}
        </button>
      </div>
    </section>
  )
}
