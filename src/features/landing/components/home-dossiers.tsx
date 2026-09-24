'use client'

import { ArrowRight, ChevronLeft, ChevronRight, Files, Layers, Ruler } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, type ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { revealEase, RevealPhoto } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useScrollSnapIndex } from '@/shared/hooks'
import { type SiteImageKey } from '@/shared/lib/imagery'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { HOME_DOSSIERS, type HomeDossier } from '../constants/landing.constants'

/**
 * Đích của "Xem tất cả hồ sơ mẫu": tab THƯ VIỆN MẪU của trang Cẩm nang (`?tab=library`).
 * Trước đây trỏ thẳng `/handbook` nên khách rơi vào tab Tin tức (tab mặc định).
 */
const LIBRARY_HREF = `${ROUTES.HANDBOOK}?tab=library`

/** Loại thông số trên thẻ — quyết định icon đứng trước chữ. */
export type HomeTemplateFactKind = 'area' | 'lot' | 'floors' | 'images'

const FACT_ICON = {
  area: Ruler,
  lot: Ruler,
  floors: Layers,
  images: Files
} as const

/**
 * Một thẻ của dải, đã dựng sẵn ở lớp `app/`: `features/landing` không import được `features/handbook`
 * nên dữ liệu thư viện mẫu 2D/3D (và khung hình `TemplateFigure`) do nơi ghép truyền vào.
 */
export interface HomeTemplateItem {
  id: string
  /** Trang chi tiết của mẫu. */
  href: string
  title: string
  /** Nhãn góc dưới trái ảnh, ví dụ "2D · Nhà phố". */
  badge: string
  facts: readonly { kind: HomeTemplateFactKind; text: string }[]
  /** Khung hình bìa — lấp đầy ô tỉ lệ 4:3. */
  cover: ReactNode
}

interface HomeDossiersProps {
  /**
   * Mẫu lấy từ thư viện Cẩm nang. `undefined` = đang tải (hiện khung chờ); mảng rỗng = chưa có mẫu nào
   * nên dải quay về bốn hồ sơ minh hoạ trong i18n để trang chủ không mất khối này.
   */
  items?: readonly HomeTemplateItem[]
}

/** Khóa ảnh của bốn hồ sơ minh hoạ dự phòng — admin thay từng ảnh ở màn "Hình ảnh site". */
const DOSSIER_IMAGE: Record<HomeDossier, SiteImageKey> = {
  townhouse: 'home.dossierTownhouse',
  villa: 'home.dossierVilla',
  resort: 'home.dossierResort',
  garden: 'home.dossierGarden'
}

/** Khoảng hở giữa hai thẻ ở `sm` trở lên (`gap-5`) — dùng để tính bề rộng thẻ và bước cuộn. */
const GAP_PX = 20

/** Bề rộng thẻ: 82% màn hình (mobile, lóng thẻ kế) · 2 thẻ (sm) · 4 thẻ (lg) — trừ đúng các khoảng hở. */
const CARD_WIDTH = 'w-[82%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]'

/**
 * Dải "Danh sách thư viện mẫu" — 4 mẫu bản vẽ 2D đầu tiên rồi tới 4 mẫu nội thất 3D, lấy từ thư viện
 * của trang Cẩm nang.
 *
 * ★ Cuộn ngang ở MỌI cỡ màn: một lượt thấy 4 thẻ (desktop) / 2 thẻ (sm) / 1 thẻ + lóng thẻ kế (mobile);
 * kéo hoặc bấm mũi tên (từ `sm`) để xem 4 thẻ tiếp theo. Thanh cuộn được ẩn.
 *
 * ★ Thẻ hiện lần lượt; ảnh mờ→nét, nhãn trượt vào từ trái, thông số hiện từng mục; rê thẻ thì nhấc.
 * Thẻ đầu mang `id="home-dossier-0"` — đích của nút "Xem hồ sơ mẫu" ở hero. Mobile có chấm chỉ vị trí.
 */
