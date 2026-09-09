'use client'

import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Gift,
  HardHat,
  Info,
  Leaf,
  Minus,
  MousePointerClick,
  QrCode,
  ShieldCheck,
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
import { formatPriceTag } from '@/shared/utils'
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

  // Ảnh S01: cụm thẻ + bảng so sánh chiếm ~88% bề ngang màn hình, và CỠ CHỮ
  // trong thẻ phải lớn theo bề rộng thẻ (tên gói ~8,3% bề rộng thẻ, giá ~10%)
  // — giữ chữ nhỏ như hệ thống mặc định là trang trông loãng, khác hẳn ảnh.
  return (
    <div className='mx-auto w-full max-w-[80rem] space-y-8 px-4 py-10 lg:px-8'>
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
        <ul className='grid items-stretch gap-6 pt-4 md:grid-cols-3'>
          {plans?.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} onOpenGift={() => setGiftPlan(plan)} />
          ))}
        </ul>
      )}

      {/* Dải CTA giữa trang — trong ảnh nó nằm SÁT ngay dưới cụm thẻ (khoảng
          cách chỉ bằng ~1/3 khoảng cách giữa các khối khác). */}
      <section className='bg-accent/40 -mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-6 py-5'>
        <div className='flex items-center gap-4'>
          {/* Hình S01: dải CTA mở đầu bằng một icon hồ sơ trong ô bo góc. */}
          <span className='bg-card text-primary flex size-11 shrink-0 items-center justify-center rounded-xl border'>
            <FileText aria-hidden className='size-5' />
          </span>
          <div>
            <p className='font-semibold text-pretty'>{t('ctaBand.title')}</p>
            <p className='text-muted-foreground text-sm text-pretty'>{t('ctaBand.subtitle')}</p>
          </div>
        </div>
        <Button asChild size='lg' className='brand-green-button'>
          <Link href={checkoutConfirmRoute('advanced')}>
            {t('ctaBand.action')}
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      </section>

      {plans ? <ComparisonTable plans={plans} /> : null}
      {plans ? <ValueTable /> : null}

      {/* Hình S01: bốn ghi chú nằm trong khối nền nhạt, còn dòng phạm vi hồ sơ
          đứng riêng bên dưới khối và căn giữa.

          Mỗi ghi chú có ICON RIÊNG trong một vòng tròn nền xanh nhạt, đường kính
          gấp đôi cỡ chữ (đo trên ảnh ~28px so với chữ ~13px) — không phải cùng
          một dấu ⓘ nhỏ cho cả bốn dòng. */}
      <div className='space-y-3'>
        <ul className='bg-accent/30 text-muted-foreground grid gap-x-8 gap-y-4 rounded-2xl border p-5 text-xs sm:grid-cols-2 lg:grid-cols-3'>
          {(
            [
              { key: 'payment', icon: QrCode },
              { key: 'credits', icon: CalendarClock },
              { key: 'estimate', icon: ShieldCheck },
              { key: 'gift', icon: Building2 }
            ] as const
          ).map((note) => (
            <li key={note.key} className='flex items-start gap-3'>
              <span className='bg-accent text-primary flex size-8 shrink-0 items-center justify-center rounded-full'>
                <note.icon aria-hidden className='size-4' />
              </span>
              <span className='pt-1 text-pretty'>{t(`notes.${note.key}`)}</span>
            </li>
          ))}
        </ul>
        <p className='text-muted-foreground flex items-start justify-center gap-2 text-center text-xs text-pretty'>
          <Info className='mt-0.5 size-3.5 shrink-0' />
          <span>{t('notes.scope')}</span>
        </p>
      </div>

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
    <li className='@container relative flex'>
      {/* Đo trên ảnh S01: ruy-băng cao 8,1% bề rộng thẻ, nhô lên khỏi mép thẻ
          2,0% và cách chữ tên gói 4,5%. */}
      {plan.popular ? (
        <span className='bg-brand-orange text-brand-orange-foreground absolute -top-[2cqw] left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-[1.5cqw] rounded-full px-[4cqw] py-[2.25cqw] text-[3.6cqw] leading-none font-semibold tracking-wide whitespace-nowrap uppercase'>
          <Star className='size-[3.4cqw]' />
          {t('popular')}
        </span>
      ) : null}

      <section
        className={cn(
          // `@container`: mọi cỡ chữ trong thẻ tính theo BỀ RỘNG THẺ (đơn vị cqw)
          // đúng tỉ lệ đo được trên ảnh S01 — tên gói 8,3% bề rộng thẻ, giá 10%,
          // chữ thường 4,6%. Cỡ chữ cố định thì ở khổ hẹp chữ tràn dòng, ở khổ
          // rộng chữ lọt thỏm; cả hai đều làm thẻ trông khác ảnh.
          '@container bg-card flex w-full flex-col overflow-hidden rounded-2xl border',
          // Đo trên ảnh S01: cả ba thẻ CAO BẰNG NHAU (mép trên cùng y=238, nút
          // cuối thẻ cùng y=744) — chỉ ruy-băng "Phổ biến nhất" nhô lên khỏi mép.
          plan.popular ? 'border-brand-orange shadow-md' : 'border-border'
        )}
      >
        <header
          className={cn(
            // `relative` + viên nhãn đặt tuyệt đối: đo trên ảnh S01, dải nền kết
            // thúc ở y=291 còn viên nhãn kéo tới y=298 — tức nó CƯỠI LÊN mép dưới
            // của dải: đo trên ảnh, viên nhãn cao 6,5% bề rộng thẻ và NẰM GIỮA mép
            // dải (một nửa trong nền, một nửa ngoài).
            //
            // Khoảng đệm trên đo theo ảnh: thẻ thường 6,3% bề rộng thẻ; thẻ PLUS
            // 9,8% vì còn phải chừa chỗ cho ruy-băng nằm đè lên mép trên.
            'relative px-5 text-center',
            // Thẻ PLUS CÓ dải nền như hai thẻ kia, chỉ là màu kem rất nhạt thay
            // vì xanh (đo trên ảnh: nền header 255,243,231 so với thân thẻ trắng).
            plan.popular
              ? 'bg-brand-orange-soft/50 pt-[9.8cqw] pb-[5.5cqw]'
              : 'from-primary-strong to-primary text-primary-foreground bg-linear-to-r pt-[6.3cqw] pb-[8cqw]'
          )}
        >
          <h2
            className={cn(
              'flex items-center justify-center gap-[1.5cqw] text-[8.3cqw] leading-none font-bold tracking-wide uppercase',
              plan.popular ? 'text-brand-orange' : 'text-primary-foreground'
            )}
          >
            {t(`tiers.${plan.tier}`)}
            {/* Hình S01: mỗi tên gói có một chiếc lá nhỏ đứng ngay sau. */}
            <Leaf
              aria-hidden
              className={cn('size-[5cqw]', plan.popular ? 'text-brand-orange' : 'text-primary-foreground')}
            />
          </h2>
          <span
            className={cn(
              'absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full px-[3.5cqw] py-[1.6cqw] text-[3.6cqw] leading-none font-semibold tracking-wide whitespace-nowrap uppercase',
              // Hình S01: viên nhãn là nền ĐẶC (xanh đậm hơn dải nền / cam), không phải nền mờ.
              plan.popular
                ? 'bg-brand-orange text-brand-orange-foreground'
                : 'bg-primary-strong text-primary-foreground'
            )}
          >
            {t(`tierTags.${plan.tier}`)}
          </span>
        </header>

        <div className='flex flex-1 flex-col p-5'>
          {plan.imageUrl ? (
            <Photo src={plan.imageUrl} alt='' className='aspect-[16/10] w-full rounded-xl' sizes='360px' />
          ) : null}

          <p className='text-muted-foreground mt-4 text-center text-[4.6cqw] leading-snug text-pretty'>
            {plan.fitLine}
          </p>

          <p className='mt-3 text-center'>
            <span
              className={cn(
                'text-[10cqw] font-bold tracking-tight',
                plan.popular ? 'text-brand-orange' : 'text-primary-strong'
              )}
            >
              {formatPriceTag(plan.price, locale)}
            </span>
            <span className='text-muted-foreground block text-[3.9cqw]'>{t('oneTime')}</span>
          </p>

          {/* Hình S01: danh sách tính năng nằm trong MỘT khung viền, tiêu đề
              in hoa canh giữa ngay bên trong khung; dấu tích đổi màu theo gói. */}
          <div className='mt-5 flex flex-1 flex-col rounded-xl border p-4'>
            <p
              className={cn(
                'text-center text-[4.4cqw] font-bold tracking-wide uppercase',
                plan.popular ? 'text-brand-orange' : 'text-primary-strong'
              )}
            >
              {t(`featuresTitleByTier.${plan.tier}`)}
            </p>
            <ul className='mt-3 flex-1 space-y-2'>
              {(plan.features ?? [plan.perk]).map((feature) => (
                <li key={feature} className='flex items-start gap-[2cqw] text-[4.5cqw] leading-snug'>
                  <CheckCircle2
                    className={cn(
                      'mt-[0.6cqw] size-[4.6cqw] shrink-0',
                      plan.popular ? 'text-brand-orange' : 'text-primary'
                    )}
                  />
                  <span className='text-pretty'>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hình S01 — khối quà tặng của thẻ PRO: ảnh hộp quà bên trái; bên phải
              là nhãn "QUÀ TẶNG ĐẶC BIỆT", tên quà, rồi GIÁ TRỊ cỡ lớn màu cam;
              dòng điều kiện chạy hết bề ngang bên dưới. Cả khối là nút mở popup
              S02 (bản mô tả: "bấm khối quà tặng ở thẻ PRO"), nên KHÔNG có thêm
              liên kết "Xem chi tiết quà tặng" như trước. */}
          {plan.gift ? (
            <button
              type='button'
              onClick={onOpenGift}
              className='border-brand-orange/30 bg-brand-orange-soft/60 hover:bg-brand-orange-soft mt-4 w-full rounded-xl border p-2.5 text-left transition-colors'
            >
              <span className='flex items-center gap-2'>
                {/* CHỖ CHỜ ASSET: ảnh hộp quà của khách. Còn trống thì dùng icon
                    cùng khung để bố cục không nhảy khi ảnh về. */}
                {/* Ảnh hộp quà trong bản mô tả to bằng ~36% bề rộng thẻ, không
                    phải một icon nhỏ. Giữ nguyên khung này khi khách gửi ảnh thật. */}
                <span className='bg-card flex size-[34cqw] shrink-0 items-center justify-center overflow-hidden rounded-lg'>
                  {plan.gift.imageUrl ? (
                    <Photo src={plan.gift.imageUrl} alt='' className='size-[34cqw]' sizes='120px' />
                  ) : (
                    <Gift aria-hidden className='text-brand-orange size-[22cqw]' />
                  )}
                </span>

                <span className='min-w-0 flex-1 text-center'>
                  <span className='text-primary-strong block text-[3.6cqw] font-bold tracking-wide uppercase'>
                    {t('gift.badge')}
                  </span>
                  <span className='text-muted-foreground mt-0.5 block text-[3.3cqw] leading-snug text-pretty'>
                    {plan.gift.title} {t('gift.valuePrefix')}
                  </span>
                  <span className='text-brand-orange block text-[5.4cqw] font-extrabold tracking-tight whitespace-nowrap uppercase'>
                    {giftMillions
                      ? `${giftMillions} ${t('gift.valueMillionsUnit')}`
                      : formatPriceTag(plan.gift.value, locale)}
                  </span>
                </span>
              </span>

              <span className='text-muted-foreground mt-2 block text-center text-[3.1cqw] leading-snug text-pretty'>
                {plan.gift.conditionsShort}
              </span>
            </button>
          ) : null}

          {/* Hình S01: cả ba nút đều là nút đặc, chữ in hoa; riêng gói PLUS
              tô cam thay vì xanh. */}
          <Button
            asChild
            size='lg'
            className={cn(
              'mt-5 h-[11cqw] w-full text-[5cqw] font-bold tracking-wide uppercase',
              // Hình S01: nút nền PHẲNG một màu, không có lớp bóng gradient.
              plan.popular ? 'brand-orange-button' : 'brand-green-button'
            )}
          >
            <Link href={checkoutConfirmRoute(plan.id)} className='justify-between'>
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

  const byTier = (tier: PlanTier) => plans.find((plan) => plan.tier === tier)

  return (
    <section>
      {/* Hình S01: riêng tiêu đề bảng so sánh viết thường (chỉ "GIÁ TRỊ KHÁCH
          HÀNG NHẬN ĐƯỢC" phía dưới mới IN HOA). */}
      <h2 className='text-primary-strong text-center text-xl font-bold tracking-wide'>{t('comparison.title')}</h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[720px] table-fixed border-collapse text-sm'>
          <colgroup>
            <col className='w-[28%]' />
            <col className='w-[24%]' />
            <col className='w-[24%]' />
            <col className='w-[24%]' />
          </colgroup>
          <thead>
            {/* Đo trên ảnh S01: bảng CÓ kẻ dọc giữa các cột (xám rất nhạt) nhưng
                KHÔNG kẻ ngang giữa các dòng và KHÔNG sọc xen kẽ. */}
            <tr className='divide-border divide-x'>
              {/* Hình S01: ô đầu bảng ghi "HẠNG MỤC" IN HOA và CĂN GIỮA ô (đo trên
                  ảnh: tâm chữ trùng tâm cột đầu), khác với các dòng bên dưới căn trái. */}
              <th className='bg-card sticky left-0 z-10 border-b px-3 py-2.5 text-center text-xs font-semibold tracking-wide uppercase'>
                {t('comparison.criterion')}
              </th>
              {TIERS.map((tier) => (
                <th
                  key={tier}
                  className={cn('border-b px-3 py-2.5 text-center', tier === POPULAR_TIER && 'bg-brand-orange-soft')}
                >
                  <span
                    className={cn(
                      'block font-bold tracking-wide uppercase',
                      tier === POPULAR_TIER ? 'text-brand-orange' : 'text-primary-strong'
                    )}
                  >
                    {t(`tiers.${tier}`)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className='divide-border divide-y'>
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
                  <tr key={row.key} className='divide-border divide-x'>
                    <th className='bg-card sticky left-0 z-10 px-3 py-2 text-left text-xs font-medium'>
                      {tRows(row.key)}
                    </th>
                    {TIERS.map((tier) => (
                      <td
                        key={tier}
                        className={cn(
                          'px-3 py-2 text-center text-xs',
                          tier === POPULAR_TIER && 'bg-brand-orange-soft/60'
                        )}
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
          {/* Hình S01: bảng này CÓ đường kẻ ô rõ — kẻ dọc giữa bốn cột và kẻ
              ngang giữa bốn hàng — khác bảng so sánh phía trên (chỉ có dải nhóm,
              không kẻ ô). Cột đầu nền xanh nhạt, chữ trong ô căn giữa hai dòng. */}
          <tbody className='divide-border divide-y'>
            {PLAN_VALUE_ROWS.map((row) => (
              <tr key={row} className='divide-border divide-x'>
                <th className='bg-accent/40 sticky left-0 z-10 p-3.5 text-left text-sm font-medium'>
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
          // Hình S01: dải nhóm là một vạch MỎNG, chữ nhỏ; xanh đậm chứ không
          // phải xanh chính của nút.
          'px-3 py-1.5 text-left text-[11px] font-semibold tracking-wide uppercase',
          highlight ? 'bg-brand-orange text-brand-orange-foreground' : 'bg-primary-strong text-primary-foreground'
        )}
      >
        {label}
      </th>
    </tr>
  )
}

function CoreRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className='divide-border divide-x'>
      <th className='bg-card sticky left-0 z-10 px-3 py-2 text-left text-xs font-medium'>{label}</th>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={cn('px-3 py-2 text-center text-xs', TIERS[index] === POPULAR_TIER && 'bg-brand-orange-soft/60')}
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
