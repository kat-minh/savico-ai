'use client'

import { ArrowRight, Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'
import type { DesignInput, EstimateResult } from '../types/design.types'
import { AdvisoryNote } from './advisory-note'
import { CostDonut } from './cost-donut'
import { EstimateTable } from './estimate-table'

interface EstimateResultViewProps {
  result: EstimateResult
  /** Tên khách hàng — đoạn văn tư vấn xưng hô theo tên (mục III.3b, khối 3). */
  customerName: string
  /** Tên dự án — in lên đầu file Excel dự toán. */
  projectName: string
  /** Dữ liệu Bước 1: địa chỉ cho file Excel và các biến của đoạn văn tư vấn. */
  input?: DesignInput
  onContinue: () => void
}

/**
 * Màn hình kết quả dự toán (mục III.3b), thứ tự từ trên xuống:
 * (1) bảng dự toán → (2) biểu đồ tròn tỷ trọng → (3) đoạn văn tư vấn cá nhân
 * hóa → (4) nút "Nhận hồ sơ thi công".
 */
export function EstimateResultView({ result, customerName, projectName, input, onContinue }: EstimateResultViewProps) {
  const t = useTranslations('design.estimate')

  return (
    <div className='space-y-8'>
      <EstimateTable result={result} context={{ projectName, address: input?.address ?? '' }} />

      <section className='bg-card rounded-2xl border p-6'>
        <h2 className='mb-6 text-lg font-semibold tracking-tight'>{t('breakdownTitle')}</h2>
        <CostDonut sections={result.sections} />
      </section>

      {/* Đoạn tư vấn nằm DƯỚI biểu đồ theo đúng thứ tự mục III.3b (1 bảng →
          2 biểu đồ → 3 đoạn văn → 4 nút). */}
      <section className='bg-accent/60 border-primary/20 rounded-2xl border p-6'>
        <div className='flex gap-4'>
          <span className='bg-card text-primary flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm'>
            <Lightbulb className='size-5.5' />
          </span>
          <div className='min-w-0 flex-1'>
            <h2 className='mb-3 text-lg font-semibold tracking-tight'>{t('advisoryTitle')}</h2>
            {/* Văn mẫu soạn sẵn điền biến theo dự án (Phụ lục 02, mục II.3). */}
            <AdvisoryNote result={result} customerName={customerName} input={input} />
          </div>
        </div>
      </section>

      <Button size='lg' className='h-12 w-full text-base' onClick={onContinue}>
        {t('continue')}
        <ArrowRight className='size-5' />
      </Button>
    </div>
  )
}
