'use client'

import { Bot } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { ChatPanel, useChatbotStore, useProactiveChat } from '@/features/chatbot'
import { usePathname } from '@/i18n/navigation'
import { useChatContextStore } from '@/shared/chat-context'
import { AssistantDrawer } from '@/shared/components/assistant-drawer'
import { ROUTES } from '@/shared/constants/routes'
import { useDwellNudge, useIsScrolling, useModalOpen, usePastElement } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'

/** Id của 2 vùng trang chủ trợ lý nhắc nhẹ khi khách dừng lại lâu (mục II.3). */
const NUDGE_SECTIONS = ['home-pain-points', 'home-services'] as const
const NUDGE_MESSAGE_KEY: Record<(typeof NUDGE_SECTIONS)[number], 'painPoints' | 'services'> = {
  'home-pain-points': 'painPoints',
  'home-services': 'services'
}

/** `true` khi phần tử có id này đang lọt vào khung nhìn (rìa dưới màn hình). */
function useElementInView(id: string): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [id])

  return inView
}

/** `true` khi thẻ `<footer>` của trang đã lọt vào khung nhìn. */
function useFooterInView(): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = document.querySelector('footer')
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return inView
}

/**
 * Chatbox AI nổi ở góc phải dưới trên mọi màn hình (quy ước xuyên suốt, mục I).
 * App-layer glue: `shared/` may not import `features/chatbot`, so the drawer
 * shell lives in shared and the chat content is injected here.
 *
 * Cũng là nơi DUY NHẤT chạy kịch bản "AI tự trò chuyện lúc chờ" (mục III.3a) —
 * component này luôn mounted trong layout nên kịch bản không bị chạy lặp.
 *
 * ★ Hiệu ứng nút nổi (mục II.3, vùng 15; trang Tư vấn 1:1 mục 11):
 * - Chỉ hiện sau khi cuộn qua hero (trang không có hero thì hiện ngay) — trượt
 *   lên + nhún 1 lần lúc xuất hiện.
 * - Nghỉ (không rê, không cuộn): vòng tròn "thở" phồng lên rất nhẹ vài giây
 *   một lần; đứng yên ngay khi đang cuộn hoặc đang được rê.
 * - Nhãn tự thu gọn sau vài giây đứng yên, bung lại + sáng hơn khi rê chuột
 *   vào; rê thì nhún nhẹ theo chuột, bấm thì lún nhẹ.
 * - Nhắc nhẹ tối đa 2 lần/phiên khi dừng lại lâu ở dải "Xây nhà không khó"
 *   hoặc "Gói dịch vụ"; tự nhích lên khi cuộn tới footer để không đè lên chân
 *   trang; ẩn hẳn khi có hộp video/menu mobile đang mở; thu gọn (bỏ nhãn +
 *   không nhắc) khi CTA cuối trang đã vào tầm nhìn — trang tự có lời mời riêng
 *   ở đó rồi, trợ lý không cần chen vào.
 */
