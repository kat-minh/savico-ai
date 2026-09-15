'use client'

import { ArrowRight, DraftingCompass, FilePen, FileText, House, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { revealEase } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { HOME_JOURNEY_STEPS, type HomeJourneyStep } from '../constants/landing.constants'

const STEP_ICON: Record<HomeJourneyStep, LucideIcon> = {
  project: FilePen,
  design: DraftingCompass,
  dossier: FileText,
  contractor: Users,
  build: House
}

const DETAIL_FIELDS = ['youDo', 'savicoDoes', 'youGet'] as const

interface HomeJourneyProps {
  onCreateProject?: () => void
  /** Dự án dở gần nhất — bước hiện tại tự sáng, các bước trước có dấu ✓. */
  activeProject?: { id: string; href: string; currentStep: HomeJourneyStep } | null
}

/**
 * Dải "Từ ý tưởng đến ngôi nhà hoàn thiện chỉ trong 5 bước".
 *
 * Năm thẻ đánh số nối bằng mũi tên, kết bằng nút tạo dự án. Mũi tên là Ô RIÊNG
 * của lưới (`li` dùng `contents` để nhả hai con ra thẳng lưới) chứ không vẽ đè
 * lên thẻ: có vậy thẻ mới co giãn theo nội dung mà mũi tên vẫn nằm đúng giữa
 * hai thẻ ở mọi bề ngang.
 *
 * ★ Thẻ hiện lần lượt, mũi tên vẽ nét ngay sau; đứng yên ~1,5s thì viền sáng
 * lướt 01→05 một vòng (rê chuột thì dừng); bấm thẻ mở chi tiết tại chỗ; có
 * dự án dở thì bước hiện tại tự sáng + nút CTA đổi thành "Mở tiếp dự án".
 */
export function HomeJourney({ onCreateProject, activeProject }: HomeJourneyProps) {
  const t = useTranslations('landing.journey')
  const [hovered, setHovered] = useState<number | null>(null)
  // Bước xa nhất đã rê qua trong lượt rê chuột hiện tại — chỉ TĂNG dần khi rê
  // sang thẻ sau, không tụt lại khi rê giữa các thẻ (tránh giật nền xám của
  // các thẻ đã qua); chỉ về null khi chuột rời HẲN cả dải 5 thẻ.
  const [hoverReached, setHoverReached] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<HomeJourneyStep | null>(null)
  const [sweepIndex, setSweepIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sweepTimer = useRef<ReturnType<typeof setInterval>>(undefined)

  const activeIndex = activeProject ? HOME_JOURNEY_STEPS.indexOf(activeProject.currentStep) : -1

  const stopSweep = () => {
    clearTimeout(idleTimer.current)
    clearInterval(sweepTimer.current)
    setSweepIndex(null)
  }

  // Đứng yên ~1,5s (không rê chuột vào thẻ nào) thì viền sáng lướt 01→05 đúng
  // một vòng rồi tự tắt; rê chuột vào bất kỳ đâu trong dải thì dừng ngay.
  useEffect(() => {
    if (hovered !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cancels the running sweep timers, not a plain state sync
      stopSweep()
      return
    }
    idleTimer.current = setTimeout(() => {
      let i = 0
      setSweepIndex(0)
      sweepTimer.current = setInterval(() => {
        i += 1
        if (i >= HOME_JOURNEY_STEPS.length) {
          clearInterval(sweepTimer.current)
          setSweepIndex(null)
          return
        }
        setSweepIndex(i)
      }, 420)
    }, 1500)
    return stopSweep
  }, [hovered])

  return (
    <section id='home-journey' className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8 lg:py-16'>
      <header className='flex flex-wrap items-end justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('eyebrow')}</p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
        </div>
        <p className='text-muted-foreground max-w-xs text-sm whitespace-pre-line lg:text-right'>{t('note')}</p>
      </header>

      <ol
        onMouseLeave={() => setHoverReached(null)}
        className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr)_auto)_minmax(0,1fr)] lg:gap-3'
      >
        {HOME_JOURNEY_STEPS.map((step, index) => {
          const Icon = STEP_ICON[step]
          const isCurrent = index === activeIndex
          const isHovered = hovered === index
          const isSweptPassed = sweepIndex !== null && index < sweepIndex
          const isPastResume = activeIndex >= 0 && index < activeIndex
          const isHoverPassed = hoverReached !== null && index < hoverReached
          const isPastCard = isPastResume || isHoverPassed || isSweptPassed
          const isOpen = expanded === step
          const isSwept = sweepIndex === index
          const shouldBounce = isHovered || isCurrent || isSwept || revealed.has(index)

          return (
            <li key={step} className='contents'>
              <motion.div
                id={`home-journey-step-${step}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.12, ease: revealEase }}
                onAnimationComplete={() => setRevealed((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))}
                onMouseEnter={() => {
                  setHovered(index)
                  setHoverReached((prev) => (prev === null ? index : Math.max(prev, index)))
                }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setExpanded((current) => (current === step ? null : step))}
                className={cn(
                  'relative flex h-full cursor-pointer flex-col items-center gap-2 rounded-2xl border p-5 pt-7 text-center transition-colors transition-shadow',
                  isPastCard ? 'bg-muted/40' : 'bg-card',
                  isCurrent && 'border-primary shadow-[0_0_0_3px_var(--color-accent)]',
                  isSwept && 'border-primary shadow-[0_0_0_4px_var(--color-accent),0_0_18px_var(--color-accent)]',
                  isOpen && 'ring-primary/40 ring-2'
                )}
              >
                {/* Con số nằm ĐÈ LÊN viền trên, căn giữa thẻ (ảnh mockup). Rê
                    tới thẻ nào thì huy hiệu số thẻ đó nhún nhẹ + đổi màu đậm;
                    bước đã qua (dự án thật, đã rê tới bước sau — chỉ TĂNG
                    dần, không giật lại khi rê qua lại giữa các thẻ — hoặc đã
                    bị viền sáng lướt qua) ngả xám cả thẻ, số vẫn giữ nguyên,
                    không đổi thành dấu ✓. Huy hiệu cũng nhún khi thẻ vừa hiện
                    ra (reveal) và mỗi lần viền sáng lướt tới nó. */}
                <motion.span
                  animate={shouldBounce ? { y: [0, -5, 0] } : {}}
                  transition={{ duration: 0.4, ease: revealEase }}
                  className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 rounded-lg px-2.5 py-1 text-sm font-bold',
                    isHovered
                      ? 'bg-primary text-primary-foreground'
                      : isPastCard
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary-soft text-primary'
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </motion.span>
                <Icon className='text-primary size-6' strokeWidth={1.75} />
                <h3 className='text-sm leading-snug font-bold text-balance'>{t(`items.${step}.title`)}</h3>
                <p className='text-muted-foreground text-xs leading-relaxed text-pretty'>
                  {t(`items.${step}.description`)}
                </p>

                {isCurrent ? (
                  <span className='bg-primary/10 text-primary-strong rounded-full px-2.5 py-1 text-[11px] font-semibold'>
                    {t('currentStepBadge')}
                  </span>
                ) : null}
              </motion.div>

              {index < HOME_JOURNEY_STEPS.length - 1 ? (
                <motion.div
                  aria-hidden
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.3, delay: index * 0.12 + 0.25, ease: revealEase }}
                  className='hidden origin-left items-center justify-center self-center lg:flex'
                >
                  <ArrowRight className='text-primary/50 size-5' />
                </motion.div>
              ) : null}
            </li>
          )
        })}
      </ol>

      {/* Bấm 1 thẻ thì khung chi tiết NÀY (chung, nằm dưới hàng thẻ) trượt mở
          ra 3 cột "bạn làm gì / SAVICO làm gì / bạn nhận được" cho bước đó —
          giống ảnh mockup; bấm lại chính thẻ đang mở thì khung đóng lại. */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.dl
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: revealEase }}
            className='bg-muted/40 mt-4 grid grid-cols-1 gap-x-6 gap-y-3 overflow-hidden rounded-2xl border p-5 text-left sm:grid-cols-3'
          >
            {DETAIL_FIELDS.map((field) => (
              <div key={field}>
                <dt className='text-primary text-xs font-semibold tracking-wide uppercase'>
                  {t(`detailLabels.${field}`)}
                </dt>
                <dd className='text-muted-foreground mt-1 text-sm leading-relaxed text-pretty'>
                  {t(`items.${expanded}.${field}`)}
                </dd>
              </div>
            ))}
          </motion.dl>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.4, delay: 0.85, ease: revealEase }}
        className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3'
      >
        {activeProject ? (
          <Button asChild className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'>
            <Link href={activeProject.href}>
              {t('resumeCta', { id: activeProject.id })}
              <ArrowRight className='size-4' />
            </Link>
          </Button>
        ) : (
          <Button
            className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'
            onClick={onCreateProject}
          >
            {t('cta')}
            <ArrowRight className='size-4' />
          </Button>
        )}
        <p className='text-muted-foreground flex items-center gap-2 text-sm'>
          <motion.span
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            whileInView={{ opacity: 1, scale: [0.5, 1.3, 1], rotate: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 1.05 }}
          >
            <Sparkles className='text-primary size-4' />
          </motion.span>
          {t('ctaHint')}
        </p>
      </motion.div>
    </section>
  )
}
