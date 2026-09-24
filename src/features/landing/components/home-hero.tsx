'use client'

import Image from 'next/image'
import { ArrowRight, Play, Star } from 'lucide-react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  type Transition
} from 'motion/react'
import { useTranslations } from 'next-intl'
import { type MouseEvent, useEffect, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { revealEase } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { useSessionOnce } from '@/shared/hooks'
import { scrollToAndFlash } from '@/shared/lib'
import { HERO_CARD_ROWS } from '../constants/landing.constants'

interface HomeHeroProps {
  onCreateProject?: () => void
  /** "▷ Xem hướng dẫn 1 phút" — mở hộp video của vùng 09 ngay tại chỗ. */
  onWatchIntro?: () => void
  /** Có dự án dở → nút chính đổi thành "Mở tiếp dự án →" trỏ thẳng route này. */
  resumeHref?: string
}

/** Khoá `sessionStorage` — chuỗi mở màn chỉ chạy một lần mỗi phiên (mục II.2). */
const INTRO_SESSION_KEY = 'savico.hero-intro-played'

/**
 * Khối hero trang chủ (mục II.2, dựng theo ảnh mockup khách gửi).
 *
 * Dải ảnh TRÀN HẾT bề ngang màn hình, không viền không bo góc — chữ và thẻ "Hồ
 * sơ dự án" nằm đè lên ảnh. Dải 5 con số là thẻ trắng RIÊNG bên dưới
 * (`HomeStats`), không dùng chung khung với ảnh.
 *
 * Lưới BA cột (chữ · thẻ · khoảng trống) chứ không phải hai: cột trống bên phải
 * là chỗ để công trình trong ảnh lộ ra — đẩy thẻ sát mép phải là che mất đúng
 * phần đáng nhìn nhất của tấm ảnh.
 *
 * ★ Mở màn theo thứ tự đọc trong ~1,5 giây, CHỈ chạy lần đầu mỗi phiên
 * (`useSessionOnce`); cuộn hay bấm trong lúc đang chạy thì `skip` bật lên và
 * mọi phần còn lại nhảy thẳng tới trạng thái hoàn chỉnh (transition còn 0s).
 * `#home-hero-end` là mốc để `SiteHeader` biết đã cuộn qua hero hay chưa.
 */
export function HomeHero({ onCreateProject, onWatchIntro, resumeHref }: HomeHeroProps) {
  const t = useTranslations('landing.hero')
  // Chữ hero admin sửa được qua kho `uiStrings` (phủ thẳng lên i18n), nên ở đây
  // chỉ cần `t` — không còn tài liệu `home` song song để lệch nhau nữa.
  const background = useSiteImage('home.hero')
  const reduceMotion = useReducedMotion()

  const seenBefore = useSessionOnce(INTRO_SESSION_KEY)
  // Cuộn hay bấm giữa chừng cũng nhảy thẳng tới trạng thái hoàn chỉnh — gộp
  // chung với "đã xem trước đó" thành một cờ `skip` DUY NHẤT thay vì đồng bộ
  // hai state riêng bằng effect.
  const [interacted, setInteracted] = useState(false)
  const skip = seenBefore || interacted || Boolean(reduceMotion)
  const skipStar = interacted || Boolean(reduceMotion)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (!skip && latest > 0) setInteracted(true)
  })

  useEffect(() => {
    if (skip) return
    const fastForward = () => setInteracted(true)
    window.addEventListener('pointerdown', fastForward, { once: true })
    return () => window.removeEventListener('pointerdown', fastForward)
  }, [skip])

  /** Từng mốc thời gian của chuỗi mở màn — 0s hết khi `skip`. */
  const seq = (delay: number, duration = 0.7): Transition => ({
    duration: skip ? 0 : duration,
    delay: skip ? 0 : delay,
    ease: revealEase
  })

  return (
    <section id='home-hero' className='relative isolate overflow-hidden'>
      <div aria-hidden className='absolute inset-0 -z-10'>
        <motion.div
          className='hero-photo-drift absolute inset-0'
          initial={{ opacity: skip ? 1 : 0, scale: 1.03 }}
          animate={{ opacity: 1 }}
          transition={seq(1.05, 0.9)}
        >
          <Image src={background} alt='' fill priority sizes='100vw' className='object-cover object-center' />
        </motion.div>
        {/* CHỈ phủ theo chiều ngang — đặc bên trái cho cột chữ, tan dần sang
            phải. Trước đây có thêm lớp phủ dọc làm mép dưới ảnh chìm vào nền
            trang; mất mép thì thẻ số liệu chẳng còn đường viền nào để nằm đè
            lên, nên bỏ. */}
        <div className='from-background via-background/85 absolute inset-0 bg-gradient-to-r to-transparent' />
      </div>

      {/* Dòng ghi chú viết tay góc phải trên (ảnh mockup) — "vẽ nét" bằng
          clip-path quét trái→phải, chạy SAU CÙNG trong chuỗi mở màn. Ẩn dưới
          lg: chỗ đó không còn ảnh để chú thích, chen vào chỉ làm chật cột chữ. */}
      <motion.p
        initial={{ clipPath: skip ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={seq(1.55, 1.2)}
        className='font-hand text-primary pointer-events-none absolute top-10 right-10 hidden max-w-[17rem] -rotate-4 text-center text-xl leading-snug text-balance lg:block xl:right-20 xl:text-[1.375rem]'
      >
        {t('note')}
      </motion.p>

      {/* Dưới `lg` mọi khối xếp dọc: khoảng cách nút "Xem hướng dẫn" → thẻ "Hồ sơ dự án"
          (`gap-y-4.5` = 18px) phải BẰNG khoảng cách thẻ → dải số liệu bên dưới. Dải
          số liệu (`HomeStats`) kéo lên chờm `-mt-9.5` (38px) vào `pb-14` (56px) của khối
          này, nên chỗ hở thật là 56 − 38 = 18px. Đổi `pb-14` hay `-mt-9.5` thì đổi số này theo.
          Từ `lg` giữ `gap-10` như cũ. */}
      <div className='mx-auto grid w-full max-w-[90rem] items-center gap-y-4.5 px-4 pt-5 pb-14 lg:grid-cols-[minmax(0,1fr)_14rem_minmax(0,0.65fr)] lg:gap-10 lg:px-8 lg:py-20'>
        <div className='space-y-4'>
          <motion.p
            initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={seq(0)}
            className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'
          >
            {t('eyebrow')}
          </motion.p>

          {/* Tiêu đề có HAI bản dựng theo cỡ màn, chỉ một bản hiện (`hidden` gỡ
              bản kia khỏi cây trợ năng nên trình đọc màn hình không đọc đôi):

              · DƯỚI `lg` (mobile/tablet) — chữ chảy liền: phần đầu + phần nhấn là
                một đoạn văn duy nhất, từ cuối phần đầu và từ đầu phần nhấn nằm
                chung một dòng, không còn "ngay" đứng một mình. Không `text-balance`
                (nó co dòng cho đều nên ngắt sớm dù còn chỗ). Tối đa 3 dòng bằng
                `max-h` 3 × 1.15em (dư 0.05em) chứ KHÔNG `line-clamp-3` — cái đó
                biến khối thành `-webkit-box` xếp dọc các phần con, mất chuyện chữ
                chảy liền; chữ dư bị cắt nên CMS có nhắc giới hạn này.
                Phần nhấn KHÔNG dùng lớp phủ `absolute` (vỡ khi xuống dòng) mà tô
                màu bằng `background-clip: text` + dải chuyển sắc trượt từ trái;
                span `inline` nên xuống dòng theo từng từ, dải trượt qua lần lượt
                từng đoạn dòng.
              · Từ `lg` (desktop) — giữ NGUYÊN bản cũ: hai khối `inline-block` cách
                nhau bằng `<br />`, tô xanh bằng lớp phủ clip-path.

              Chỗ ngắt dòng do admin tự đặt: ký tự xuống dòng trong
              `messages/*.json` / ô nhập của CMS, `whitespace-pre-line` giữ nó —
              để tránh trình duyệt tự ngắt giữa một cụm từ. */}
          <h1 className='text-3xl leading-[1.15] font-bold tracking-tight sm:text-4xl lg:text-[2.4rem] lg:text-balance'>
            <motion.span
              initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={seq(0.1, 0.75)}
              className='block max-h-[3.5em] overflow-hidden whitespace-pre-line lg:hidden'
            >
              {t('titleLead')}{' '}
              <motion.span
                initial={{ backgroundPositionX: skip ? '0%' : '100%' }}
                animate={{ backgroundPositionX: '0%' }}
                transition={seq(0.9, 0.9)}
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--color-primary-strong) 50%, color-mix(in oklab, var(--color-foreground) 35%, transparent) 50%)',
                  backgroundSize: '200% 100%'
                }}
                className='bg-clip-text text-transparent'
              >
                {t('titleAccent')}
              </motion.span>
            </motion.span>

            <span className='hidden whitespace-pre-line lg:contents'>
              <motion.span
                initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={seq(0.1, 0.75)}
                className='inline-block'
              >
                {t('titleLead')}
              </motion.span>
              <br />
              {/* "tô xanh từ trái": chữ nền mờ luôn đọc được (kể cả tắt JS), lớp
                  xanh nằm đè lên quét trái→phải bằng clip-path — hai lớp cùng
                  chữ nên khớp pixel-perfect, không lệch glyph. */}
              <motion.span
                initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={seq(0.1, 0.75)}
                className='relative inline-block'
              >
                <span className='text-foreground/35'>{t('titleAccent')}</span>
                <motion.span
                  aria-hidden
                  initial={{ clipPath: skip ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={seq(0.9, 0.9)}
                  className='text-primary-strong absolute inset-0 whitespace-nowrap'
                >
                  {t('titleAccent')}
                </motion.span>
              </motion.span>
            </span>
          </h1>

          {/* Chỗ xuống dòng nằm TRONG câu chữ (ký tự xuống dòng trong
              `messages/*.json`) và `whitespace-pre-line` tôn trọng nó: mô tả
              ngắt hết câu rồi mới xuống dòng, đúng như ảnh mockup, thay vì
              phó mặc trình duyệt ngắt giữa câu. */}
          <motion.p
            initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={seq(0.55, 0.75)}
            className='text-muted-foreground max-w-[38rem] whitespace-pre-line'
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={seq(0.72, 0.75)}
            className='flex flex-col gap-3 pt-1 sm:flex-row'
          >
            {resumeHref ? (
              <Button asChild className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'>
                <Link href={resumeHref}>
                  {t('resumeCta')}
                  <ArrowRight className='size-4' />
                </Link>
              </Button>
            ) : (
              <Button
                className='brand-green-button group h-11 rounded-full px-8 text-base active:scale-95 has-[>svg]:px-8'
                onClick={onCreateProject}
              >
                {t('primaryCta')}
                <ArrowRight className='size-4 transition-transform duration-300 group-hover:translate-x-1' />
              </Button>
            )}
            <Button
              type='button'
              variant='outline'
              className='bg-card/85 h-11 rounded-full px-8 text-base active:scale-95 has-[>svg]:px-8'
              onClick={onWatchIntro}
            >
              <Play className='size-4' />
              {t('secondaryCta')}
            </Button>
          </motion.div>
        </div>

        <HeroDossierCard skip={skip} skipStar={skipStar} seq={seq} />
      </div>
    </section>
  )
}

