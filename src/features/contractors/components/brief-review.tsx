'use client'

import { ArrowLeft, CircleCheck, ClipboardList, FileText, House, ImageIcon, Info, MapPin, Receipt } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { StartOptionsDialog } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorBriefRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { formatBudgetShort, formatCurrency } from '@/shared/utils'
import { useBrief, useCompleteBrief } from '../hooks/use-brief'
import { briefReadiness, formatFileSize, fullAddress, isBriefComplete } from '../services/brief.service'
import { BriefSteps } from './brief-form'

interface BriefReviewProps {
  projectId: string
}

/**
 * Bước 2 — Kiểm tra hồ sơ dự án (S11).
 *
 * Bố cục: ba khối tóm tắt bên trái (mỗi khối có nút Chỉnh sửa quay lại Bước 1),
 * thẻ dự án + "Hồ sơ đã sẵn sàng" + nút hoàn tất bên phải.
 *
 * "Hoàn tất & tìm nhà thầu" chốt hồ sơ rồi mở popup ba lựa chọn dùng chung với
 * S08 (R7) — chọn "Tìm nhà thầu" mới sang S12.
 */
export function BriefReview({ projectId }: BriefReviewProps) {
  const t = useTranslations('contractors.review')
  const tScope = useTranslations('contractors.scope')
  const tScale = useTranslations('contractors.scale')
  const tCondition = useTranslations('contractors.siteCondition')
  const tStart = useTranslations('contractors.startWindow')
  const tCommon = useTranslations('contractors.common')
  const locale = useLocale() as Locale

  const { data: brief, isPending } = useBrief(projectId)
  const complete = useCompleteBrief(projectId)

  const [confirmed, setConfirmed] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)

  if (isPending || !brief) {
    return (
      <div className='mx-auto w-full max-w-6xl px-4 py-8 lg:px-8'>
        <Skeleton className='h-[32rem] rounded-2xl' />
      </div>
    )
  }

  const readiness = briefReadiness(brief)
  const canSubmit = confirmed && isBriefComplete(brief)

  const siteRows = [
    { label: t('labels.name'), value: brief.name },
    { label: t('labels.buildingType'), value: brief.buildingType },
    { label: t('labels.landArea'), value: `${brief.landArea} m²` },
    { label: t('labels.condition'), value: tCondition(brief.siteCondition) },
    { label: t('labels.scale'), value: tScale(brief.scale) },
    { label: t('labels.address'), value: fullAddress(brief) },
    { label: t('labels.budget'), value: formatCurrency(brief.budget, locale) },
    { label: t('labels.startWindow'), value: tStart(brief.startWindow) }
  ]

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-8 lg:px-8'>
      {/* Hình S11: link quay lại màu XANH, và ngay cạnh nó là viên nhãn
          "HỒ SƠ TỰ TẠO" — bản trước không có viên nhãn này. */}
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          href={contractorBriefRoute(projectId)}
          className='text-primary-strong hover:text-primary inline-flex items-center gap-1.5 text-sm font-medium'
        >
          <ArrowLeft className='size-4' />
          {t('back')}
        </Link>
        <span className='bg-accent text-primary-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase'>
          <ClipboardList className='size-3.5' />
          {tCommon('selfCreated')}
        </span>
      </div>

      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      <BriefSteps current={2} />

      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='min-w-0 space-y-4'>
          <SummaryCard
            title={t('siteTitle')}
            editHref={contractorBriefRoute(projectId)}
            editLabel={t('edit')}
            rows={siteRows}
          />

          <SummaryCard
            title={t('needsTitle')}
            editHref={contractorBriefRoute(projectId)}
            editLabel={t('edit')}
            rows={[
              // Hình S11: giá trị "Phạm vi" là VIÊN NHÃN nền xanh nhạt, không
              // phải chữ trơn như các dòng khác.
              { label: t('scopeLabel'), value: tScope(brief.scope), chip: true },
              { label: t('noteLabel'), value: brief.scopeNote }
            ]}
          />

          <section className='bg-card rounded-2xl border p-5'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-sm font-semibold tracking-wide uppercase'>{t('documentsTitle')}</h2>
              <Link
                href={contractorBriefRoute(projectId)}
                className='text-primary-strong text-sm font-medium underline underline-offset-4'
              >
                {t('addFile')}
              </Link>
            </div>

            {brief.documents.length === 0 ? (
              <p className='text-muted-foreground mt-3 text-sm'>{t('noDocuments')}</p>
            ) : (
              <ul className='mt-3 space-y-2'>
                {brief.documents.map((document) => (
                  <li key={document.id} className='flex items-center gap-3 rounded-lg border px-3 py-2'>
                    {/* Hình S11: icon ảnh màu xanh, icon PDF màu ĐỎ. */}
                    {document.kind === 'image' ? (
                      <ImageIcon className='text-primary size-4 shrink-0' />
                    ) : (
                      <FileText className='text-destructive size-4 shrink-0' />
                    )}
                    <span className='min-w-0 flex-1 truncate text-sm'>{document.name}</span>
                    <span className='text-muted-foreground text-xs'>{formatFileSize(document, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Hình S11: cột phải là MỘT thẻ duy nhất, không phải hai thẻ rời.
            Thứ tự trong ảnh: icon ngôi nhà + viên nhãn "HỒ SƠ TỰ TẠO" · TÊN dự
            án cỡ lớn · dòng "loại · quy mô" · địa chỉ · ngân sách (dạng gọn
            "1,85 tỷ") · kẻ ngang · "Hồ sơ đã sẵn sàng" + 3 dòng tick · ô lưu ý
            · checkbox · nút · link "Lưu nháp và thoát" gạch chân canh giữa.

            Bản trước liệt kê "Loại công trình / Quy mô / Địa chỉ" thành các
            dòng nhãn–giá trị và in mã dự án — ảnh không có mã, mà đưa TÊN dự án
            lên làm tiêu đề. */}
        <aside className='bg-card space-y-4 rounded-2xl border p-5 lg:sticky lg:top-24 lg:self-start'>
          <div className='flex items-center gap-3'>
            <span className='bg-accent text-primary flex size-11 shrink-0 items-center justify-center rounded-xl'>
              <House className='size-5' />
            </span>
            <span className='bg-accent text-primary-strong inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase'>
              {tCommon('selfCreated')}
            </span>
          </div>

          <div>
            <h2 className='text-xl font-bold tracking-tight text-pretty'>{brief.name}</h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              {[brief.buildingType, tScale(brief.scale)].filter(Boolean).join(' · ')}
            </p>
          </div>

          <ul className='space-y-2 text-sm'>
            <li className='flex items-start gap-2'>
              <MapPin className='text-primary mt-0.5 size-4 shrink-0' />
              <span className='text-pretty'>{fullAddress(brief)}</span>
            </li>
            <li className='flex items-start gap-2'>
              <Receipt className='text-primary mt-0.5 size-4 shrink-0' />
              <span>
                {t('projectCard.budgetLabel')} {formatBudgetShort(brief.budget, locale)}
              </span>
            </li>
          </ul>

          <div className='border-t pt-4'>
            <h3 className='text-primary-strong flex items-center gap-2 font-bold'>
              <CircleCheck className='size-5' />
              {t('ready')}
            </h3>

            <ul className='mt-3 space-y-2 text-sm'>
              {[
                { key: 'info', ok: readiness.hasProjectInfo, label: t('readyInfo') },
                { key: 'needs', ok: readiness.hasNeeds, label: t('readyEditable') },
                { key: 'free', ok: true, label: t('readyFree') }
              ].map((item) => (
                <li key={item.key} className='flex items-start gap-2'>
                  <CircleCheck
                    className={
                      item.ok ? 'text-primary mt-0.5 size-4 shrink-0' : 'text-muted-foreground mt-0.5 size-4 shrink-0'
                    }
                  />
                  <span className='text-pretty'>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className='text-muted-foreground bg-warning/10 flex items-start gap-2 rounded-lg p-3 text-xs'>
            <Info className='text-warning-strong mt-0.5 size-3.5 shrink-0' />
            <span className='text-pretty'>{t('quoteNote')}</span>
          </p>

          <label className='flex cursor-pointer items-start gap-2.5 text-sm'>
            <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} />
            <span className='text-pretty'>{t('confirm')}</span>
          </label>

          <Button
            className='h-12 w-full'
            disabled={!canSubmit || complete.isPending}
            onClick={() => complete.mutate(undefined, { onSuccess: () => setOptionsOpen(true) })}
          >
            {t('submit')}
          </Button>

          {!isBriefComplete(brief) ? <p className='text-destructive text-xs text-pretty'>{t('incomplete')}</p> : null}

          {/* Hình S11 còn một link "Lưu nháp và thoát" ở đây — đã bỏ cùng nút
              "Lưu nháp" ở Bước 1: hồ sơ đã được ghi lại từ Bước 1 và vẫn ở
              trạng thái nháp cho tới khi bấm "Hoàn tất", nên không có gì để
              "lưu" thêm, chỉ có một lối ra làm loãng thao tác chính. */}
        </aside>
      </div>

      <StartOptionsDialog
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        findHref={contractorMatchesRoute(projectId)}
      />
    </div>
  )
}

/**
 * Một khối tóm tắt bên trái của S11.
 *
 * Hình S11: tiêu đề IN HOA, link "Chỉnh sửa" ở mép phải màu xanh và LUÔN gạch
 * chân (bản trước có icon bút chì và không gạch chân — ảnh không có icon nào).
 */
function SummaryCard({
  title,
  rows,
  editHref,
  editLabel
}: {
  title: string
  rows: { label: string; value: string; chip?: boolean }[]
  editHref: string
  editLabel: string
}) {
  return (
    <section className='bg-card rounded-2xl border p-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-sm font-semibold tracking-wide uppercase'>{title}</h2>
        <Link href={editHref} className='text-primary-strong text-sm font-medium underline underline-offset-4'>
          {editLabel}
        </Link>
      </div>

      <dl className='mt-4 space-y-2.5'>
        {rows.map((row) => (
          <div key={row.label} className='grid gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4'>
            <dt className='text-muted-foreground text-xs sm:text-sm'>{row.label}</dt>
            <dd className='text-sm text-pretty'>
              {row.chip ? (
                <span className='bg-accent text-primary-strong inline-flex rounded-full px-3 py-1 text-xs font-medium'>
                  {row.value}
                </span>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
