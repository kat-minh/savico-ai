'use client'

import {
  ArrowRight,
  ChartColumn,
  Check,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Construction,
  FileText,
  Handshake,
  House,
  ImageIcon,
  Info,
  MapPin,
  Leaf,
  Minus,
  Monitor,
  QrCode,
  Ruler,
  ShieldCheck,
  Star,
  UserSearch
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment } from 'react'

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
  SUPERVISION_COMPARISON,
  SUPERVISION_TIERS,
  SUPERVISION_VALUE_ROWS,
  type JourneyStepKey,
  type SupervisionCell,
  type SupervisionValueKey,
  type SupervisionValueRowKey
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

      {/* pt đủ chỗ cho ruy-băng "Khuyến nghị" NẰM TRÊN viên nhãn nhóm gói: viên
          nhãn cưỡi lên mép trên thẻ (-mt-8) nên hai thứ này từng chồng chữ lên
          nhau ở thẻ được khuyến nghị. */}
      <ul className='grid items-stretch gap-6 pt-11 md:grid-cols-3'>
        {packages.map((item) => (
          <PackageCard key={item.tier} item={item} projectId={projectId} />
        ))}
      </ul>

      <p className='text-muted-foreground mx-auto flex max-w-3xl items-start justify-center gap-2 text-center text-sm'>
        <Info className='mt-0.5 size-4 shrink-0' />
        <span className='text-pretty'>{t('costNote')}</span>
      </p>

      <ComparisonTable packages={packages} projectId={projectId} />

      {/* Hai khối cao BẰNG NHAU (lưới giãn mặc định). Khối nguyên tắc ít chữ
          hơn nên phần dôi ra được chia đều cho ba gạch đầu dòng thay vì dồn
          thành một mảng trống ở đáy — xem `ScopeRules`. */}
      {/* Tỉ lệ 59% / 39% đo từ ảnh S19: bảng phụ phí có ba cột nên cần bề
          ngang, khối nguyên tắc chỉ là ba dòng chữ. Chia đôi 50/50 làm bảng bên
          trái bị bó, chữ trong ô xuống dòng lắt nhắt. */}
      <div className='grid gap-x-[2%] gap-y-5 lg:grid-cols-[59%_minmax(0,1fr)]'>
        <AddonTable />
        <ScopeRules />
      </div>

      <Journey />
      <ValueTable />

      {/* Ba ghi chú là BA Ô RIÊNG chứ không phải ba cột trong một mảng nền —
          mỗi ô một icon tròn viền, đúng dải cuối Hình S19. */}
      <ul className='grid items-stretch gap-4 sm:grid-cols-3'>
        {[
          { icon: QrCode, text: t('notes.payment') },
          { icon: Ruler, text: t('notes.scope') },
          { icon: MapPin, text: t('notes.area') }
        ].map((note) => (
          <li
            key={note.text}
            className='bg-muted/40 text-muted-foreground flex items-start gap-3 rounded-2xl border p-4 text-sm'
          >
            <span className='border-primary/40 text-primary flex size-8 shrink-0 items-center justify-center rounded-full border'>
              <note.icon aria-hidden className='size-4' />
            </span>
            <span className='text-pretty'>{note.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Nút gói CONTROL tô cam (Hình S19) — dùng ở thẻ gói và ở hàng chọn gói cuối
 * bảng so sánh, nên tách hằng số để hai chỗ không lệch nhau.
 */
const ORANGE_BUTTON =
  // `bg-none` là bắt buộc: biến thể mặc định của Button phủ nền bằng CLASS
  // `brand-gradient` (background-image), mà `bg-brand-orange` chỉ đổi
  // background-color nên gradient xanh vẫn nằm đè lên. Quầng bóng cũng phải
  // đổi sang cam, nếu không nút cam lại toả sáng xanh.
  'bg-brand-orange bg-none text-brand-orange-foreground hover:bg-brand-orange/90 shadow-[0_1px_--theme(--color-white/0.12)_inset,0_2px_6px_--theme(--color-brand-orange/0.35),0_8px_22px_-6px_--theme(--color-brand-orange/0.5)] focus-visible:ring-brand-orange/30'

/** Cột SVC CONTROL được tô nền nhạt suốt bảng để mắt bám theo một cột. */
const CONTROL_COLUMN = 'bg-brand-orange-soft/35'

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
        <span className='bg-brand-orange text-brand-orange-foreground absolute -top-10 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-4 py-1 text-xs font-semibold tracking-wide uppercase whitespace-nowrap'>
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

        {/* CHỖ CHỜ ASSET: Hình S19 dùng tranh minh hoạ riêng cho từng gói
            (người tự theo dõi công trình · kỹ sư SVC cầm bảng kiểm · kỹ sư
            đồng hành trọn công trình). Chưa có tranh thật thì để KHUNG NÉT
            ĐỨT — nhét ảnh kho vào đây trông như đã xong nên không ai biết là
            còn thiếu. Đội vận hành tải ảnh lên là hiện, không phải sửa code. */}
        {item.imageUrl ? (
          <Photo src={item.imageUrl} alt='' className='mt-4 aspect-16/10 w-full rounded-xl' sizes='360px' />
        ) : (
          <div className='bg-muted/30 text-muted-foreground/50 mt-4 flex aspect-16/10 w-full items-center justify-center rounded-xl border border-dashed'>
            <ImageIcon aria-hidden className='size-7' />
          </div>
        )}

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
            !item.inspections && 'bg-muted text-muted-foreground',
            item.inspections &&
              (item.recommended ? 'bg-brand-orange-soft text-brand-orange' : 'bg-accent text-primary-strong')
          )}
        >
          {item.inspections ? t('inspections', { count: item.inspections }) : t('noInspection')}
        </p>

        {/* Ba gói ba kiểu dấu tick, đúng Hình S19: gói miễn phí là vòng tròn
            RỖNG (quyền lợi có sẵn, không phải thứ mua thêm), hai gói trả phí là
            vòng tròn TÔ ĐẶC theo màu gói. */}
        <ul className='mt-4 flex-1 space-y-2'>
          {item.benefits.map((benefit) => (
            <li key={benefit} className='flex items-start gap-2 text-sm'>
              <CircleCheck
                aria-hidden
                className={cn(
                  'mt-0.5 size-4.5 shrink-0',
                  isFree && 'text-primary/70',
                  !isFree &&
                    (item.recommended
                      ? 'fill-brand-orange text-brand-orange-foreground'
                      : 'fill-primary text-primary-foreground')
                )}
              />
              <span className='text-pretty'>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Gói miễn phí KHÔNG có nút: Hình S19 để thẻ này kết thúc ở danh sách
            quyền lợi. Tự quản lý là trạng thái mặc định của mọi dự án, không có
            gì để "chọn" — nút ở đây chỉ tạo một thao tác thừa.
            Hai nút trả phí đều TÔ ĐẶC — CHECK xanh, CONTROL cam. */}
        {isFree ? null : (
          <Button asChild size='lg' className={cn('mt-5 w-full', item.recommended && ORANGE_BUTTON)}>
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
function ComparisonTable({ packages, projectId }: { packages: SupervisionPackage[]; projectId?: string }) {
  const t = useTranslations('supervision.pricing.comparison')
  const tTiers = useTranslations('supervision.tiers')
  const tRows = useTranslations('supervision.pricing.comparison.rows')
  const tValues = useTranslations('supervision.pricing.comparison.values')
  const tPricing = useTranslations('supervision.pricing')
  const locale = useLocale() as Locale

  const byTier = (tier: SupervisionTier) => packages.find((item) => item.tier === tier)

  return (
    <section>
      <h2 className='text-primary-strong text-center text-xl font-semibold tracking-tight'>{t('title')}</h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[720px] border-collapse text-sm'>
          <thead>
            {/* `divide-x` kẻ vạch DỌC giữa các cột. Ô cột đầu bỏ `border-r` để
                khỏi chồng hai đường ở ranh giới cột 1–2. */}
            <tr className='divide-x'>
              <th className='bg-card text-primary-strong sticky left-0 z-10 w-56 border-b p-4 text-center text-xs font-semibold tracking-wide uppercase'>
                {t('criterion')}
              </th>
              {SUPERVISION_TIERS.map((tier) => (
                <th key={tier} className={cn('border-b p-4 text-center', tier === 'control' && CONTROL_COLUMN)}>
                  <span
                    className={cn(
                      'block font-bold tracking-wide uppercase',
                      tier === 'control' ? 'text-brand-orange' : 'text-primary-strong'
                    )}
                  >
                    {tTiers(tier)}
                  </span>
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
                  <tr key={row.key} className='divide-x border-b even:bg-muted/20'>
                    <th className='bg-card sticky left-0 z-10 p-3 text-left text-xs font-medium'>{tRows(row.key)}</th>
                    {SUPERVISION_TIERS.map((tier) => (
                      <td key={tier} className={cn('p-3 text-center text-xs', tier === 'control' && CONTROL_COLUMN)}>
                        <Cell value={row.values[tier]} label={tValues} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>

          {/* Bản mô tả S19: bảng so sánh kết thúc bằng HÀNG CHỌN GÓI, để khách
              quyết ngay tại chỗ vừa đối chiếu xong thay vì cuộn ngược lên thẻ. */}
          <tfoot>
            <tr className='divide-x border-t'>
              <th className='bg-card sticky left-0 z-10 p-3 text-left text-xs font-medium'>{t('choosePlanRow')}</th>
              {SUPERVISION_TIERS.map((tier) => {
                const item = byTier(tier)
                return (
                  <td key={tier} className={cn('p-3 text-center', tier === 'control' && CONTROL_COLUMN)}>
                    {item && item.price > 0 ? (
                      <Button asChild size='sm' className={cn(item.recommended && ORANGE_BUTTON)}>
                        <Link href={checkoutConfirmRoute(item.id, projectId)}>
                          {tPricing('choose', { tier: tTiers(tier) })}
                        </Link>
                      </Button>
                    ) : (
                      <span className='text-muted-foreground text-xs'>—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          </tfoot>
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
    // Hình S19: hai khối này là PANEL NỀN MÀU, không viền — kem cho bảng phụ
    // phí, xanh nhạt cho phần nguyên tắc. Để `bg-card` + viền như các thẻ khác
    // thì cả dải này chìm nghỉm giữa bảng so sánh và sơ đồ hành trình.
    <section className='bg-brand-orange-soft/60 rounded-2xl border p-5'>
      <h2 className='text-primary-strong text-center text-base font-semibold'>{t('title')}</h2>

      {/* Viền ngoài nằm ở lớp bọc chứ không đặt trên <table>: bo góc trên
          chính bảng sẽ bị các ô vuông góc của hàng đầu/cuối đè lên. */}
      <div className='mt-3 overflow-hidden rounded-lg border'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            {/* `divide-x` trên hàng kẻ vạch DỌC giữa các ô — bảng phụ phí ở
                Hình S19 có lưới đủ cả ngang lẫn dọc, khác bảng so sánh phía trên
                chỉ kẻ ngang. */}
            <tr className='text-muted-foreground divide-x text-[11px] tracking-wide uppercase'>
              <th className='border-b p-2 text-left font-medium'>{t('item')}</th>
              <th className='border-b p-2 text-center font-medium'>{t('price')}</th>
              <th className='border-b p-2 text-center font-medium'>{t('note')}</th>
            </tr>
          </thead>
          <tbody>
            {ADDONS.map((key) => (
              <tr key={key} className='divide-x border-b last:border-b-0'>
                <td className='p-2 text-xs font-medium'>{key === 'extend' ? t('extend', { months }) : t(key)}</td>
                <td className='p-2 text-center text-xs font-medium'>{t(`${key}Price`)}</td>
                <td className='text-muted-foreground p-2 text-center text-xs'>{t(`${key}Note`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Khối "Nguyên tắc phạm vi dịch vụ". */
function ScopeRules() {
  const t = useTranslations('supervision.pricing.scope')

  return (
    <section className='bg-info-soft flex h-full flex-col rounded-2xl border p-5'>
      <h2 className='text-primary-strong flex items-center gap-2.5 text-base font-semibold'>
        <ShieldCheck className='size-5 shrink-0' strokeWidth={1.75} />
        {t('title')}
      </h2>
      {/* `flex-1` + `justify-between`: chỗ dôi ra so với bảng phụ phí bên cạnh
          được rải đều giữa ba dòng, nên khối trông đầy chứ không phải ba dòng
          dính đỉnh rồi bỏ trống nửa dưới. */}
      <ul className='mt-3 flex flex-1 flex-col justify-between gap-3'>
        {[t('r1'), t('r2'), t('r3')].map((rule) => (
          <li key={rule} className='flex items-start gap-3 text-sm'>
            <span aria-hidden className='bg-foreground/70 mt-2 size-1.5 shrink-0 rounded-[2px]' />
            <span className='text-pretty'>{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Sơ đồ "Hành trình khách hàng" (Hình S19).
 *
 * Đây là một DÒNG CHẢY NGANG có nhánh, không phải lưới 9 thẻ: bước 1→3 chạy
 * thẳng, tới bước 3 thì rẽ đôi (4A tự quản lý / 4B SVC giám sát) rồi nhập lại
 * vào bước 5. Vẽ thành lưới đều nhau thì mất đúng cái thông tin quan trọng
 * nhất của sơ đồ — chỗ khách phải chọn.
 *
 * Dấu `+` nối các bước liền mạch, mũi tên `→` đánh dấu chỗ rẽ và chỗ nhập lại.
 * Cả dải cuộn ngang trên màn hẹp thay vì xuống dòng — bẻ dòng một sơ đồ luồng
 * là làm hỏng mạch đọc.
 */
const JOURNEY_ICONS: Record<JourneyStepKey, typeof Monitor> = {
  s1: Monitor,
  s2: UserSearch,
  s3: ClipboardList,
  s4a: Handshake,
  s4b: ShieldCheck,
  s5: Construction,
  s6: ChartColumn,
  s7: ClipboardCheck,
  s8: House
}

function Journey() {
  const t = useTranslations('supervision.pricing.journey')

  const before: JourneyStepKey[] = ['s1', 's2', 's3']
  const after: JourneyStepKey[] = ['s5', 's6', 's7', 's8']

  return (
    <section className='bg-card rounded-2xl border p-5'>
      <h2 className='text-primary-strong text-lg font-semibold tracking-wide uppercase'>{t('title')}</h2>

      <div className='mt-6 flex items-stretch gap-1.5 overflow-x-auto pt-4 pb-2'>
        {before.map((step, index) => (
          <Fragment key={step}>
            {index > 0 ? <FlowJoin /> : null}
            <JourneyCard step={step} number={index + 1} />
          </Fragment>
        ))}

        <BranchSplit />

        <div className='flex shrink-0 flex-col justify-between gap-2'>
          <BranchCard step='s4a' badge='4A' />
          <BranchCard step='s4b' badge='4B' highlighted />
        </div>

        <BranchMerge />

        {after.map((step, index) => (
          <Fragment key={step}>
            {index > 0 ? <FlowJoin /> : null}
            <JourneyCard step={step} number={index + 5} />
          </Fragment>
        ))}
      </div>
    </section>
  )
}

/** Mũi tên nối hai bước đi thẳng. */
function FlowJoin() {
  return <ArrowRight aria-hidden className='text-muted-foreground size-4 shrink-0 self-center' />
}

/**
 * Nét rẽ nhánh sau bước 3: một đoạn ngang tách thành hai ngạnh chạy lên 4A và
 * xuống 4B. Vẽ bằng các đoạn định vị theo PHẦN TRĂM chiều cao hàng chứ không
 * bằng SVG tỉ lệ cố định — chiều cao dải phụ thuộc nội dung thẻ, ngạnh phải tự
 * bám theo tâm hai thẻ nhánh (≈25% và ≈75%).
 */
function BranchSplit() {
  return (
    <div aria-hidden className='relative w-8 shrink-0 self-stretch'>
      <span className='bg-border absolute top-1/2 left-0 h-px w-1/2' />
      <span className='bg-border absolute top-1/4 bottom-1/4 left-1/2 w-px' />
      <span className='bg-border absolute top-1/4 right-2 left-1/2 h-px' />
      <span className='bg-border absolute right-2 bottom-1/4 left-1/2 h-px' />
      <ChevronRight className='text-muted-foreground absolute top-1/4 right-0 size-3.5 -translate-y-1/2' />
      <ChevronRight className='text-muted-foreground absolute right-0 bottom-1/4 size-3.5 translate-y-1/2' />
    </div>
  )
}

/** Nét nhập lại: hai ngạnh từ 4A và 4B gộp về một mũi tên vào bước 5. */
function BranchMerge() {
  return (
    <div aria-hidden className='relative w-8 shrink-0 self-stretch'>
      <span className='bg-border absolute top-1/4 left-0 h-px w-1/2' />
      <span className='bg-border absolute bottom-1/4 left-0 h-px w-1/2' />
      <span className='bg-border absolute top-1/4 bottom-1/4 left-1/2 w-px' />
      <span className='bg-border absolute top-1/2 right-2 left-1/2 h-px' />
      <ChevronRight className='text-muted-foreground absolute top-1/2 right-0 size-3.5 -translate-y-1/2' />
    </div>
  )
}

/** Một bước trên dòng chính: số ở mép trên, tên, icon, rồi mô tả. */
function JourneyCard({ step, number }: { step: JourneyStepKey; number: number }) {
  const t = useTranslations('supervision.pricing.journey')
  const Icon = JOURNEY_ICONS[step]

  return (
    <div className='bg-card relative flex w-32 shrink-0 flex-col items-center rounded-xl border px-2.5 pt-5 pb-4 text-center'>
      <span className='bg-primary text-primary-foreground absolute -top-3.5 flex size-7 items-center justify-center rounded-full text-xs font-semibold'>
        {number}
      </span>
      {/* Ô tên cao cố định bằng HAI dòng: tên một dòng và tên hai dòng đều
          chiếm chỗ như nhau, nhờ vậy icon và mô tả của tám bước nằm thẳng hàng
          thay vì chỗ lồi chỗ lõm. */}
      <p className='flex min-h-9 items-center text-sm leading-tight font-medium text-pretty'>{t(step)}</p>
      <Icon aria-hidden className='text-primary my-3 size-8 shrink-0' strokeWidth={1.5} />
      <p className='text-muted-foreground text-[11px] leading-snug text-pretty'>{t(`${step}Body`)}</p>
    </div>
  )
}

/** Một nhánh của bước 4 — rộng hơn, số và tên nằm cùng một dòng. */
function BranchCard({ step, badge, highlighted }: { step: JourneyStepKey; badge: string; highlighted?: boolean }) {
  const t = useTranslations('supervision.pricing.journey')
  const Icon = JOURNEY_ICONS[step]

  return (
    <div
      className={cn(
        'w-52 shrink-0 rounded-xl border p-3',
        highlighted ? 'border-brand-orange bg-brand-orange-soft/50' : 'bg-card'
      )}
    >
      <p className='flex items-center gap-2'>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
            highlighted ? 'bg-brand-orange text-brand-orange-foreground' : 'bg-primary text-primary-foreground'
          )}
        >
          {badge}
        </span>
        <span className={cn('text-sm font-medium', highlighted && 'text-brand-orange')}>{t(step)}</span>
      </p>
      <div className='mt-2.5 flex items-start gap-2.5'>
        <Icon
          aria-hidden
          className={cn('size-8 shrink-0', highlighted ? 'text-brand-orange' : 'text-primary')}
          strokeWidth={1.5}
        />
        <p className='text-muted-foreground text-[11px] leading-snug text-pretty'>{t(`${step}Body`)}</p>
      </div>
    </div>
  )
}

/** Bảng "Giá trị khách hàng nhận được". */
/** Icon đứng trước tên từng hàng giá trị (Hình S19). */
const VALUE_ICONS: Record<SupervisionValueRowKey, typeof ShieldCheck> = {
  calm: ShieldCheck,
  transparent: FileText,
  quality: ClipboardCheck,
  handover: House
}

function ValueTable() {
  const t = useTranslations('supervision.pricing.value')
  const tTiers = useTranslations('supervision.tiers')

  return (
    <section>
      <h2 className='text-primary-strong text-center text-xl font-semibold tracking-wide uppercase'>{t('title')}</h2>

      <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
        <table className='w-full min-w-[640px] border-collapse text-sm'>
          <thead>
            {/* `divide-x` kẻ vạch dọc giữa các cột, giống bảng phụ phí. */}
            <tr className='bg-muted/40 divide-x text-xs'>
              <th className='border-b p-3 text-left font-medium' />
              {SUPERVISION_TIERS.map((tier) => (
                <th
                  key={tier}
                  className={cn(
                    'border-b p-3 text-center font-semibold tracking-wide uppercase',
                    tier === 'control' ? 'text-brand-orange bg-brand-orange-soft/35' : 'text-primary-strong'
                  )}
                >
                  {tTiers(tier)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPERVISION_VALUE_ROWS.map((row) => (
              <tr key={row} className='divide-x border-b even:bg-muted/20'>
                <th className='bg-card text-primary-strong sticky left-0 z-10 w-52 p-3.5 text-left text-sm font-medium'>
                  <span className='flex items-center gap-2.5'>
                    {(() => {
                      const Icon = VALUE_ICONS[row]
                      return <Icon aria-hidden className='text-primary size-4 shrink-0' />
                    })()}
                    {t(`rows.${row}`)}
                  </span>
                </th>
                {SUPERVISION_TIERS.map((tier) => (
                  <td
                    key={tier}
                    className={cn('p-3.5 text-center text-xs text-pretty', tier === 'control' && CONTROL_COLUMN)}
                  >
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
    <tr className='divide-x border-b even:bg-muted/20'>
      <th className='bg-card sticky left-0 z-10 p-3 text-left text-xs font-medium'>{label}</th>
      {/* `values` xếp theo SUPERVISION_TIERS nên ô cuối luôn là cột CONTROL. */}
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={cn('p-3 text-center text-xs font-medium', index === values.length - 1 && CONTROL_COLUMN)}
        >
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
