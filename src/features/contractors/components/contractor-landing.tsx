'use client'

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  ChevronRight,
  ClipboardList,
  Clock,
  FileLock2,
  Handshake,
  House,
  Info,
  Lock,
  Map as MapIcon,
  MapPin,
  SquarePen,
  Shield,
  ShieldCheck,
  User,
  Star,
  Users
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth, useAuthDialogStore } from '@/shared/auth'
import { useCmsDocument } from '@/shared/cms'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { CONTRACTOR_PREVIEW_ID, contractorFirmRoute, contractorMatchesRoute, ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatNumber } from '@/shared/utils'
import { CONTRACTOR_SORTS } from '../constants/contractors.constants'
import { CONTRACTORS_SEED } from '../api/contractors.seed'
import { useCreateBrief } from '../hooks/use-brief'
import { filterContractors } from '../services/contractor-list.service'
import type { Contractor, ContractorSort } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'

/**
 * Bề ngang phần nội dung của S09.
 *
 * Đo trên Hình S09 (ảnh gốc 450px): nội dung chạy từ x=13 đến x=437, tức
 * 424/450 = 94% bề ngang trang — gần y hệt Hình S08 (93.5%). `max-w-6xl` của
 * bản trước chỉ cho 1088px nội dung, hẹp hơn ảnh gần 25% nên mọi khối bên trong
 * đều bị bóp lại.
 *
 * Trần chốt ở **76rem (1216px)** chứ không phải 1480px: hero đã được thu về khổ
 * này theo yêu cầu của khách, nên các khối bên dưới phải cùng khổ thì cả trang
 * mới thẳng lề và cùng một cỡ. Mọi số đo bên trong đều là PHẦN TRĂM của bề ngang
 * này, nên đổi trần không làm sai tỉ lệ nào — chỉ thu nhỏ đều toàn bộ.
 */
const PAGE_CONTAINER = 'mx-auto w-[94%] max-w-[76rem]'

/** Ba thẻ của khối "An toàn & minh bạch" (Hình S09), theo đúng thứ tự trong ảnh. */
const SAFETY_CARDS = [{ key: 'privacy' }, { key: 'record' }, { key: 'review' }] as const

/**
 * Hình minh hoạ của một thẻ "An toàn & minh bạch".
 *
 * Ảnh vẽ ba hình mà lucide không có sẵn glyph tương đương, nên ghép lại:
 * - `privacy`: cái KHIÊN lồng Ổ KHOÁ → chồng `Lock` vào giữa `Shield`;
 * - `record`: tài liệu có ổ khoá → `FileLock2` khớp sẵn;
 * - `review`: NĂM NGÔI SAO cam nằm trên một NHÓM NGƯỜI → xếp hàng sao rồi tới
 *   `Users`. Dùng mỗi `Star` như bản trước thì mất hẳn phần "khách hàng thật",
 *   mà đó mới là ý của thẻ.
 *
 * Cỡ icon đo được là 24.4% bề ngang thẻ. Chữ trong ảnh demo lớn hơn khổ thật
 * khoảng 1.4 lần (xem ghi chú ở hero), nên bê nguyên 24.4% thì icon át hết chữ;
 * dùng 17.5% bề ngang thẻ = 24.4% × 0.72, đúng hệ số đã áp cho hero.
 *
 * Viết thành `w-[20.6%]` chứ không phải `w-[17.5%]`: phần trăm ở đây tính theo
 * HỘP NỘI DUNG của thẻ (đã trừ lề 7.4% mỗi bên), nên 17.5% bề ngang thẻ tương
 * đương 20.6% hộp nội dung.
 */
function SafetyIcon({ kind }: { kind: (typeof SAFETY_CARDS)[number]['key'] }) {
  return (
    // Ô vuông có kích thước XÁC ĐỊNH là bắt buộc: icon lucide mang sẵn thuộc
    // tính `height="24"`, nên nếu chỉ đặt `w-[…%]` thì bề ngang co giãn còn
    // chiều cao đứng nguyên 24px và hình bị dẹt. Cho ô bọc `aspect-square` rồi
    // để icon bên trong đo bằng `size-*` (đặt cả hai chiều) thì mới đúng.
    <span aria-hidden className='relative flex aspect-square w-[20.6%] min-w-12 shrink-0 items-center justify-center'>
      {kind === 'record' ? <FileLock2 className='text-primary size-full' strokeWidth={1.25} /> : null}

      {kind === 'review' ? (
        <span className='flex size-full flex-col items-center justify-center gap-1'>
          {/* Cỡ sao để CỐ ĐỊNH chứ không theo %: hàng sao không có chiều cao xác
              định nên `size-[14%]` không phân giải được chiều cao và sao biến
              mất. */}
          <span className='flex gap-0.5'>
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className='text-warning size-3 fill-current' />
            ))}
          </span>
          <Users className='text-primary size-[72%]' strokeWidth={1.25} />
        </span>
      ) : null}

      {kind === 'privacy' ? (
        <>
          <Shield className='text-primary size-full' strokeWidth={1.25} />
          <Lock className='text-primary absolute size-[32%]' strokeWidth={1.75} />
        </>
      ) : null}
    </span>
  )
}

/** Ba cột minh hoạ của bảng "So sánh minh bạch" (Hình S09). */
const COMPARE_COLUMNS = ['a', 'b', 'c'] as const

