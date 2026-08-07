'use client'

import { Eye, FileDown, FileText, Info, Link2, Mail, QrCode } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

import type { Locale } from '@/i18n/routing'
import { DossierCover, EstimateSheet, Photo, PlanDrawing, type CoverRow } from '@/shared/components/common'
import { RENDER_IMAGE } from '@/shared/lib/imagery'
import { Button } from '@/shared/components/ui/button'
import { formatDate } from '@/shared/utils'
import { costShares } from '../services/estimate.service'
import type { EstimateResult } from '../types/design.types'

/** Khối THÔNG TIN DỰ ÁN ở đầu trang Bước 3 (mục IV.6). */
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
  /** Kiểu kiến trúc & phong cách — MỘT trường gộp (Phụ lục A, trường 7). */
  styleLabel: string
}

interface DossierOverviewProps {
  info: DossierProjectInfo
  /** Kết quả Bước 2 — thẻ "Bảng dự toán chi tiết" phải hiện đúng số của dự án. */
  result: EstimateResult | undefined
  onRender: () => void
  isRendering: boolean
}

/** Bốn thành phần của bộ hồ sơ ở khối "Xem trước hồ sơ" (Hình 09). */
const PREVIEW_PARTS = ['cover', 'floorPlan', 'exterior', 'estimate'] as const
type PreviewPart = (typeof PREVIEW_PARTS)[number]

/** Các nút chỉ kích hoạt sau khi render xong (mục IV.6). */
const LOCKED_ACTIONS: readonly { key: 'downloadPdf' | 'shareLink' | 'email' | 'qr'; icon: LucideIcon }[] = [
  { key: 'downloadPdf', icon: FileDown },
  { key: 'shareLink', icon: Link2 },
  { key: 'email', icon: Mail },
  { key: 'qr', icon: QrCode }
]

interface PreviewBodyProps {
  part: PreviewPart
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
      return <DossierCover className='aspect-4/3 w-full' project={cover} />
    case 'floorPlan':
      return <PlanDrawing className='aspect-4/3 w-full' />
    case 'exterior':
      return <Photo className='aspect-4/3 w-full' src={RENDER_IMAGE.villa} alt={alt} sizes='240px' />
    case 'estimate':
      return <EstimateSheet className='aspect-4/3 w-full' total={grandTotal} percents={percents} />
  }
}

/**
 * Bước 3 — trạng thái CHƯA render (mục IV.6, Hình 09).
 *
 * Cột trái: khối "THÔNG TIN DỰ ÁN" hai cột và khối "Xem trước hồ sơ" gồm 4 thẻ.
 * Cột phải: thẻ "Xuất hồ sơ" với nút chính "Render hồ sơ", 4 nút mờ chờ render,
 * dòng nhắc và badge trạng thái "Chưa render".
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
    | 'style'

  type InfoRow = { labelKey: InfoKey; value: string }

  // Hai cột cố định theo Hình 09 — không dùng grid tự chảy, vì kiểu đó xếp
  // dòng 1 và dòng 2 cạnh nhau chứ không phải "5 dòng trái, 5 dòng phải".
  const leftRows: InfoRow[] = [
    { labelKey: 'customerName', value: info.customerName },
    { labelKey: 'projectName', value: `${info.projectName} (${info.projectId})` },
    { labelKey: 'phone', value: info.phone },
    { labelKey: 'address', value: info.address },
    { labelKey: 'createdAt', value: formatDate(info.createdAt, locale) }
  ]
  const rightRows: InfoRow[] = [
    { labelKey: 'buildingType', value: info.buildingTypeLabel },
    { labelKey: 'scale', value: info.scaleLabel },
    // Diện tích do AI ước tính ở Bước 2; chưa có thì bỏ dòng chứ đừng in "0 m²".
    { labelKey: 'floorArea', value: info.floorArea > 0 ? t('floorAreaValue', { value: info.floorArea }) : '' },
    { labelKey: 'package', value: info.packageLabel },
    { labelKey: 'style', value: info.styleLabel }
  ]

  /** Trường nào chưa có dữ liệu thì bỏ hẳn dòng, đừng để nhãn treo lơ lửng. */
  const renderRows = (rows: InfoRow[]) =>
    rows
      .filter((row) => Boolean(row.value))
      .map((row) => (
        <div key={row.labelKey} className='flex items-start justify-between gap-4 border-b py-2.5 text-sm'>
          <dt className='text-muted-foreground'>{t(`info.${row.labelKey}`)}</dt>
          <dd className='text-right font-medium'>{row.value}</dd>
        </div>
      ))

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
    <div className='mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8'>
      <div className='space-y-5'>
        <section className='bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.1em] uppercase'>
            {t('infoTitle')}
          </h2>
          <div className='grid gap-x-10 sm:grid-cols-2'>
            <dl>{renderRows(leftRows)}</dl>
            <dl>{renderRows(rightRows)}</dl>
          </div>
        </section>

        <section className='bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='mb-4 font-semibold tracking-tight'>{t('previewTitle')}</h2>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            {PREVIEW_PARTS.map((key) => (
              <figure
                key={key}
                className='bg-card hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md'
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
                <figcaption className='mt-auto space-y-1.5 border-t px-3 py-3 text-center'>
                  <span className='block text-[13px] font-medium'>{t(`preview.${key}`)}</span>
                  {/* Hồ sơ chưa render nên chưa có file để mở — liên kết ở đây
                      chỉ báo thành phần nào sẽ có, kích hoạt sau khi render. */}
                  <span className='text-muted-foreground/70 inline-flex items-center gap-1.5 text-xs'>
                    <Eye className='size-3.5' />
                    {t('previewAction')}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {/* Cột PHẢI — thẻ "Xuất hồ sơ" */}
      <aside className='bg-card h-fit space-y-3 rounded-2xl border p-5 lg:sticky lg:top-32'>
        <h2 className='font-semibold tracking-tight'>{t('exportTitle')}</h2>

        <Button size='lg' className='h-14 w-full text-base' onClick={onRender} disabled={isRendering}>
          <FileText className='size-5' />
          {t('render')}
        </Button>

        {LOCKED_ACTIONS.map(({ key, icon: Icon }) => (
          <Button key={key} variant='outline' size='lg' className='h-12 w-full' disabled>
            <Icon className='size-4' />
            {t(`actions.${key}`)}
          </Button>
        ))}

        <p className='text-muted-foreground flex items-start gap-2 pt-1 text-sm'>
          <Info className='mt-0.5 size-4 shrink-0' />
          {t('lockedHint')}
        </p>

        <span className='bg-warning/15 text-warning-strong inline-flex rounded-md px-2.5 py-1 text-xs font-medium'>
          {t('statusPending')}
        </span>
      </aside>
    </div>
  )
}
