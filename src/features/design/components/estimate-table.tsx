'use client'

import { Download, FileSpreadsheet, Loader2, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/shared/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
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
 * Khối bảng dự toán (mục III.3b, khối 1).
 *
 * Hàng trên cùng: tiêu đề + ô "Tổng dự toán" (tổng cả 3 phần, luôn hiển thị).
 * Hàng tab: Phần thô - Phần hoàn thiện - Phần nội thất.
 * Thân bảng chỉ liệt kê hạng mục LỚN; chi tiết hạng mục con nằm trong file Excel.
 */
export function EstimateTable({ result, context }: EstimateTableProps) {
  const t = useTranslations('design.estimate')
  const locale = useLocale() as Locale
  const [tab, setTab] = useState<CostSection>('structure')
  const { download, isPending } = useDownloadEstimate(result, context)

  const active = result.sections.find((section) => section.section === tab)

  return (
    <section className='bg-card overflow-hidden rounded-2xl border p-5 sm:p-6'>
      {/* Hàng trên cùng: tiêu đề + ô "Tổng dự toán" luôn hiển thị (mục III.3b). */}
      <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <span className='bg-accent text-primary flex size-11 shrink-0 items-center justify-center rounded-xl'>
            <ReceiptText className='size-5.5' />
          </span>
          <h2 className='text-xl font-semibold tracking-tight'>{t('title')}</h2>
        </div>

        <div className='bg-accent border-primary/20 flex items-baseline gap-3 rounded-xl border px-5 py-3'>
          <span className='text-muted-foreground text-sm font-medium'>{t('grandTotal')}</span>
          <span className='text-primary-strong text-2xl font-bold tabular-nums'>
            {formatCurrency(result.grandTotal, locale)}
          </span>
        </div>
      </header>

      <div className='mt-5'>
        <Tabs value={tab} onValueChange={(value) => setTab(value as CostSection)}>
          <TabsList className='w-full'>
            {COST_SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section} className='flex-1'>
                {t(`sections.${section}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className='mt-4 overflow-hidden rounded-xl border'>
        <Table>
          <TableBody>
            {active?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='py-3 pl-4 font-medium'>{item.label}</TableCell>
                <TableCell className='py-3 pr-4 text-right tabular-nums'>
                  {formatCurrency(item.amount, locale)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className='bg-muted/60 hover:bg-muted/60'>
              <TableCell className='py-3 pl-4 font-semibold'>{t('sectionTotal')}</TableCell>
              <TableCell className='text-primary-strong py-3 pr-4 text-right font-bold tabular-nums'>
                {formatCurrency(active?.total ?? 0, locale)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Cả hai lối vào đều tải cùng một file Excel đầy đủ hạng mục con. */}
      <Button size='lg' className='mt-5 w-full tracking-wide' onClick={download} disabled={isPending}>
        {isPending ? <Loader2 className='size-4 animate-spin' /> : <FileSpreadsheet className='size-4' />}
        {t('viewDetail')}
      </Button>

      <button
        type='button'
        onClick={download}
        disabled={isPending}
        className='text-muted-foreground hover:text-foreground mx-auto mt-3 flex items-center gap-2 text-sm underline-offset-4 hover:underline disabled:opacity-60'
      >
        <Download className='size-4' />
        {t('downloadXlsx')}
      </button>
    </section>
  )
}