/** Năm dòng tiêu chí của bảng "So sánh minh bạch", theo đúng thứ tự trong ảnh. */
const COMPARE_ROWS = ['duration', 'scope', 'material', 'warranty', 'remark'] as const

/**
 * Sáu dòng thông số trong thẻ nhà thầu nổi trên bản đồ ở hero (Hình S09).
 *
 * Ảnh vẽ chúng thành hai cột NHÃN — GIÁ TRỊ, mỗi dòng một icon; khác hẳn dãy
 * chip của {@link ContractorStats} dùng ở S12/S13, nên dựng riêng thay vì nhồi
 * thêm một biến thể `variant` vào component kia.
 */
function HeroContractorFacts({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.landing.hero.card')
  const tCommon = useTranslations('contractors.common')
  const locale = useLocale() as Locale

  const rows = [
    {
      key: 'distance',
      icon: MapPin,
      label: t('distance'),
      value: t('distanceValue', { km: formatNumber(contractor.distanceKm, locale, { minimumFractionDigits: 1 }) })
    },
    {
      key: 'rating',
      icon: Star,
      label: t('rating'),
      value: `${formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}/5`
    },
    {
      key: 'completed',
      icon: Building2,
      label: t('completed'),
      value: t('completedValue', { count: contractor.completedProjects })
    },
    {
      key: 'similar',
      icon: CheckCircle2,
      label: t('similar'),
      value: t('similarValue', { count: contractor.similarProjects })
    },
    {
      key: 'survey',
      icon: Clock,
      label: t('survey'),
      value: t('surveyValue', { hours: contractor.surveyWithinHours })
    },
    {
      key: 'status',
      icon: BadgeCheck,
      label: t('status'),
      value: contractor.acceptingProjects ? tCommon('accepting') : tCommon('notAccepting'),
      highlight: true
    }
  ] as const

  // Cỡ chữ và icon trong thẻ tính bằng `cqi` (1% bề ngang thẻ) chứ không phải
  // `text-sm`/`size-4` cố định: thẻ được đo theo % của khối bản đồ, nên khi khối
  // co lại (thu nhỏ hero, hay màn hẹp hơn) mà chữ đứng yên thì thẻ vỡ tỉ lệ
  // ngay. `@container` trên thẻ là thứ làm cho `cqi` có nghĩa.
  //
  // Đo trên Hình S09, thẻ rộng 135px: icon ở x=276, nhãn bắt đầu x=288, và cột
  // giá trị bắt đầu ở x=354 trong MỌI dòng — tức giá trị canh TRÁI theo một mốc
  // cố định (86/135 = 63.7% bề ngang thẻ), không phải canh phải như bản trước
  // (dòng "Đang nhận dự án" dài hơn hẳn nên canh phải là thấy ngay).
  return (
    <ul className='mt-[9.1%] space-y-[5.2%] text-[4cqi]'>
      {rows.map((row) => (
        <li key={row.key} className='grid grid-cols-[6cqi_minmax(0,1fr)] items-center gap-x-[1.5cqi]'>
          {/* Hình S09: icon đầu dòng của MỌI dòng đều màu xanh thương hiệu —
              kể cả dòng "Đánh giá". Ngôi sao vàng là của GIÁ TRỊ "★ 4,8/5",
              đứng trước con số bên cột phải. */}
          <row.icon className='text-primary size-[4.6cqi] shrink-0' />
          <span className='grid grid-cols-[63.7%_minmax(0,1fr)] items-center'>
            <span className='text-muted-foreground truncate'>{row.label}</span>
            <span
              className={cn(
                'flex items-center gap-[1.2cqi] font-semibold',
                'highlight' in row && row.highlight ? 'text-primary-strong' : 'text-foreground'
              )}
            >
              {row.key === 'rating' ? <Star className='text-warning size-[4cqi] shrink-0 fill-current' /> : null}
              {row.value}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Một dòng trong khối "Tìm đúng người theo đúng tiêu chí". */
interface CriterionItem {
  key: 'area' | 'type' | 'scale' | 'experience' | 'rating' | 'schedule'
  icon: typeof MapPin
  hint?: string
}

/**
 * Landing "Tìm nhà thầu" (S09) — trang công khai, khách chưa đăng nhập cũng xem
 * được.
 *
 * Nội dung theo bản mô tả: hero → 4 cam kết → tiêu chí ghép → danh sách xếp hạng
 * 4 tab → so sánh minh bạch → an toàn & minh bạch → ranh giới dịch vụ → FAQ →
 * CTA → dải đối tác.
 *
 * Hai chỗ bám sát QUY TẮC chứ không bám ảnh demo:
 * - R1: câu trả lời FAQ nói rõ tối đa 3 nhà thầu, không phải "gửi càng nhiều
 *   càng dễ so sánh".
 * - R2/R3: khối "So sánh minh bạch" chỉ đối chiếu NĂNG LỰC, và có một dòng dẫn
 *   nói thẳng báo giá đến từ nhà thầu sau khảo sát, không nằm trên web.
 */
export function ContractorLanding() {
  const t = useTranslations('contractors.landing')
  const tRankTabs = useTranslations('contractors.landing.ranking.tabs')
  const tCommon = useTranslations('contractors.common')

  const locale = useLocale() as Locale

  const { isAuthenticated } = useAuth()
  const openAuthDialog = useAuthDialogStore((s) => s.open)
  const createBrief = useCreateBrief()
  const router = useRouter()

  const [sort, setSort] = useState<ContractorSort>('match')

  /**
   * CHỖ CHỜ ASSET: Hình S09 vẽ một BẢN ĐỒ minh hoạ (nền xanh nhạt, vòng sóng
   * ra-đa, 5 ghim vị trí). Ảnh seed trong kho là ảnh chụp phố nên sai hẳn tinh
   * thần, vì vậy chỉ hiện ảnh khi admin đã thay bằng ảnh thật ở màn "Hình ảnh
   * site"; chưa thay thì để khung nét đứt như mọi chỗ chờ asset khác.
   */
  const mapImage = useCmsDocument('uiAssets')['map.contractors']?.trim()
  const featured = CONTRACTORS_SEED[0]
  const ranked = filterContractors(CONTRACTORS_SEED, { radiusKm: 50, sort }).slice(0, 3)

  /** "Tạo hồ sơ" cần tài khoản: chưa đăng nhập thì mở popup đăng nhập trước. */
  const startBrief = () => {
    if (!isAuthenticated) {
      // Đăng nhập xong thì chạy tiếp đúng việc người dùng đang định làm, không
      // bắt họ bấm lại "Tạo hồ sơ" lần nữa.
      openAuthDialog('login', () => createBrief.mutate())
      return
    }
    createBrief.mutate()
  }

  /**
   * "Xem nhà thầu" — bản mô tả S09: đi tới S12, và S12 CẦN CÓ HỒ SƠ DỰ ÁN.
   *
   * Có hồ sơ rồi thì mở thẳng danh sách đề xuất của hồ sơ gần nhất; chưa có thì
   * phải dựng hồ sơ trước (không có địa chỉ và quy mô thì không xếp hạng được
   * nhà thầu). Trước đây nút này gọi thẳng `startBrief`, nên mỗi lần bấm lại đẻ
   * thêm một dự án rỗng và luôn rơi vào Bước 1 — không phải màn khách muốn xem.
   */
  const openContractorList = (contractorId?: string) => {
    if (!isAuthenticated) {
      openAuthDialog('login', () => openContractorList(contractorId))
      return
    }
    // LUÔN mở ở chế độ xem thử, kể cả khi tài khoản đã có hồ sơ: "Xem nhà thầu"
    // là xem hàng, không phải mở một dự án cụ thể. Tự nhảy vào hồ sơ gần nhất
    // thì khách đang định xem lại thấy màn của một dự án mình không nhắc tới,
    // kèm số lời mời đã dùng của dự án đó. Muốn gắn dự án thì bấm "Tạo hồ sơ dự
    // án" ở dải nhắc, hộp thoại chọn dự án sẽ mở ra ngay tại đó.
    router.push(
      contractorId
        ? contractorFirmRoute(CONTRACTOR_PREVIEW_ID, contractorId)
        : contractorMatchesRoute(CONTRACTOR_PREVIEW_ID)
    )
  }

  // Nhịp dọc đo trên Hình S09: các khoảng hở giữa hai khối liền nhau chỉ 12–14px
  // trên ảnh 450px = 41–48px ở khổ thật, còn `space-y-16` (64px) của bản trước
  // đẩy trang dài ra và làm mỗi khối trôi ra xa nhau hơn ảnh.
  return (
    <div className='space-y-11 pb-14'>
      {/* Hero — Hình S09 (ảnh gốc 450×800, phần nội dung x=13…437 = 424px):
          NỀN TRẮNG, không có dải nền xanh nào. Hai cột gần bằng nhau: cột chữ
          13…220 (48.8%), khe 15 (3.5%), khối minh hoạ 235…437 (47.6%). */}
      <section className={cn(PAGE_CONTAINER, 'pt-6')}>
        {/* Tỉ lệ hai cột (48.8% · khe 3.5% · 47.7%) đúng số đo trên ảnh; khổ
            chung của trang do `PAGE_CONTAINER` quyết định. */}
        <div className='grid items-center gap-x-[3.5%] gap-y-8 lg:grid-cols-[48.8%_minmax(0,1fr)]'>
          {/* Cỡ chữ hero.
              Đo trên Hình S09 rồi quy theo % bề ngang phần nội dung (424px) →
              khổ thật ~1447px cho ra: tiêu đề 64px, câu dẫn 26px, nút cao 80px.
              Nhưng ảnh demo được AI vẽ ở khổ trang hẹp hơn (bám các mốc khác
              trong ảnh thì hệ số quy đổi rơi vào khoảng 2.0 chứ không phải 3.4),
              nên bê nguyên số đó lên khổ 1440 thì chữ TO quá — khách xem bản
              dựng đã yêu cầu hạ xuống. Giữ đúng NHỊP của ảnh (tỉ lệ giữa tiêu
              đề · câu dẫn · nút và các khoảng hở) rồi nhân đều 0.72 — khách
              xem bản dựng đã yêu cầu thu nhỏ hai lần, đây là nấc thứ hai:
              - tiêu đề 46px, bước dòng 1.14;
              - câu dẫn 18px, bước dòng 1.65;
              - tiêu đề → câu dẫn 26px; câu dẫn → nút 38px;
              - nút cao 56px, rộng tối thiểu 200px, cách nhau 32px.
              Bản đầu tiên (`text-[2.75rem]`/`text-lg`/`h-14`) thì ngược lại —
              khối chữ chỉ cao 16% bề ngang nội dung trong khi ảnh là 30%. */}
          <div>
            <h1 className='text-primary-strong text-4xl leading-[1.14] font-bold tracking-tight text-balance sm:text-[2.875rem]'>
              {t('hero.title')}
            </h1>
            {/* Hình S09: câu dẫn ngắt đúng BA dòng và rộng bằng ~88% cột chữ, hẹp
                hơn tiêu đề một chút. Cỡ chữ ở đây đã hạ theo yêu cầu nên phải
                chặn bề ngang mới ra đúng ba dòng như ảnh. */}
            <p className='text-muted-foreground mt-[26px] max-w-[30rem] text-base leading-[1.65] text-pretty sm:text-lg'>
              {t('hero.subtitle')}
            </p>
            {/* Hình S09: hai nút cùng cỡ, nút phụ nền trắng viền xanh, và nút
                chính KHÔNG có mũi tên. */}
            <div className='mt-[38px] flex flex-wrap gap-8'>
              <Button
                size='lg'
                className='h-14 min-w-[12.5rem] px-8 text-base'
                onClick={startBrief}
                disabled={createBrief.isPending}
              >
                {t('hero.createBrief')}
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-primary text-primary-strong h-14 min-w-[12.5rem] px-8 text-base'
                onClick={() => openContractorList()}
                disabled={createBrief.isPending}
              >
                {t('hero.viewContractors')}
              </Button>
            </div>
          </div>

          {/* Hình S09: khối minh hoạ là BẢN ĐỒ vẽ (nền xanh nhạt, vòng sóng
              ra-đa, 5 ghim vị trí) chứ không phải ảnh chụp; thẻ nhà thầu nổi
              CHÍNH GIỮA khối, rộng 137/212 = 65% và cao 122/180 = 68% khối.
              CHỖ CHỜ ASSET: chưa có hình bản đồ nên vẫn dùng ảnh trong kho
              (`map.contractors`) — admin thay được ở màn "Hình ảnh site". */}
          <div className='relative'>
            {mapImage ? (
              <Photo
                src={mapImage}
                alt=''
                priority
                sizes='(max-width: 1024px) 100vw, 700px'
                className='aspect-[212/180] w-full rounded-3xl border'
              />
            ) : (
              <div className='bg-muted/30 flex aspect-[212/180] w-full items-center justify-center rounded-3xl border border-dashed'>
                <MapIcon className='text-muted-foreground/50 size-10' />
              </div>
            )}

            {/* Thẻ CANH GIỮA khối minh hoạ, rộng 63.4% (số đo trên Hình
                S09: thẻ 135px trên khối 213px).

                Đo thô ban đầu cho ra lệch trái 15.5% / mép trên 21.5%, nhưng
                bản đồ trong ảnh mờ dần ở rìa nên không chốt được mép thật của
                khối — sai số đủ để nuốt hết phần "lệch" đó. Canh giữa mới là
                thứ nhìn đúng, và cũng là thứ giữ được khi khối đổi tỉ lệ. */}
            {featured ? (
              <div className='bg-card @container absolute top-1/2 left-1/2 w-[63.4%] min-w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-[5.9%] shadow-lg'>
                {/* Hình S09: khối đầu thẻ cao 27/135 = 20% bề ngang thẻ, do ô
                    logo quyết định — nên ô logo đo theo % chứ không phải
                    `size-14` cố định, để thẻ giữ đúng tỉ lệ cao/rộng 0.93 ở
                    mọi khổ màn. */}
                <div className='flex items-center gap-[3.5%]'>
                  <div className='aspect-square w-[22.8%] shrink-0'>
                    <ContractorLogo contractor={featured} className='size-full rounded-2xl text-base' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    {/* Hình S09: sau tên nhà thầu KHÔNG có icon xác minh nào —
                        dấu tick chỉ xuất hiện ở thẻ danh sách S12 và header hồ
                        sơ S13. */}
                    <p className='truncate text-[4.6cqi] font-semibold'>{featured.name}</p>
                    <span className='bg-brand-orange text-brand-orange-foreground mt-[2cqi] inline-flex items-center gap-[1.5cqi] rounded-full px-[3cqi] py-[1.2cqi] text-[3.1cqi] font-semibold'>
                      <Star className='size-[3.4cqi] fill-current' />
                      {t('hero.bestMatch')}
                    </span>
                  </div>
                </div>
                <HeroContractorFacts contractor={featured} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 4 cam kết — Hình S09, dải x=13…437, y=204…249.

          Ba thứ bản trước làm khác ảnh:
          - ICON: ảnh vẽ ① chồng đồng xu (miễn phí), ② khiên + tick (đã xác
            minh), ③ khiên + tài liệu có tick (so sánh minh bạch), ④ khiên + ổ
            khoá (thông tin được bảo vệ). Bản trước là hộp quà / cái cân / tệp
            khoá — sai nghĩa lẫn hình. Lucide không có "khiên lồng ổ khoá" nên
            ④ dùng ổ khoá trần, giữ đúng ý còn hình thì gần nhất có được.
          - KHÔNG có ô nền sau icon: ảnh vẽ icon nét trần màu xanh, bản trước
            bọc trong ô vuông `bg-accent` 40px.
          - Mỗi mục CANH GIỮA ô của nó: đo bốn cụm chữ ở x=27…103, 133…210,
            241…308, 331…428 — chia 424px thành 4 cột đều 106px thì cả bốn cụm
            đều nằm giữa cột của mình, không phải canh trái. */}
      <section className={PAGE_CONTAINER}>
        <ul className='bg-card grid gap-4 rounded-2xl border p-6 sm:grid-cols-2 lg:grid-cols-4'>
          {(
            [
              { key: 'free', icon: Coins },
              { key: 'verified', icon: ShieldCheck },
              { key: 'transparent', icon: ClipboardCheck },
              { key: 'privacy', icon: Lock }
            ] as const
          ).map((item) => (
            <li key={item.key} className='flex items-center justify-center gap-3'>
              <item.icon className='text-primary size-7 shrink-0' strokeWidth={1.5} />
              <span className='text-sm font-medium text-pretty'>{t(`promises.${item.key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tiêu chí + danh sách xếp hạng.

          Hình S09, đo trên phần nội dung 424px: cột tiêu chí 13…148 (31.8%),
          khe 12px (2.8%), khung danh sách 160…436 (65.3%). Bản trước để cột
          trái 300px cứng (20% trên khổ 1480) nên tiêu đề khối bị gãy hai dòng
          còn khung phải thì rộng quá. */}
      <section className={PAGE_CONTAINER}>
        <div className='grid gap-6 lg:grid-cols-[31.8%_minmax(0,1fr)] lg:gap-x-[2.8%]'>
          <div>
            <h2 className='text-primary-strong text-lg font-bold tracking-wide uppercase'>{t('criteria.title')}</h2>
            <ul className='mt-4 space-y-2'>
              {(
                [
                  // Icon đọc từ ảnh phóng 5.8× của Hình S09: ghim bản đồ ·
                  // ngôi nhà · bảng kê · toà nhà · ngôi sao · lịch+đồng hồ.
                  // Bản trước dùng mũ bảo hộ cho "Loại công trình" và thước cho
                  // "Quy mô công trình" — không có cái nào trong ảnh.
                  { key: 'area', icon: MapPin },
                  { key: 'type', icon: House, hint: t('criteria.typeHint') },
                  { key: 'scale', icon: ClipboardList },
                  { key: 'experience', icon: Building2 },
                  { key: 'rating', icon: Star },
                  { key: 'schedule', icon: CalendarClock }
                ] as const
              ).map((item: CriterionItem) => (
                // Hình S09: mỗi ô cao 20/135 = 14.8% bề ngang cột tiêu chí,
                // tức thoáng hơn hẳn `py-3` của bản trước.
                <li key={item.key} className='bg-card flex items-start gap-3 rounded-xl border px-4 py-4'>
                  <item.icon className='text-primary mt-0.5 size-5 shrink-0' strokeWidth={1.5} />
                  {/* Hình S09: nhãn tiêu chí màu XANH thương hiệu, chỉ dòng
                      gợi ý bên dưới mới là chữ mờ. */}
                  <span className='text-primary-strong min-w-0 flex-1 text-sm font-medium'>
                    {t(`criteria.${item.key}`)}
                    {item.hint ? <span className='text-muted-foreground block text-xs'>{item.hint}</span> : null}
                  </span>
                  <ChevronRight aria-hidden className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                </li>
              ))}
            </ul>
          </div>

          <div className='bg-card min-w-0 rounded-2xl border p-5'>
            {/* Hình S09: KHÔNG có tiêu đề "Nhà thầu tiêu biểu" — hàng tab nằm
                ngay mép trên khung. Và bốn tab TRẢI ĐỀU hết bề ngang khung
                (đo: bốn cụm chữ ở 175…212, 238…262, 287…333, 359…409 — khoảng
                hở giữa chúng đều ~26px dù chữ dài ngắn khác nhau), không phải
                dồn về bên trái. */}
            <div className='flex flex-wrap justify-between gap-x-6 gap-y-2 border-b'>
              {CONTRACTOR_SORTS.map((key) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => setSort(key)}
                  aria-pressed={key === sort}
                  className={cn(
                    '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors',
                    key === sort
                      ? 'border-primary text-primary-strong'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {tRankTabs(key)}
                </button>
              ))}
            </div>

            {/* Hình S09: mỗi dòng chia BỐN cột cố định — ô logo (10.1% bề
                ngang khung) · tên + chỉ số (32.5%) · lịch khảo sát (13.7%) ·
                hai nút (18.8%) — và phần dôi ra chia đều vào ba khe. Bản trước
                gộp tên + mọi chỉ số vào một cột rồi để hai nút NẰM NGANG; ảnh
                thì tách riêng cột lịch khảo sát và XẾP CHỒNG hai nút.
                Chỉ số trong ảnh chỉ có đánh giá và số dự án tương tự — khoảng
                cách nằm ở S12 chứ không ở landing. */}
            <ul className='mt-4 divide-y'>
              {ranked.map((contractor, index) => (
                <li
                  key={contractor.id}
                  className='grid grid-cols-[10.1%_32.5%_13.7%_18.8%] items-center justify-between gap-x-4 gap-y-3 py-4 max-sm:grid-cols-1'
                >
                  <ContractorLogo contractor={contractor} className='size-full aspect-square' />

                  <div className='min-w-0'>
                    <p className='flex flex-wrap items-center gap-2 font-medium'>
                      {contractor.name}
                      {/* Ảnh: viên nhãn cam chỉ gắn ở dòng ĐẦU — nhà thầu đang
                          đứng nhất theo tab đang chọn. */}
                      {index === 0 ? (
                        <span className='bg-brand-orange-soft text-brand-orange rounded-full px-2 py-0.5 text-[11px] font-semibold'>
                          {t('ranking.bestMatch')}
                        </span>
                      ) : null}
                    </p>
                    <span className='text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                      <span className='flex items-center gap-1.5'>
                        <Star className='text-warning size-3.5 shrink-0 fill-current' />
                        <span className='text-foreground font-semibold'>
                          {formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}
                        </span>
                        {tCommon('reviewCount', { count: contractor.reviewCount })}
                      </span>
                      <span className='flex items-center gap-1.5'>
                        <BadgeCheck className='text-primary size-3.5 shrink-0' />
                        {tCommon('similarProjects', { count: contractor.similarProjects })}
                      </span>
                    </span>
                  </div>

                  <p className='text-muted-foreground text-xs text-pretty'>
                    {t('ranking.surveyWithin', { hours: contractor.surveyWithinHours })}
                  </p>

                  {/* Ảnh S09: "Xem chi tiết" nền xanh ĐẶC nằm trên, "Chọn & gửi
                      hồ sơ" viền nằm dưới. Cả hai đều dẫn vào luồng tạo hồ sơ vì
                      khách chưa có dự án nào để mở hồ sơ nhà thầu theo ngữ cảnh. */}
                  <div className='flex flex-col gap-2'>
                    <Button size='sm' onClick={() => openContractorList(contractor.id)}>
                      {t('ranking.detail')}
                    </Button>
                    <Button size='sm' variant='outline' onClick={startBrief}>
                      {t('ranking.choose')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Hình S09: dòng chú thích màu XANH (không phải chữ mờ) và
                canh TRÁI — đo trên ảnh: icon ⓘ cách mép trái khung 28px còn
                chữ kết thúc cách mép phải 60px, tức không canh giữa.

                Trên nó còn MỘT ĐƯỜNG KẺ nữa: `divide-y` của danh sách chỉ kẻ
                giữa các dòng nên dòng cuối không có gạch dưới, phải tự thêm
                `border-t` ở đây thì mới khép được khung như ảnh. */}
            <p className='text-primary flex items-start gap-2 border-t pt-4 text-xs'>
              <Info className='mt-0.5 size-3.5 shrink-0' />
              <span className='text-pretty'>{t('ranking.note')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* So sánh minh bạch — Hình S09.

          Bảng này là MINH HOẠ, không phải bảng so sánh thật: ảnh ghi cột là
          "Nhà thầu A / B / C" và các dòng "Thời gian thi công · Phạm vi bao
          gồm/không bao gồm · Cấp vật liệu đề xuất · Bảo hành · Ghi chú" — đều
          là trường KHÔNG có trong `Contractor`. Bản trước đổ ba nhà thầu thật
          trong seed vào cột và chỉ dựng được 4 dòng có sẵn dữ liệu, nên bảng
          vừa khác ảnh vừa hứa một phép so sánh mà landing chưa làm được (so
          sánh thật nằm ở S15). Nay lấy toàn bộ chữ từ `messages` để admin sửa
          được và khớp ảnh.

          Vẫn đúng R2: không ô nào có số tiền — dòng "Phạm vi bao gồm/không bao
          gồm" chỉ dẫn sang trang chi tiết, không hiện giá.

          Bỏ dòng dẫn "Bảng so sánh trên nền tảng chỉ đối chiếu NĂNG LỰC…" vì
          ảnh không có; nội dung R2/R3 vẫn còn ở FAQ và ở khối "Ranh giới dịch
          vụ" bên dưới. */}
      <section className={PAGE_CONTAINER}>
        {/* Ảnh: mọi tiêu đề section đều IN HOA, màu xanh, canh giữa. */}
        <h2 className='text-primary-strong text-center text-lg font-bold tracking-wide uppercase'>
          {t('compare.title')}
        </h2>

        <div className='bg-card mt-5 overflow-x-auto rounded-2xl border'>
          <table className='w-full min-w-[640px] border-collapse text-sm'>
            <thead>
              <tr>
                <th className='border-b p-4 text-left font-medium'>{t('compare.criterion')}</th>
                {COMPARE_COLUMNS.map((col) => (
                  // Ảnh: tên ba cột nhà thầu màu xanh thương hiệu, chỉ ô
                  // "Tiêu chí" là chữ thường.
                  <th key={col} className='text-primary-strong border-b border-l p-4 text-center font-medium'>
                    {t(`compare.columns.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row}>
                  <th className='text-muted-foreground border-b p-4 text-left font-normal'>
                    {t(`compare.rows.${row}.label`)}
                  </th>
                  {COMPARE_COLUMNS.map((col) => (
                    <td key={col} className='border-b border-l p-4 text-center'>
                      {t(`compare.rows.${row}.${col}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ảnh: dòng nguồn dữ liệu nằm TRONG khung bảng, canh giữa, có dấu
              tick tròn màu xanh đứng trước. */}
          <p className='text-muted-foreground flex items-center justify-center gap-2 p-4 text-xs text-pretty'>
            <CheckCircle2 className='text-primary size-4 shrink-0' />
            {t('compare.note')}
          </p>
        </div>
      </section>

      {/* An toàn & minh bạch — Hình S09.

          Ba khác biệt so với bản trước: tiêu đề section IN HOA màu xanh; icon
          nằm BÊN TRÁI chữ (bản trước đặt trên đầu) và là hình nét TRẦN cỡ lớn,
          không có ô vuông nền xanh nhạt; tiêu đề mỗi thẻ màu xanh, ngắt hai
          dòng. */}
      <section className={PAGE_CONTAINER}>
        <h2 className='text-primary-strong text-center text-lg font-bold tracking-wide uppercase'>
          {t('safety.title')}
        </h2>
        {/* Số đo trên Hình S09 (phần nội dung 424px): ba thẻ 14…148, 158…288,
            298…436 → mỗi thẻ 135px (31.8%), khe 10px (**2.36%**, bản trước để
            `gap-4` = 1.1% nên ba thẻ dính nhau hơn ảnh).
            Trong thẻ: lề 10px (7.4%) · icon 33px (24.4%) · khe icon→chữ 12px
            (8.9%) · cột chữ 72px (53.3%). Icon canh GIỮA chiều cao thẻ. */}
        <ul className='mt-5 grid gap-[2.36%] gap-y-4 md:grid-cols-3'>
          {SAFETY_CARDS.map((item) => (
            <li
              key={item.key}
              className='bg-card flex items-center gap-[8.9%] rounded-2xl border p-[7.4%] sm:p-5 md:p-[7.4%]'
            >
              <SafetyIcon kind={item.key} />
              <div className='min-w-0 flex-1'>
                {/* Hình S09: tiêu đề thẻ ngắt HAI dòng — cột chữ chỉ rộng
                    53.3% bề ngang thẻ nên chữ phải đủ lớn mới gãy dòng như ảnh. */}
                <h3 className='text-primary-strong text-xl leading-snug font-bold text-balance'>
                  {t(`safety.${item.key}Title`)}
                </h3>
                <p className='text-muted-foreground mt-2 text-[15px] leading-relaxed text-pretty'>
                  {t(`safety.${item.key}Body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Ranh giới dịch vụ — Hình S09, dải y=620…660 (cao 41px = 9.7% bề ngang
          nội dung).

          Đo ba phần theo trục ngang: khối xanh x=16…180 (38.9%), khoảng giữa
          180…268 (20.8%), khối cam 268…435 (39.6%). Trong mỗi khối: lề trái
          ~14%, icon ~18% bề ngang khối và cao 75% chiều cao khối, khe icon→chữ
          9%. Bản trước chia `1fr_auto_1fr` và KHÔNG có icon nào.

          Mép phải khối xanh nhô ra 5px ở giữa chiều cao (mũi tên) — dựng bằng
          một tam giác `after:` cùng màu thay vì `clip-path` để giữ được bo góc
          của khối. */}
      <section className={PAGE_CONTAINER}>
        <h2 className='text-primary-strong text-center text-lg font-bold tracking-wide uppercase'>
          {t('boundary.title')}
        </h2>
        <div className='mt-5 grid items-stretch gap-0 md:grid-cols-[38.9%_20.8%_39.6%]'>
          {/* Lề trong đo trên ảnh (khối rộng 166px): trái 28px = 17%, phải
              19px = 11.4%, trên/dưới 5px = 3%. Lề trái rộng gấp rưỡi lề phải —
              đó là thứ bóp cột chữ còn 43% bề ngang khối và làm dòng mô tả gãy
              HAI dòng như ảnh; bản trước để `p-[4%]` đều bốn phía nên cột chữ
              rộng 67% và mô tả nằm gọn một dòng. */}
          <div className='bg-accent/45 after:bg-accent/45 relative flex items-center gap-[12.6%] rounded-2xl py-[3%] pr-[11.4%] pl-[17%] after:absolute after:top-0 after:-right-8 after:h-full after:w-8 after:[clip-path:polygon(0_0,100%_50%,0_100%)] max-md:after:hidden'>
            {/* Ô bọc vuông vì icon lucide mang sẵn `height="24"` — chỉ đặt
                `w-…%` thì hình bị dẹt (xem ghi chú ở `SafetyIcon`).
                Ảnh vẽ một KHUNG VUÔNG BO GÓC lồng bản vẽ, có cây bút chì vắt
                chéo góc dưới phải → `SquarePen`, không phải hai cây bút bắt
                chéo như `PencilRuler` của bản trước. */}
            <span aria-hidden className='flex aspect-square w-[25.1%] min-w-12 shrink-0 items-center justify-center'>
              <SquarePen className='text-primary size-full' strokeWidth={1.25} />
            </span>
            <div className='min-w-0 flex-1'>
              <h3 className='text-primary-strong font-bold tracking-wide uppercase'>{t('boundary.designTitle')}</h3>
              <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('boundary.designBody')}</p>
            </div>
          </div>

          {/* Hình S09: giữa hai khối là ba chấm · dòng chữ NGẮT HAI DÒNG · mũi tên. */}
          <div className='flex items-center justify-center gap-3 px-4 py-4'>
            <span aria-hidden className='text-primary/50 text-lg leading-none'>
              ···
            </span>
            {/* Hình S09: dòng chữ và mũi tên ở giữa là màu XANH THƯƠNG HIỆU,
                không phải chữ đen — đo trên ảnh ra (66,95,80), tức cùng tông với
                tiêu đề khối chứ không phải `--foreground` (13,14,17). */}
            <p className='text-primary-strong text-center text-sm font-semibold whitespace-pre-line'>
              {t('boundary.arrow')}
            </p>
            <ArrowRight aria-hidden className='text-primary-strong size-5 shrink-0' />
          </div>

          {/* Khối xanh bên trái nhô ra một mũi nhọn, nên mép trái khối này
              phải LÕM VÀO đúng bằng chừng đó thì hai hình mới ăn khớp (Hình
              S09 đo được khoét sâu ~6/166 bề ngang khối).

              Khoét bằng một tam giác `before:` tô màu nền trang thay vì
              `clip-path` lên cả khối: `clip-path` sẽ cắt mất bo góc, còn cách
              này giữ nguyên `rounded-2xl` — `overflow-hidden` lo phần tam giác
              thò ra ngoài góc bo. */}
          <div className='bg-brand-orange-soft/70 before:bg-background relative flex items-center gap-[12.6%] overflow-hidden rounded-2xl py-[3%] pr-[11.4%] pl-[17%] before:absolute before:top-0 before:left-0 before:h-full before:w-8 before:[clip-path:polygon(0_0,100%_50%,0_100%)] max-md:before:hidden'>
            {/* Ảnh vẽ nửa người thợ (đầu + hai vai). Không ghép thêm mũ bảo hộ:
                chồng `HardHat` lên `User` cho ra một hình rối, và người mới là
                phần mang nghĩa "tìm NGƯỜI thực hiện". */}
            <span aria-hidden className='flex aspect-square w-[25.1%] min-w-12 shrink-0 items-center justify-center'>
              <User className='text-brand-orange size-full' strokeWidth={1.25} />
            </span>
            <div className='min-w-0 flex-1'>
              <h3 className='text-brand-orange font-bold tracking-wide uppercase'>{t('boundary.findTitle')}</h3>
              <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('boundary.findBody')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — Hình S09.

          Ảnh dựng khối này khác hẳn bản trước: KHÔNG bó vào `max-w-3xl` mà chạy
          hết bề ngang nội dung, nằm trong MỘT khung bo góc có viền, và mỗi dòng
          chia hai cột — câu hỏi (đậm) chiếm 33.5% bề ngang, câu trả lời (chữ
          mờ) nằm ngay bên phải trên CÙNG MỘT DÒNG.

          Không còn accordion: câu trả lời đã hiện sẵn thì không có gì để bấm mở
          ra nữa. Dấu ⊕ trong ảnh cũng bỏ luôn — một dấu cộng không làm gì khi
          bấm thì người dùng tưởng hỏng. Đổi lại câu trả lời được xuống dòng đầy
          đủ thay vì cắt cụt một dòng như ảnh.

          Nội dung câu 3 CỐ Ý khác ảnh: ảnh trả lời "gửi đến nhiều nhà thầu để
          so sánh", trái R1 (tối đa 3 nhà thầu/dự án). Phần chữ của bản mô tả
          thắng ảnh ở chỗ này. */}
      <section className={PAGE_CONTAINER}>
        <h2 className='text-primary-strong text-center text-lg font-bold tracking-wide uppercase'>{t('faq.title')}</h2>
        <dl className='bg-card mt-5 rounded-2xl border px-[3%]'>
          {([1, 2, 3, 4, 5] as const).map((index) => (
            <div
              key={index}
              className='grid items-baseline gap-x-4 gap-y-1 border-b py-4 last:border-b-0 md:grid-cols-[33.5%_minmax(0,1fr)]'
            >
              <dt className='font-semibold'>{t(`faq.q${index}`)}</dt>
              <dd className='text-muted-foreground text-sm text-pretty'>{t(`faq.a${index}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA + dải đối tác — Hình S09, hai dải cuối trang.

          Dải xanh: y=755…779 (cao 25/424 = 5.9% bề ngang nội dung), chạy hết bề
          ngang, màu nền đo được (0,91,48) — cùng tông xanh đậm với nút "Tạo hồ
          sơ" ở hero, KHÔNG phải `--primary` xanh tươi mà bản trước dùng. Nút bên
          phải nền TRẮNG, chữ xanh đậm.

          Dải đối tác: nền be/cam nhạt (247,241,229) chứ không phải nền trắng
          viền nét đứt; icon bắt tay và link "Trở thành đối tác" đều màu cam. */}
      <section className={cn(PAGE_CONTAINER, 'space-y-3')}>
        <div className='bg-primary-strong text-primary-foreground flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6'>
          <p className='font-semibold text-pretty'>{t('cta.title')}</p>
          <Button
            className='bg-background text-primary-strong hover:bg-background/90 border-0 bg-none shadow-sm'
            onClick={startBrief}
            disabled={createBrief.isPending}
          >
            {t('cta.action')}
          </Button>
        </div>

        <div className='bg-brand-orange-soft/70 text-muted-foreground flex flex-wrap items-center justify-between gap-3 rounded-2xl px-7 py-4 text-sm'>
          <span className='inline-flex items-center gap-2'>
            <Handshake className='text-brand-orange size-4' />
            {t('partner.text')}
          </span>
          <Link href={ROUTES.CONSULT} className='text-brand-orange inline-flex items-center gap-1.5 font-semibold'>
            {t('partner.action')}
            <ArrowRight className='size-3.5' />
          </Link>
        </div>
      </section>

      {/* Hình S09 kết thúc ngay sau dải đối tác — mực in cuối cùng ở y=797 trên
          ảnh cao 800px. Dòng nhắc "SAVICO không hiển thị báo giá…" là của bản
          dựng, không có trong ảnh, nên bỏ; R2 vẫn được nói thẳng ở câu hỏi 4
          của FAQ và ở dòng dẫn của bảng so sánh. */}
    </div>
  )
}
