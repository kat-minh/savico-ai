'use client'

import { FileText, Image as ImageIcon, LayoutPanelTop, Table2, Wand2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { DossierCover, EstimateSheet, Photo, PlanDrawing, type CoverRow } from '@/shared/components/common'
import { RENDER_IMAGE } from '@/shared/lib/imagery'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { costShares } from '../services/estimate.service'
import type { EstimateResult } from '../types/design.types'

/** Khối THÔNG TIN DỰ ÁN ở đầu trang Bước 3 (mục III.4a). */
export interface DossierProjectInfo {
  customerName: string
  projectName: string
  projectId: string
  phone: string
  address: string
  createdAt: string
  buildingTypeLabel: string
  scaleLabel: string
  /** Tổng diện tích sàn do AI ước tính (m²). */
  floorArea: number
  packageLabel: string
  architectureLabel: string
  interiorLabel: string
}

interface DossierOverviewProps {
  info: DossierProjectInfo
  /** Kết quả Bước 2 — thẻ "Bảng dự toán chi tiết" phải hiện đúng số của dự án. */
  result: EstimateResult | undefined
  onRender: () => void
  isRendering: boolean
}

/**
 * 4 thành phần của bộ hồ sơ, xếp lớp cạnh nhau ở trạng thái xem trước.
 * Mỗi thẻ hiện đúng nội dung của nó: bìa và bảng dự toán dựng bằng markup,
 * mặt bằng là bản vẽ SVG, phối cảnh là ảnh render.
 */
const PREVIEW_PARTS = [
  { key: 'cover', icon: FileText },
  { key: 'floorPlan', icon: LayoutPanelTop },
  { key: 'exterior', icon: ImageIcon },
  { key: 'estimate', icon: Table2 }
] as const

interface PreviewBodyProps {
  part: (typeof PREVIEW_PARTS)[number]['key']
  alt: string
  /** Dữ liệu thật của dự án — thẻ xem trước phải khớp hồ sơ sắp render. */
  cover: { title: string; subtitle: string; rows: CoverRow[] }
  grandTotal: number | undefined
  percents: [number, number, number] | undefined
}

/** Render the real artefact behind each preview card. */
function PreviewBody({ part, alt, cover, grandTotal, percents }: PreviewBodyProps) {
  switch (part) {
    case 'cover':
      return <DossierCover className='aspect-3/4 w-full' project={cover} />
    case 'floorPlan':
      return <PlanDrawing className='aspect-3/4 w-full' />
    case 'exterior':
      return <Photo className='aspect-3/4 w-full' src={RENDER_IMAGE.villa} alt={alt} sizes='200px' />
    case 'estimate':
      return <EstimateSheet className='aspect-3/4 w-full' total={grandTotal} percents={percents} />
  }
}

/** Các nút chỉ kích hoạt sau khi render xong (mục III.4a). */
const LOCKED_ACTIONS = ['downloadPdf', 'shareLink', 'email', 'qr'] as const

/**
 * Bước 3 — trạng thái CHƯA render (mục III.4a).
 * Thông tin dự án, dải thẻ xem trước 4 thành phần, cột phải với nút
 * "Render hồ sơ" và các nút tải / chia sẻ ở trạng thái mờ.
 */
export function DossierOverview({ info, result, onRender, isRendering }: DossierOverviewProps) {
  const t = useTranslations('design.dossier')
  const locale = useLocale() as Locale

  /** Message keys under `design.dossier.info`. */
  type InfoKey =
    | 'customerName'
    | 'projectName'
    | 'phone'
    | 'address'
    | 'createdAt'
    | 'buildingType'
    | 'scale'
    | 'floorArea'
    | 'package'
    | 'architecture'
    | 'interior'

  const rows = (
    [
      { labelKey: 'customerName', value: info.customerName },
      { labelKey: 'projectName', value: `${info.projectName} (${info.projectId})` },
      { labelKey: 'phone', value: info.phone },
      { labelKey: 'address', value: info.address },
      { labelKey: 'createdAt', value: formatDate(info.createdAt, locale) },
      { labelKey: 'buildingType', value: info.buildingTypeLabel },
      { labelKey: 'scale', value: info.scaleLabel },
      // Diện tích do AI ước tính ở Bước 2; chưa có thì bỏ dòng chứ đừng in "0 m²".
      { labelKey: 'floorArea', value: info.floorArea > 0 ? t('floorAreaValue', { value: info.floorArea }) : '' },
      { labelKey: 'package', value: info.packageLabel },
      { labelKey: 'architecture', value: info.architectureLabel },
      { labelKey: 'interior', value: info.interiorLabel }
    ] satisfies { labelKey: InfoKey; value: string }[]
  )
    // Trường nào chưa có dữ liệu thì bỏ hẳn dòng, đừng để nhãn treo lơ lửng.
    .filter((row) => Boolean(row.value))

  const shares = result ? costShares(result.sections) : null
  const cover = {
    title: info.projectName,
    subtitle: [info.address, info.projectId].filter(Boolean).join(' · '),
    rows: [
      { label: t('info.scale'), value: info.scaleLabel },
      { label: t('info.package'), value: info.packageLabel },
      { label: t('info.createdAt'), value: formatDate(info.createdAt, locale) }
    ].filter((row) => Boolean(row.value))
  }

  return (
    <div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_300px] lg:px-8'>
      <div className='space-y-8'>
        <section className='bg-card rounded-2xl border p-6'>
          <h2 className='mb-5 text-lg font-semibold tracking-tight'>{t('infoTitle')}</h2>
          <dl className='grid gap-x-8 gap-y-3 sm:grid-cols-2'>
            {rows.map((row) => (
              <div key={row.labelKey} className='flex justify-between gap-4 border-b pb-2 text-sm'>
                <dt className='text-muted-foreground'>{t(`info.${row.labelKey}`)}</dt>
                <dd className='text-right font-medium'>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className='mb-4 text-lg font-semibold tracking-tight'>{t('previewTitle')}</h2>
          {/* Bốn thẻ bằng nhau, thẳng hàng đáy. Kiểu chồng mép (-ml) trước đây
              làm các thẻ so le và che mất nội dung thẻ bên dưới. */}
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            {PREVIEW_PARTS.map(({ key, icon: Icon }) => (
              <figure
                key={key}
                className={cn(
                  'bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300',
                  'hover:border-primary/40 hover:-translate-y-1 hover:shadow-md'
                )}
              >
                <PreviewBody
                  part={key}
                  alt={t(`preview.${key}`)}
                  cover={cover}
                  grandTotal={result?.grandTotal}
                  percents={
                    shares
                      ? [
                          shares.find((s) => s.section === 'structure')?.percent ?? 0,
                          shares.find((s) => s.section === 'finishing')?.percent ?? 0,
                          shares.find((s) => s.section === 'interior')?.percent ?? 0
                        ]
                      : undefined
                  }
                />
                <figcaption className='mt-auto flex items-center gap-2 border-t px-3 py-2.5 text-xs font-medium'>
                  <Icon className='text-muted-foreground size-3.5 shrink-0' />
                  <span className='truncate'>{t(`preview.${key}`)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {/* Cột PHẢI */}
      <aside className='space-y-3 lg:sticky lg:top-32 lg:self-start'>
        <Button size='lg' className='w-full' onClick={onRender} disabled={isRendering}>
          <Wand2 className='size-4' />
          {t('render')}
        </Button>

        {LOCKED_ACTIONS.map((action) => (
          <Tooltip key={action}>
            <TooltipTrigger asChild>
              {/* Wrapper keeps the tooltip reachable while the button is disabled. */}
              <span className='block'>
                <Button variant='outline' className='w-full' disabled>
                  {t(`actions.${action}`)}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('lockedHint')}</TooltipContent>
          </Tooltip>
        ))}
      </aside>
    </div>
  )
}
