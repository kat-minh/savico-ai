'use client'

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Gift,
  HardHat,
  Info,
  Leaf,
  Minus,
  MousePointerClick,
  Star,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useState } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { PlanTier, SubscriptionPlan } from '@/shared/cms'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { checkoutConfirmRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils'
import { PLAN_COMPARISON, PLAN_VALUE_ROWS, type PlanCell, type PlanValueKey } from '../constants/plan-comparison'
import { usePlans } from '../hooks/use-plans'
import { giftValueInMillions } from '../services/plan-gift.service'
import { PlanGiftDialog } from './plan-gift-dialog'

const TIERS: readonly PlanTier[] = ['basic', 'advanced', 'pro'] as const

/** Gói được tô cam xuyên suốt trang (Hình S01) — cột PLUS của bảng so sánh. */
const POPULAR_TIER: PlanTier = 'advanced'

/** Icon đứng trước mỗi hàng của bảng "Giá trị khách hàng nhận được" (Hình S01). */
const VALUE_ROW_ICON: Record<(typeof PLAN_VALUE_ROWS)[number], LucideIcon> = {
  easy: MousePointerClick,
  time: Clock,
  budget: Wallet,
  ready: HardHat
}

/**
 * S01 — Bảng giá gói thiết kế (trang công khai).
 *
 * Ba thẻ gói → dải CTA → bảng "So sánh chi tiết 3 gói" → bảng "Giá trị khách
 * hàng nhận được" → ba ghi chú cuối trang, đúng thứ tự bản mô tả.
 *
 * Hai điểm bám quy tắc thay vì bám ảnh demo:
 * - R10: ghi chú cuối trang chỉ nói QR chuyển khoản, không còn "hoặc cổng thanh
 *   toán".
 * - Bấm chọn gói đi thẳng vào checkout (S03) chứ không phải một toast "sắp có" —
 *   luồng mua gói đã có thật từ bản v1.1.
 */
export function PlanPricing() {
  const t = useTranslations('plans')
  const { data: plans, isPending } = usePlans()

  const [giftPlan, setGiftPlan] = useState<SubscriptionPlan | null>(null)

  // Chữ cuối của tiêu đề được tô cam (Hình S01) — tách bằng khoảng trắng cuối
  // cùng để đổi tiêu đề trong CMS vẫn chạy đúng.
  const title = t('title')
  const splitAt = title.lastIndexOf(' ')
  const titleLead = splitAt > 0 ? title.slice(0, splitAt) : title
  const titleAccent = splitAt > 0 ? title.slice(splitAt + 1) : ''

  return (
    <div className='mx-auto w-full max-w-[90rem] space-y-12 px-4 py-10 lg:px-8'>
      {/* Hình S01: tiêu đề IN HOA cỡ lớn, chữ cuối (tên thương hiệu) tô cam,
          hai bên có hai chiếc lá. Tách chữ cuối ngay tại đây để admin đổi tiêu
          đề trong CMS thì phần tô màu vẫn tự bám chữ cuối. */}
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

      {isPending ? (
        <div className='grid gap-5 md:grid-cols-3'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-[32rem] rounded-2xl' />
          ))}
        </div>
      ) : (
        // Hình S01 chụp ở khổ ~853px (cỡ chữ phụ đề ~15px xác nhận là ảnh 1×),
        // nên chỉ TỈ LỆ mới dùng lại được, không phải số đo tuyệt đối: cụm ba
        // thẻ chiếm 88% bề rộng và bề rộng thẻ gấp ~8,3 lần khe giữa hai thẻ.
        <ul className='grid items-stretch gap-13 pt-4 md:grid-cols-3'>
          {plans?.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} onOpenGift={() => setGiftPlan(plan)} />
          ))}
        </ul>
      )}

      {/* Dải CTA giữa trang. */}
      <section className='bg-accent/40 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-6 py-5'>
        <div>
          <p className='font-semibold text-pretty'>{t('ctaBand.title')}</p>
          <p className='text-muted-foreground text-sm text-pretty'>{t('ctaBand.subtitle')}</p>
        </div>
        <Button asChild size='lg'>
          <Link href={checkoutConfirmRoute('advanced')}>
            {t('ctaBand.action')}
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      </section>

      {plans ? <ComparisonTable plans={plans} /> : null}
      {plans ? <ValueTable /> : null}

      <ul className='bg-muted/40 text-muted-foreground grid gap-x-8 gap-y-3 rounded-2xl p-5 text-xs sm:grid-cols-2 lg:grid-cols-3'>
        {[t('notes.payment'), t('notes.credits'), t('notes.estimate'), t('notes.gift'), t('notes.scope')].map(
          (note) => (
            <li key={note} className='flex items-start gap-2'>
              <Info className='text-primary mt-0.5 size-3.5 shrink-0' />
              <span className='text-pretty'>{note}</span>
            </li>
          )
        )}
      </ul>

      <PlanGiftDialog plan={giftPlan} onClose={() => setGiftPlan(null)} />
    </div>
  )
}