export function ChatDock() {
  const t = useTranslations('assistant')
  const pathname = usePathname()
  const isGuide = pathname === ROUTES.GUIDE
  const open = useChatContextStore((s) => s.panelOpen)
  const setOpen = useChatContextStore((s) => s.setPanelOpen)
  const setDraft = useChatbotStore((s) => s.setDraft)

  useProactiveChat()

  const pastHero = usePastElement('home-hero-end')
  const modalOpen = useModalOpen()
  const footerInView = useFooterInView()
  const ctaInView = useElementInView('home-cta')
  const isScrolling = useIsScrolling()
  const { nudgeSectionId, dismiss } = useDwellNudge({
    sectionIds: NUDGE_SECTIONS,
    sessionKey: 'savico.assistant-nudge'
  })

  const [labelExpanded, setLabelExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [guideReady, setGuideReady] = useState(false)
  const [guideNudge, setGuideNudge] = useState(false)
  const [lastGuideVideoTitle, setLastGuideVideoTitle] = useState<string | null>(null)
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const guideInteracted = useRef(false)

  // Nhãn tự thu gọn sau vài giây đứng yên; rê chuột vào thì bung lại ngay và
  // hẹn giờ thu gọn lại từ đầu khi rời chuột.
  useEffect(() => {
    clearTimeout(collapseTimer.current)
    if (hovered || !isScrolling) {
      collapseTimer.current = setTimeout(() => setLabelExpanded(true), hovered ? 0 : 650)
    } else {
      collapseTimer.current = setTimeout(() => setLabelExpanded(false), 60)
    }
    return () => clearTimeout(collapseTimer.current)
  }, [hovered, isScrolling])

  useEffect(() => {
    if (!isGuide) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset route-scoped UI state on navigation
      setGuideReady(false)
      setGuideNudge(false)
      return
    }

    let dwellTimer: ReturnType<typeof setTimeout> | undefined
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    const storageKey = 'savico.guide-assistant-nudge.shown'

    const showOnce = (title?: string) => {
      if (sessionStorage.getItem(storageKey)) return
      sessionStorage.setItem(storageKey, '1')
      if (title) setLastGuideVideoTitle(title)
      setLabelExpanded(true)
      setGuideNudge(true)
      hideTimer = setTimeout(() => setGuideNudge(false), 6500)
    }

    const onReady = () => {
      setGuideReady(true)
      dwellTimer = setTimeout(() => {
        if (!guideInteracted.current) showOnce()
      }, 8000)
    }
    const onOpened = () => {
      guideInteracted.current = true
      clearTimeout(dwellTimer)
      setGuideNudge(false)
    }
    const onCompleted = (event: Event) => {
      guideInteracted.current = true
      clearTimeout(dwellTimer)
      const title = (event as CustomEvent<{ title?: string }>).detail?.title
      showOnce(title)
    }

    window.addEventListener('savico:guide-ready', onReady)
    window.addEventListener('savico:guide-video-opened', onOpened)
    window.addEventListener('savico:guide-video-completed', onCompleted)
    return () => {
      clearTimeout(dwellTimer)
      clearTimeout(hideTimer)
      window.removeEventListener('savico:guide-ready', onReady)
      window.removeEventListener('savico:guide-video-opened', onOpened)
      window.removeEventListener('savico:guide-video-completed', onCompleted)
    }
  }, [isGuide])

  useEffect(() => {
    if (isScrolling && guideNudge) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- scrolling dismisses this transient nudge
      setGuideNudge(false)
    }
  }, [guideNudge, isScrolling])

  const nudgeMessage = guideNudge
    ? t('nudge.guideNext')
    : nudgeSectionId
      ? t(`nudge.${NUDGE_MESSAGE_KEY[nudgeSectionId as (typeof NUDGE_SECTIONS)[number]]}`)
      : null

  // Tự tắt nhắc sau vài giây nếu không ai bấm vào.
  useEffect(() => {
    if (!nudgeMessage) return
    const timer = setTimeout(dismiss, 6000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ cần chạy lại khi có nhắc mới
  }, [nudgeMessage])

  const hidden = modalOpen || !pastHero || (isGuide && !guideReady)
  const collapsed = ctaInView

  return (
    <>
      <AnimatePresence>
        {!hidden ? (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.55 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 72, scale: 0.84 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
            className={cn(
              'fixed right-6 z-40 flex flex-col items-end gap-2 transition-[bottom] duration-300',
              footerInView ? 'bottom-28' : 'bottom-6'
            )}
          >
            {/* Bong bóng nhắc nhẹ — không phải khung chat, chỉ một câu gợi ý. */}
            <AnimatePresence>
              {nudgeMessage && !collapsed ? (
                <motion.button
                  type='button'
                  onClick={() => {
                    if (guideNudge) {
                      setDraft(
                        lastGuideVideoTitle
                          ? t('nudge.guidePrompt', { title: lastGuideVideoTitle })
                          : t('nudge.guidePromptGeneral')
                      )
                      setGuideNudge(false)
                    } else {
                      dismiss()
                    }
                    setOpen(true)
                  }}
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  className='bg-card text-foreground max-w-56 rounded-2xl rounded-br-sm border px-3.5 py-2.5 text-left text-xs shadow-lg'
                >
                  {nudgeMessage}
                </motion.button>
              ) : null}
            </AnimatePresence>

            {/* Khi drawer mở, nút nổi rút đi: nó nằm đúng chỗ ô nhập và nút Gửi
                của khung chat (drawer chiếm trọn cạnh phải màn hình) — nút X
                đóng đã có sẵn trên đầu drawer. */}
            <motion.button
              type='button'
              aria-label={t('title')}
              aria-expanded={open}
              tabIndex={open ? -1 : undefined}
              onClick={() => setOpen(true)}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              animate={open ? { opacity: 0, y: 72, scale: 0.84 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              className={cn(
                'group flex cursor-pointer flex-col items-center drop-shadow-lg',
                open && 'pointer-events-none'
              )}
            >
              {/* Một khối liền: tròn robot phía trên, nhãn cùng màu dính bên dưới
                  (đè lên nhau). Nghỉ (không rê, không cuộn) thì "thở" — phồng
                  rất nhẹ theo chu kỳ; rê hay cuộn thì đứng yên ngay. */}
              <motion.span
                animate={!hovered && !isScrolling ? { scale: [1, 1.045, 1] } : { scale: 1 }}
                transition={
                  !hovered && !isScrolling ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }
                }
                className='brand-gradient text-primary-foreground relative z-10 flex size-14 items-center justify-center rounded-full'
              >
                <Bot className='size-7' />
              </motion.span>
              <span
                className={cn(
                  'brand-gradient text-primary-foreground -mt-3 grid rounded-full px-3 text-[0.7rem] font-semibold whitespace-nowrap transition-[grid-template-rows,padding,filter] duration-300 group-hover:brightness-110',
                  labelExpanded && !collapsed ? 'grid-rows-[1fr] pt-3.5 pb-1' : 'grid-rows-[0fr] pt-0 pb-0'
                )}
              >
                <span className='overflow-hidden'>{t('fab')}</span>
              </span>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AssistantDrawer open={open} onClose={() => setOpen(false)}>
        <ChatPanel />
      </AssistantDrawer>
    </>
  )
}
