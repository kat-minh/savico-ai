'use client'

import { ArrowLeft, CircleCheck, FileText, ImageIcon, Info, Pencil, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { StartOptionsDialog } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorBriefRoute, contractorMatchesRoute, ROUTES } from '@/shared/constants/routes'
import { formatCurrency } from '@/shared/utils'
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
  const locale = useLocale() as Locale
  const router = useRouter()

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
      <Link
        href={contractorBriefRoute(projectId)}
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
      >
        <ArrowLeft className='size-4' />
        {t('back')}
      </Link>

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
              { label: t('scopeLabel'), value: tScope(brief.scope) },
              { label: t('noteLabel'), value: brief.scopeNote }
            ]}
          />

          <section className='bg-card rounded-2xl border p-5'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-base font-semibold'>{t('documentsTitle')}</h2>
              <Link
                href={contractorBriefRoute(projectId)}
                className='text-primary inline-flex items-center gap-1.5 text-sm font-medium'
              >
                <Plus className='size-3.5' />
                {t('addFile')}
              </Link>
            </div>

            {brief.documents.length === 0 ? (
              <p className='text-muted-foreground mt-3 text-sm'>{t('noDocuments')}</p>
            ) : (
              <ul className='mt-3 space-y-2'>
                {brief.documents.map((document) => (
                  <li key={document.id} className='flex items-center gap-3 rounded-lg border px-3 py-2'>
                    {document.kind === 'image' ? (
                      <ImageIcon className='text-primary size-4 shrink-0' />
                    ) : (
                      <FileText className='text-primary size-4 shrink-0' />
                    )}
                    <span className='min-w-0 flex-1 truncate text-sm'>{document.name}</span>
                    <span className='text-muted-foreground text-xs'>{formatFileSize(document, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className='space-y-4 lg:sticky lg:top-24 lg:self-start'>
          <section className='bg-card rounded-2xl border p-5'>
            <h2 className='flex items-center gap-2 text-base font-semibold'>
              <CircleCheck className='text-primary size-5' />
              {t('ready')}
            </h2>

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
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>

            <p className='text-muted-foreground bg-warning/10 mt-4 flex items-start gap-2 rounded-lg p-3 text-xs'>
              <Info className='text-warning-strong mt-0.5 size-3.5 shrink-0' />
              <span className='text-pretty'>{t('quoteNote')}</span>
            </p>

            <label className='mt-4 flex cursor-pointer items-start gap-2.5 text-sm'>
              <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} />
              <span className='text-pretty'>{t('confirm')}</span>
            </label>

            <Button
              className='mt-4 w-full'
              disabled={!canSubmit || complete.isPending}
              onClick={() => complete.mutate(undefined, { onSuccess: () => setOptionsOpen(true) })}
            >
              {t('submit')}
            </Button>

            {!isBriefComplete(brief) ? (
              <p className='text-destructive mt-2 text-xs text-pretty'>{t('incomplete')}</p>
            ) : null}

            <Button variant='ghost' className='mt-2 w-full' onClick={() => router.push(ROUTES.ACCOUNT)}>
              {t('saveAndExit')}
            </Button>
          </section>
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

function SummaryCard({
  title,
  rows,
  editHref,
  editLabel
}: {
  title: string
  rows: { label: string; value: string }[]
  editHref: string
  editLabel: string
}) {
  return (
    <section className='bg-card rounded-2xl border p-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-base font-semibold'>{title}</h2>
        <Link href={editHref} className='text-primary inline-flex items-center gap-1.5 text-sm font-medium'>
          <Pencil className='size-3.5' />
          {editLabel}
        </Link>
      </div>

      <dl className='mt-3 space-y-2.5'>
        {rows.map((row) => (
          <div key={row.label} className='grid gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4'>
            <dt className='text-muted-foreground text-xs sm:text-sm'>{row.label}</dt>
            <dd className='text-sm text-pretty'>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