interface HeroDossierCardProps {
  skip: boolean
  skipStar: boolean
  seq: (delay: number, duration?: number) => Transition
}

/**
 * Thẻ "Hồ sơ dự án" nổi trên ảnh hero — bản rút gọn của khối Thông tin dự án ở
 * Bước 3 (mục III.4). Số liệu là ví dụ minh họa, không phải dự án thật, nên dòng
 * tổng cộng dẫn người xem vào hồ sơ mẫu thay vì nêu một con số tiền.
 *
 * Rê chuột: nhấc + nghiêng nhẹ THEO CHUỘT (tilt 3D bám vị trí con trỏ trong
 * thẻ) — khác `whileHover` tĩnh, cần theo dõi `onMouseMove` để tính góc.
 */
function HeroDossierCard({ skip, skipStar, seq }: HeroDossierCardProps) {
  const t = useTranslations('landing.hero.card')

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 24, mass: 0.8 })
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 24, mass: 0.8 })

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 6)
    rotateX.set(py * -6)
  }

  const onMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: skip ? 1 : 0, y: skip ? 0 : 24, scale: skip ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={seq(0.55, 0.75)}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 800 }}
      whileHover={{ y: -3, transition: { duration: 0.5, ease: revealEase } }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className='bg-card/95 w-full space-y-2.5 rounded-2xl border p-3 shadow-lg backdrop-blur-sm lg:mt-10 lg:-translate-x-14'
    >
      <p className='flex items-center gap-2 text-xs font-semibold'>
        <motion.span
          initial={skipStar ? { opacity: 1, rotate: 0, scale: 1 } : { opacity: 0, rotate: 0, scale: 0.85 }}
          animate={
            skipStar
              ? { opacity: 1, rotate: 0, scale: 1 }
              : {
                  opacity: [0, 1, 1, 1],
                  rotate: [0, 0, 40, 0],
                  scale: [0.85, 1, 1.22, 1]
                }
          }
          transition={{
            duration: skipStar ? 0 : 1.05,
            delay: skipStar ? 0 : 1.35,
            times: [0, 0.18, 0.55, 1],
            ease: 'easeInOut'
          }}
          className='relative inline-flex'
        >
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={skipStar ? { opacity: 0, scale: 1 } : { opacity: [0, 0, 0.9, 0], scale: [0.6, 0.8, 1.8, 2.1] }}
            transition={{
              duration: skipStar ? 0 : 1.05,
              delay: skipStar ? 0 : 1.35,
              times: [0, 0.18, 0.55, 1],
              ease: 'easeInOut'
            }}
            className='bg-warning/70 absolute inset-0 rounded-full blur-sm'
          />
          <Star className='fill-warning text-warning relative size-3.5' />
        </motion.span>
        {t('title')}
      </p>

      <dl className='space-y-1.5 text-xs'>
        {HERO_CARD_ROWS.map((row, index) => (
          <motion.div
            key={row}
            initial={{ opacity: skip ? 1 : 0, x: skip ? 0 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={seq(0.85 + index * 0.11, 0.45)}
            className='flex items-center justify-between gap-4'
          >
            <dt className='text-muted-foreground'>{t(`rows.${row}.label`)}</dt>
            <dd className='font-medium'>{t(`rows.${row}.value`)}</dd>
          </motion.div>
        ))}
      </dl>

      <motion.div
        initial={{ opacity: skip ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={seq(1.2, 0.45)}
        className='flex items-center justify-between gap-4 border-t pt-2 text-xs'
      >
        <span className='font-semibold'>{t('totalLabel')}</span>
        <span className='text-primary font-semibold'>{t('totalValue')}</span>
      </motion.div>

      {/* "Xem hồ sơ mẫu": cuộn mượt TỚI vùng 07 trên cùng trang thay vì điều
          hướng sang /handbook — thẻ đầu của khối "Hồ sơ mẫu" sáng viền 1 nhịp. */}
      <Button
        type='button'
        className='brand-green-button h-8.5 w-full rounded-lg text-xs'
        onClick={() => scrollToAndFlash('home-dossier-0')}
      >
        {t('cta')}
      </Button>
    </motion.div>
  )
}
