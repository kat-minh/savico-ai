'use client'

import { ArrowRight, Check, Info, Leaf, Minus, ShieldCheck, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment } from 'react'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useCmsCollection, type SupervisionPackage, type SupervisionTier } from '@/shared/cms'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { checkoutConfirmRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils'
import {
  ADDONS,
  JOURNEY_STEPS,
  SUPERVISION_COMPARISON,
  SUPERVISION_TIERS,
  SUPERVISION_VALUE_ROWS,
  type SupervisionCell,
  type SupervisionValueKey
} from '../constants/supervision.constants'

interface SupervisionPricingProps {
  /** Dự án gắn với đơn khi khách vào đây từ nút "Chọn cách quản lý thi công" (R8). */
  projectId?: string
}

/**
 * S19 — Trang Gói giám sát thi công (trang công khai, cũng là tab thứ hai của
 * trang Bảng giá).
 *
 * Thứ tự khối theo bản mô tả: 3 thẻ → dòng chi phí ước tính → bảng so sánh →
 * add-on & phụ phí → nguyên tắc phạm vi → hành trình khách hàng 8 bước → giá trị
 * khách hàng nhận được → 3 ghi chú.
 *
 * Bám quy tắc thay vì bám ảnh demo: ghi chú thanh toán chỉ còn QR chuyển khoản
 * (R10), và không có dòng nào nói tới việc xem báo giá của nhà thầu trên nền
 * tảng (R2) — bản demo có dòng đó trong thẻ "Tự quản lý".
 */
export function SupervisionPricing({ projectId }: SupervisionPricingProps) {
  const t = useTranslations('supervision.pricing')
  const packages = useCmsCollection('supervisionPackages')

  // Chữ cuối tiêu đề tô cam (Hình S19) — tách ở khoảng trắng cuối như S01.
  const title = t('title')
  const splitAt = title.lastIndexOf(' ')
  const titleLead = splitAt > 0 ? title.slice(0, splitAt) : title
  const titleAccent = splitAt > 0 ? title.slice(splitAt + 1) : ''

  return (
    <div className='mx-auto w-full max-w-[90rem] space-y-12 px-4 py-10 lg:px-8'>
      <header className='space-y-2 text-center'>
        <h1 className='text-primary-strong flex items-center justify-center gap-3 text-3xl font-bold tracking-tight uppercase sm:text-4xl'>
          <Leaf aria-hidden className='text-primary size-7 -scale-x-100 sm:size-8' />
          <span className='text-pretty'>
            {titleLead}
            {titleAccent ? <span className='text-brand-orange'> {titleAccent}</span> : null}
          </span>
          <Leaf aria-hidden className='text-primary size-7 sm:size-8' />
        </h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      <ul className='grid items-stretch gap-13 pt-4 md:grid-cols-3'>
        {packages.map((item) => (
          <PackageCard key={item.tier} item={item} projectId={projectId} />
        ))}
      </ul>

      <p className='text-muted-foreground mx-auto flex max-w-3xl items-start justify-center gap-2 text-center text-sm'>
        <Info className='mt-0.5 size-4 shrink-0' />
        <span className='text-pretty'>{t('costNote')}</span>
      </p>

      <ComparisonTable packages={packages} />

      <div className='grid gap-5 lg:grid-cols-2'>
        <AddonTable />
        <ScopeRules />
      </div>

      <Journey />
      <ValueTable />

      <ul className='bg-muted/40 text-muted-foreground grid gap-x-8 gap-y-3 rounded-2xl p-5 text-xs sm:grid-cols-3'>
        {[t('notes.payment'), t('notes.scope'), t('notes.area')].map((note) => (
          <li key={note} className='flex items-start gap-2'>
            <Info className='text-primary mt-0.5 size-3.5 shrink-0' />
            <span className='text-pretty'>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Một thẻ lựa chọn quản lý thi công. */
function PackageCard({ item, projectId }: { item: SupervisionPackage; projectId?: string }) {
  const t = useTranslations('supervision.pricing')
  const tTiers = useTranslations('supervision.tiers')
  const tTags = useTranslations('supervision.tierTags')
  const locale = useLocale() as Locale

  const isFree = item.price === 0

  return (
    <li className='relative flex'>
      {item.recommended ? (
        <span className='bg-brand-orange text-brand-orange-foreground absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-4 py-1 text-xs font-semibold tracking-wide uppercase whitespace-nowrap'>
          <Star className='size-3' />
          {t('recommended')}
        </span>
      ) : null}

      <section
        className={cn(
          'bg-card flex w-full flex-col rounded-2xl border p-5',
          item.recommended ? 'border-brand-orange shadow-md' : 'border-border'
        )}
      >
        <p
          className={cn(
            'bg-card mx-auto -mt-8 w-fit rounded-full border px-3.5 py-1 text-center text-[11px] font-semibold tracking-wide uppercase',
            item.recommended ? 'border-brand-orange text-brand-orange' : 'text-muted-foreground'
          )}
        >
          {tTags(item.tier)}
        </p>
        <h2
          className={cn(
            'mt-3 text-center text-2xl font-bold tracking-wide uppercase',
            item.recommended ? 'text-brand-orange' : 'text-primary-strong'
          )}
        >
          {tTiers(item.tier)}
        </h2>

        {item.imageUrl ? (
          <Photo src={item.imageUrl} alt='' className='mt-4 aspect-[16/10] w-full rounded-xl' sizes='360px' />
        ) : null}

        <p className='text-muted-foreground mt-4 text-center text-sm text-pretty'>{item.fitLine}</p>

        <p className='mt-3 text-center'>
          <span
            className={cn(
              'text-3xl font-bold tracking-tight',
              item.recommended ? 'text-brand-orange' : 'text-primary-strong'
            )}
          >
            {isFree ? t('free') : formatCurrency(item.price, locale)}
          </span>
          {isFree ? null : (
            <span className='text-muted-foreground block text-xs'>
              {t('perProject')} · {t('duration', { months: item.durationMonths })}
            </span>
          )}
        </p>

        <p
          className={cn(
            'mt-3 rounded-lg px-3 py-2 text-center text-xs font-medium',
            item.inspections ? 'bg-accent text-primary-strong' : 'bg-muted text-muted-foreground'
          )}
        >
          {item.inspections ? t('inspections', { count: item.inspections }) : t('noInspection')}
        </p>

        <ul className='mt-4 flex-1 space-y-2'>
          {item.benefits.map((benefit) => (
            <li key={benefit} className='flex items-start gap-2 text-sm'>
              <Check className='text-primary mt-0.5 size-4 shrink-0' strokeWidth={2.5} />
              <span className='text-pretty'>{benefit}</span>
            </li>
          ))}
        </ul>

        {isFree ? (
          <Button variant='outline' size='lg' className='mt-5 w-full' onClick={() => toast.success(t('selfChosen'))}>
            {t('chooseSelf')}
          </Button>
        ) : (
          <Button asChild size='lg' className='mt-5 w-full' variant={item.recommended ? 'default' : 'outline'}>
            <Link href={checkoutConfirmRoute(item.id, projectId)}>
              {t('choose', { tier: tTiers(item.tier) })}
              <ArrowRight className='size-4' />
            </Link>
          </Button>
        )}
      </section>
    </li>
  )
}

/** Bảng "So sánh chi tiết 3 lựa chọn". */
function ComparisonTable({ packages }: { packages: SupervisionPackage[] }) {
  const t = useTranslations('supervision.pricing.comparison')
  const tTiers = useTranslations('supervision.tiers')
  const tRows = useTranslations('supervision.pricing.comparison.rows')
  const tValues = useTranslations('supervision.pricing.comparison.values')
  const locale = useLocale() as Locale

  const byTier = (tier: SupervisionTier) => packages.find((item) => item.tier === tier)

  return (
    <section>
      <h2 className='text-center text-xl font-semibold tracking-tight'>{t('title')}</h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[720px] border-collapse text-sm'>
          <thead>
            <tr>
              <th className='bg-card sticky left-0 z-10 w-56 border-b border-r p-4 text-left font-medium'>
                {t('criterion')}
              </th>
              {SUPERVISION_TIERS.map((tier) => (
                <th key={tier} className='border-b p-4 text-center'>
                  <span className='text-primary-strong block font-bold tracking-wide uppercase'>{tTiers(tier)}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <GroupRow label={t('groups.core')} />
            <CoreRow
              label={tRows('inspectionCount')}
              values={SUPERVISION_TIERS.map((tier) => {
                const item = byTier(tier)
                return item?.inspections ? String(item.inspections) : '—'
              })}
            />
            <CoreRow
              label={tRows('duration')}
              values={SUPERVISION_TIERS.map((tier) => {
                const item = byTier(tier)
                return tier === 'self'
                  ? t('values.unlimited')
                  : t('values.months', { count: item?.durationMonths ?? 0 })
              })}
            />
            <CoreRow
              label={tRows('price')}
              values={SUPERVISION_TIERS.map((tier) => formatCurrency(byTier(tier)?.price ?? 0, locale))}
            />

            {SUPERVISION_COMPARISON.map((group) => (
              <Fragment key={group.key}>
                <GroupRow label={t(`groups.${group.key}`)} />
                {group.rows.map((row) => (
                  <tr key={row.key} className='even:bg-muted/20'>
                    <th className='bg-card sticky left-0 z-10 border-r p-3 text-left text-xs font-medium'>
                      {tRows(row.key)}
                    </th>
                    {SUPERVISION_TIERS.map((tier) => (
                      <td key={tier} className='p-3 text-center text-xs'>
                        <Cell value={row.values[tier]} label={tValues} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Bảng "Add-on & phụ phí". */
function AddonTable() {
  const t = useTranslations('supervision.pricing.addons')
  const packages = useCmsCollection('supervisionPackages')
  const months = packages.find((item) => item.tier === 'check')?.durationMonths ?? 6

  return (
    <section className='bg-card rounded-2xl border p-5'>
      <h2 className='text-base font-semibold'>{t('title')}</h2>

      <table className='mt-3 w-full border-collapse text-sm'>
        <thead>
          <tr className='text-muted-foreground text-xs'>
            <th className='border-b p-2 text-left font-medium'>{t('item')}</th>
            <th className='border-b p-2 text-left font-medium'>{t('price')}</th>
            <th className='border-b p-2 text-left font-medium'>{t('note')}</th>
          </tr>
        </thead>
        <tbody>
          {ADDONS.map((key) => (
            <tr key={key} className='even:bg-muted/20'>
              <td className='p-2 text-xs'>{key === 'extend' ? t('extend', { months }) : t(key)}</td>
              <td className='p-2 text-xs font-medium'>{t(`${key}Price`)}</td>
              <td className='text-muted-foreground p-2 text-xs'>{t(`${key}Note`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/** Khối "Nguyên tắc phạm vi dịch vụ". */
function ScopeRules() {
  const t = useTranslations('supervision.pricing.scope')

  return (
    <section className='bg-accent/40 rounded-2xl border p-5'>
      <h2 className='flex items-center gap-2 text-base font-semibold'>
        <ShieldCheck className='text-primary size-5' />
        {t('title')}
      </h2>
      <ul className='mt-3 space-y-2.5'>
        {[t('r1'), t('r2'), t('r3')].map((rule) => (
          <li key={rule} className='flex items-start gap-2 text-sm'>
            <span aria-hidden className='bg-primary mt-2 size-1.5 shrink-0 rounded-full' />
            <span className='text-pretty'>{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Khối "Hành trình khách hàng" 8 bước. */
function Journey() {
  const t = useTranslations('supervision.pricing.journey')

  return (
    <section className='bg-card rounded-2xl border p-5'>
      <h2 className='text-center text-xl font-semibold tracking-tight'>{t('title')}</h2>

      <ol className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {JOURNEY_STEPS.map((step, index) => (
          <li
            key={step}
            className={cn(
              'rounded-xl border p-4',
              step === 's4b' ? 'border-brand-orange bg-brand-orange-soft' : step === 's4a' ? 'bg-muted/40' : 'bg-card'
            )}
          >
            <span className='bg-primary text-primary-foreground inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold'>
              {index + 1}
            </span>
            <p className='mt-2 text-sm font-medium'>{t(step)}</p>
            <p className='text-muted-foreground mt-1 text-xs text-pretty'>{t(`${step}Body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Bảng "Giá trị khách hàng nhận được". */
function ValueTable() {
  const t = useTranslations('supervision.pricing.value')
  const tTiers = useTranslations('supervision.tiers')

  return (
    <section>
      <h2 className='text-center text-xl font-semibold tracking-tight'>{t('title')}</h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[640px] border-collapse text-sm'>
          <thead>
            <tr className='bg-muted/40 text-xs'>
              <th className='border-b p-3 text-left font-medium' />
              {SUPERVISION_TIERS.map((tier) => (
                <th key={tier} className='border-b p-3 text-center font-medium'>
                  {tTiers(tier)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPERVISION_VALUE_ROWS.map((row) => (
              <tr key={row} className='even:bg-muted/20'>
                <th className='bg-card sticky left-0 z-10 w-44 border-r p-3.5 text-left text-sm font-medium'>
                  {t(`rows.${row}`)}
                </th>
                {SUPERVISION_TIERS.map((tier) => (
                  <td key={tier} className='p-3.5 text-center text-xs text-pretty'>
                    {t(`cells.${row}.${tier}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GroupRow({ label }: { label: string }) {
  return (
    <tr>
      <th
        colSpan={SUPERVISION_TIERS.length + 1}
        className='bg-primary text-primary-foreground p-2.5 text-left text-xs font-semibold tracking-wide uppercase'
      >
        {label}
      </th>
    </tr>
  )
}

function CoreRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className='even:bg-muted/20'>
      <th className='bg-card sticky left-0 z-10 border-r p-3 text-left text-xs font-medium'>{label}</th>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className='p-3 text-center text-xs font-medium'>
          {value}
        </td>
      ))}
    </tr>
  )
}

function Cell({ value, label }: { value: SupervisionCell; label: (key: SupervisionValueKey) => string }) {
  if (value === true) return <Check className='text-primary mx-auto size-4' strokeWidth={2.5} />
  if (value === false) return <Minus className='text-muted-foreground mx-auto size-4' />
  return <span className='text-pretty'>{label(value)}</span>
}