export function HomeDossiers({ items }: HomeDossiersProps) {
  const t = useTranslations('landing.dossiers')
  const tCommon = useTranslations('common')
  const { ref: trackRef, active, scrollTo } = useScrollSnapIndex<HTMLUListElement>()
  const [edge, setEdge] = useState({ start: true, end: false })

  // Mũi tên mờ đi ở hai đầu hàng: theo dõi vị trí cuộn của chính dải này.
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const update = () =>
      setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [trackRef, items])

  const page = (direction: 1 | -1) => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: direction * (el.clientWidth + GAP_PX), behavior: 'smooth' })
  }

  const fallback = items !== undefined && items.length === 0
  const cards: readonly HomeTemplateItem[] | null = items === undefined || fallback ? null : items
  const dotCount = cards ? cards.length : fallback ? HOME_DOSSIERS.length : 0

  return (
    <section id='home-dossiers' className='mx-auto w-full max-w-[90rem] px-4 pt-5 pb-5 lg:px-8 lg:py-16'>
      <header className='flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          {/* Cùng khuôn với các khối phía trên: dưới `lg` bỏ dòng nhãn, tiêu đề LỚN là "Hồ sơ mẫu"
              (`titleMobile`) và câu "Danh sách thư viện mẫu" thành mô tả nhỏ bên dưới. Từ `lg` giữ nguyên
              nhãn + tiêu đề. */}
          <p className='text-primary hidden text-xs font-semibold tracking-[0.16em] uppercase lg:block'>
            {t('eyebrow')}
          </p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>
            <span className='lg:hidden'>{t('titleMobile')}</span>
            <span className='hidden lg:inline'>{t('title')}</span>
          </h2>
          <p className='text-muted-foreground text-sm lg:hidden'>{t('title')}</p>
        </div>

        <div className='flex items-center gap-4'>
          <Link
            href={LIBRARY_HREF}
            className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
          >
            {t('viewAll')}
            <ChevronRight className='size-4 lg:hidden' />
            <ArrowRight className='hidden size-4 lg:block' />
          </Link>

          {/* Mũi tên chuyển 4 thẻ — mobile vuốt tay nên không cần. */}
          <div className='hidden items-center gap-2 sm:flex'>
            <Button
              type='button'
              variant='outline'
              size='icon-sm'
              aria-label={tCommon('previous')}
              disabled={edge.start}
              onClick={() => page(-1)}
            >
              <ChevronLeft className='size-4' />
            </Button>
            <Button
              type='button'
              variant='outline'
              size='icon-sm'
              aria-label={tCommon('next')}
              disabled={edge.end}
              onClick={() => page(1)}
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </header>

      {/* `-my-2 py-2`: chừa chỗ cho thẻ nhấc + bóng khi rê, vì `overflow-y-hidden` (cần để hàng cuộn ngang
          không sinh thanh cuộn dọc) sẽ cắt phần tràn ra ngoài. */}
      <ul
        ref={trackRef}
        className='mt-6 -mb-2 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden py-2 [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden'
      >
        {items === undefined
          ? Array.from({ length: 4 }, (_, index) => (
              <li key={index} className={cn('shrink-0 snap-start', CARD_WIDTH)}>
                <Skeleton className='aspect-[4/5] w-full rounded-2xl' />
              </li>
            ))
          : cards
            ? cards.map((item, index) => <DossierCard key={item.id} item={item} index={index} />)
            : HOME_DOSSIERS.map((dossier, index) => <FallbackCard key={dossier} dossier={dossier} index={index} />)}
      </ul>

      {/* Chấm chỉ vị trí — chỉ có ý nghĩa trên mobile (một thẻ mỗi lượt, lộ mép thẻ kế). */}
      {dotCount > 1 ? (
        <div className='mt-4 flex items-center justify-center gap-2 sm:hidden'>
          {Array.from({ length: dotCount }, (_, index) => (
            <button
              key={index}
              type='button'
              aria-label={String(index + 1)}
              onClick={() => scrollTo(index)}
              className={cn('size-1.5 rounded-full transition-colors', index === active ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

/** Bốn hồ sơ minh hoạ dự phòng (khi thư viện chưa có mẫu) — chữ trong i18n, ảnh do admin thay được. */
function FallbackCard({ dossier, index }: { dossier: HomeDossier; index: number }) {
  const t = useTranslations('landing.dossiers')
  const src = useSiteImage(DOSSIER_IMAGE[dossier])

  return (
    <DossierCard
      index={index}
      item={{
        id: dossier,
        href: LIBRARY_HREF,
        title: t(`items.${dossier}.title`),
        badge: t(`items.${dossier}.badge`),
        facts: [
          { kind: 'area', text: t(`items.${dossier}.area`) },
          { kind: 'floors', text: t(`items.${dossier}.floors`) },
          { kind: 'images', text: t(`items.${dossier}.options`) }
        ],
        cover: <RevealPhoto className='size-full' src={src} alt='' />
      }}
    />
  )
}

function DossierCard({ item, index }: { item: HomeTemplateItem; index: number }) {
  const t = useTranslations('landing.dossiers')

  // Thẻ ở xa (chưa tới trong hàng cuộn ngang) chỉ hiện khi vuốt tới; thẻ lóng mép cũng phải hiện được — mà
  // một mép nhỏ không bao giờ đạt 30% diện tích. `some` = chỉ cần thấy 1 pixel là hiện.
  const revealAmount = 'some'
  // Chỉ 4 thẻ đầu lệch nhịp theo thứ tự; thẻ sau vào là hiện ngay khi tới.
  const order = Math.min(index, 3)

  return (
    <motion.li
      id={index === 0 ? 'home-dossier-0' : undefined}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: revealAmount }}
      transition={{ duration: 0.65, delay: order * 0.12, ease: revealEase }}
      className={cn(
        'bg-card group shrink-0 snap-start overflow-hidden rounded-2xl border transition-[box-shadow,transform] duration-500 ease-out hover:-translate-y-0.5 hover:shadow-lg',
        CARD_WIDTH
      )}
    >
      <Link href={item.href} className='flex h-full flex-col'>
        <div className='relative aspect-[4/3] w-full'>
          {item.cover}
          {/* Nhãn loại mẫu trượt vào từ mép trái, đúng sau khi ảnh bắt đầu hiện. */}
          <motion.span
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: revealAmount }}
            transition={{ duration: 0.35, delay: order * 0.1 + 0.25, ease: revealEase }}
            className='bg-brand-orange text-brand-orange-foreground absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-semibold'
          >
            {item.badge}
          </motion.span>
        </div>

        <div className='flex flex-1 flex-col gap-2 p-4'>
          <h3 className='line-clamp-2 font-bold'>{item.title}</h3>

          <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
            {item.facts.map(({ kind, text }, factIndex) => {
              const Icon = FACT_ICON[kind]
              return (
                /* Vạch ngăn dọc giữa các thông số (ảnh mockup) — ô đầu không có; mỗi mục hiện lần lượt
                   sau nhãn loại mẫu. */
                <motion.li
                  key={`${kind}-${factIndex}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: revealAmount }}
                  transition={{ duration: 0.3, delay: order * 0.1 + 0.35 + factIndex * 0.08 }}
                  className='flex items-center gap-1.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-4'
                >
                  <Icon className='text-primary/70 size-3.5' />
                  {text}
                </motion.li>
              )
            })}
          </ul>

          <span className='text-primary mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium group-hover:underline'>
            {t('viewOne')}
            <ArrowRight className='size-3.5' />
          </span>
        </div>
      </Link>
    </motion.li>
  )
}