/** Một thẻ gói (S01). Thẻ có quà tặng mở popup S02 khi bấm vào khối quà. */
function PlanCard({ plan, onOpenGift }: { plan: SubscriptionPlan; onOpenGift: () => void }) {
  const t = useTranslations('plans')
  const locale = useLocale() as Locale
  const giftMillions = plan.gift ? giftValueInMillions(plan.gift.value) : null

  return (
    <li className='relative flex'>
      {plan.popular ? (
        <span className='bg-brand-orange text-brand-orange-foreground absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-4 py-1 text-xs font-semibold tracking-wide uppercase whitespace-nowrap'>
          <Star className='size-3' />
          {t('popular')}
        </span>
      ) : null}

      <section
        className={cn(
          'bg-card flex w-full flex-col overflow-hidden rounded-2xl border',
          plan.popular ? 'border-brand-orange shadow-md' : 'border-border'
        )}
      >
        <header
          className={cn(
            'space-y-1 px-5 py-2 text-center',
            plan.popular
              ? 'bg-brand-orange-soft'
              : 'from-primary-strong to-primary text-primary-foreground bg-linear-to-r'
          )}
        >
          <h2
            className={cn(
              'flex items-center justify-center gap-1.5 text-xl font-bold tracking-wide uppercase',
              plan.popular ? 'text-brand-orange' : 'text-primary-foreground'
            )}
          >
            {t(`tiers.${plan.tier}`)}
            {/* Hình S01: mỗi tên gói có một chiếc lá nhỏ đứng ngay sau. */}
            <Leaf
              aria-hidden
              className={cn('size-4', plan.popular ? 'text-brand-orange' : 'text-primary-foreground')}
            />
          </h2>
          <span
            className={cn(
              'inline-block rounded-full px-3 py-0.5 text-[10px] font-semibold',
              plan.popular ? 'bg-brand-orange text-brand-orange-foreground' : 'bg-primary-foreground/15'
            )}
          >
            {t(`tierTags.${plan.tier}`)}
          </span>
        </header>

        <div className='flex flex-1 flex-col p-5'>
          {plan.imageUrl ? (
            <Photo src={plan.imageUrl} alt='' className='aspect-[16/10] w-full rounded-xl' sizes='360px' />
          ) : null}

          <p className='text-muted-foreground mt-4 text-center text-sm text-pretty'>{plan.fitLine}</p>

          <p className='mt-3 text-center'>
            <span
              className={cn(
                'text-3xl font-bold tracking-tight',
                plan.popular ? 'text-brand-orange' : 'text-primary-strong'
              )}
            >
              {formatCurrency(plan.price, locale)}
            </span>
            <span className='text-muted-foreground block text-xs'>{t('oneTime')}</span>
          </p>

          {/* Hình S01: danh sách tính năng nằm trong MỘT khung viền, tiêu đề
              in hoa canh giữa ngay bên trong khung; dấu tích đổi màu theo gói. */}
          <div className='mt-5 flex flex-1 flex-col rounded-xl border p-4'>
            <p
              className={cn(
                'text-center text-[11px] font-bold tracking-wide uppercase',
                plan.popular ? 'text-brand-orange' : 'text-primary-strong'
              )}
            >
              {t(`featuresTitleByTier.${plan.tier}`)}
            </p>
            <ul className='mt-3 flex-1 space-y-2'>
              {(plan.features ?? [plan.perk]).map((feature) => (
                <li key={feature} className='flex items-start gap-2 text-sm'>
                  <CheckCircle2
                    className={cn('mt-0.5 size-4 shrink-0', plan.popular ? 'text-brand-orange' : 'text-primary')}
                  />
                  <span className='text-pretty'>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {plan.gift ? (
            <button
              type='button'
              onClick={onOpenGift}
              className='bg-muted/40 hover:bg-muted/70 mt-4 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors'
            >
              <Gift className='text-brand-orange mt-0.5 size-5 shrink-0' />
              <span className='min-w-0'>
                <span className='text-primary-strong block text-xs font-bold tracking-wide uppercase'>
                  {t('gift.badge')}
                </span>
                <span className='mt-0.5 block text-sm text-pretty'>
                  {t('gift.valueLine', {
                    title: plan.gift.title,
                    value: giftMillions
                      ? `${giftMillions} ${t('gift.valueMillionsUnit')}`
                      : formatCurrency(plan.gift.value, locale)
                  })}
                </span>
                <span className='text-muted-foreground mt-1 block text-xs underline underline-offset-2'>
                  {t('gift.open')}
                </span>
              </span>
            </button>
          ) : null}

          {/* Hình S01: cả ba nút đều là nút đặc, chữ in hoa; riêng gói PLUS
              tô cam thay vì xanh. */}
          <Button
            asChild
            size='lg'
            className={cn(
              'mt-5 w-full text-sm font-bold tracking-wide uppercase',
              plan.popular && 'brand-orange-button'
            )}
          >
            <Link href={checkoutConfirmRoute(plan.id)}>
              {t(`cta.${plan.tier}`)}
              <ArrowRight className='size-4' />
            </Link>
          </Button>
        </div>
      </section>
    </li>
  )
}

/**
 * Bảng "So sánh chi tiết 3 gói".
 *
 * Cột "Hạng mục" `sticky left-0` và bảng nằm trong khung cuộn ngang: ba cột gói
 * không co nhỏ hơn được nữa thì người đọc vẫn biết mình đang ở dòng nào — bản mô
 * tả không nói gì về màn hình hẹp, mà đây là bảng dài nhất của trang.
 */
function ComparisonTable({ plans }: { plans: SubscriptionPlan[] }) {
  const t = useTranslations('plans')
  const tRows = useTranslations('plans.comparison.rows')
  const tValues = useTranslations('plans.comparison.values')
  const locale = useLocale() as Locale

  const byTier = (tier: PlanTier) => plans.find((plan) => plan.tier === tier)

  return (
    <section>
      <h2 className='text-primary-strong text-center text-xl font-bold tracking-wide uppercase'>
        {t('comparison.title')}
      </h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[720px] table-fixed border-collapse text-sm'>
          <colgroup>
            <col className='w-[28%]' />
            <col className='w-[24%]' />
            <col className='w-[24%]' />
            <col className='w-[24%]' />
          </colgroup>
          <thead>
            <tr>
              <th className='bg-card sticky left-0 z-10 border-b border-r p-4 text-left font-medium'>
                {t('comparison.criterion')}
              </th>
              {TIERS.map((tier) => (
                <th
                  key={tier}
                  className={cn('border-b p-4 text-center', tier === POPULAR_TIER && 'bg-brand-orange-soft')}
                >
                  <span
                    className={cn(
                      'block font-bold tracking-wide uppercase',
                      tier === POPULAR_TIER ? 'text-brand-orange' : 'text-primary-strong'
                    )}
                  >
                    {t(`tiers.${tier}`)}
                  </span>
                  <span className='text-muted-foreground block text-xs font-normal'>
                    {formatCurrency(byTier(tier)?.price ?? 0, locale)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Nhóm "Quyền lợi chính" đọc thẳng số từ bản ghi gói. */}
            <GroupRow label={t('comparison.groups.core')} />
            <CoreRow
              label={t('comparison.core.designOptions')}
              values={TIERS.map((tier) => t('comparison.core.optionUnit', { count: byTier(tier)?.designCredits ?? 0 }))}
            />
            <CoreRow
              label={t('comparison.core.editCredits')}
              values={TIERS.map((tier) => t('comparison.core.editUnit', { count: byTier(tier)?.designCredits ?? 0 }))}
            />
            <CoreRow
              label={t('comparison.core.libraryCredits')}
              values={TIERS.map((tier) =>
                t('comparison.core.libraryUnit', { count: byTier(tier)?.libraryCredits ?? 0 })
              )}
            />

            {PLAN_COMPARISON.map((group) => (
              <Fragment key={group.key}>
                <GroupRow label={t(`comparison.groups.${group.key}`)} highlight={group.highlight} />
                {group.rows.map((row) => (
                  <tr key={row.key} className='even:bg-muted/20'>
                    <th className='bg-card sticky left-0 z-10 border-r p-3 text-left text-xs font-medium'>
                      {tRows(row.key)}
                    </th>
                    {TIERS.map((tier) => (
                      <td
                        key={tier}
                        className={cn('p-3 text-center text-xs', tier === POPULAR_TIER && 'bg-brand-orange-soft/60')}
                      >
                        <Cell value={row.values[tier]} label={tValues} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}

            <tr>
              <th className='bg-card sticky left-0 z-10 border-t border-r p-3 text-left text-xs font-medium'>
                {t('comparison.choosePlanRow')}
              </th>
              {TIERS.map((tier) => {
                const plan = byTier(tier)
                return (
                  <td
                    key={tier}
                    className={cn('border-t p-3 text-center', tier === POPULAR_TIER && 'bg-brand-orange-soft/60')}
                  >
                    {plan ? (
                      <Button
                        asChild
                        size='sm'
                        variant={plan.popular ? 'default' : 'outline'}
                        className='text-xs font-bold tracking-wide uppercase'
                      >
                        <Link href={checkoutConfirmRoute(plan.id)}>{t(`cta.${tier}`)}</Link>
                      </Button>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Bảng "Giá trị khách hàng nhận được" (S01). */
function ValueTable() {
  const t = useTranslations('plans.value')

  return (
    <section>
      <h2 className='text-primary-strong text-center text-xl font-bold tracking-wide uppercase'>{t('title')}</h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[640px] table-fixed border-collapse text-sm'>
          <colgroup>
            <col className='w-[28%]' />
            <col className='w-[24%]' />
            <col className='w-[24%]' />
            <col className='w-[24%]' />
          </colgroup>
          <tbody>
            {PLAN_VALUE_ROWS.map((row) => (
              <tr key={row} className='even:bg-muted/20'>
                <th className='bg-accent/40 sticky left-0 z-10 border-r p-3.5 text-left text-sm font-medium'>
                  <span className='text-primary-strong flex items-center gap-2.5'>
                    {(() => {
                      const Icon = VALUE_ROW_ICON[row]
                      return <Icon className='text-primary size-4.5 shrink-0' />
                    })()}
                    {t(`rows.${row}`)}
                  </span>
                </th>
                {TIERS.map((tier) => (
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

function GroupRow({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <tr>
      <th
        colSpan={TIERS.length + 1}
        className={cn(
          'p-2.5 text-left text-xs font-semibold tracking-wide uppercase',
          highlight ? 'bg-brand-orange text-brand-orange-foreground' : 'bg-primary text-primary-foreground'
        )}
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
        <td
          key={`${label}-${index}`}
          className={cn('p-3 text-center text-xs', TIERS[index] === POPULAR_TIER && 'bg-brand-orange-soft/60')}
        >
          {value}
        </td>
      ))}
    </tr>
  )
}

/** Ô của bảng so sánh: tích, gạch ngang, hoặc chữ từ khóa dịch. */
function Cell({ value, label }: { value: PlanCell; label: (key: PlanValueKey) => string }) {
  if (value === true) return <Check className='text-primary mx-auto size-4' strokeWidth={2.5} />
  if (value === false) return <Minus className='text-muted-foreground mx-auto size-4' />
  return <span className='text-pretty'>{label(value)}</span>
}
