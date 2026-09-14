'use client'

import { HardHat, PencilRuler } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { usePageEntrance } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'

interface PlanTabsProps {
  active: 'design' | 'supervision'
}

/**
 * Tab chuyển "Gói thiết kế | Gói giám sát" trên trang Bảng giá (S01 và S19).
 *
 * Hai tab là hai ĐƯỜNG DẪN chứ không phải state của một trang: nút "Chọn cách
 * quản lý thi công" ở khu dự án phải link thẳng vào tab Gói giám sát (R8), mà
 * link thẳng chỉ làm được khi tab có địa chỉ riêng.
 *
 * Bản demo gắn nhãn "Sắp ra mắt" cho tab Gói giám sát; bản mô tả v1.1 thì tab
 * này mở trang S19 thật, nên ở đây không có nhãn đó.
 */
export function PlanTabs({ active }: PlanTabsProps) {
  const t = useTranslations('plans.tabs')
  const router = useRouter()
  const { rootRef, entranceState, entranceStyle } = usePageEntrance('plans.tabs')
  const busy = useRef(false)
  const [isChanging, setIsChanging] = useState(false)
  const [visualActive, setVisualActive] = useState(active)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const reduceMotion = Boolean(useReducedMotion())
  const displayedActive = isChanging ? visualActive : active

  useLayoutEffect(() => {
    document.dispatchEvent(new Event('plan-content-ready'))
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const nav = root.querySelector<HTMLElement>('[data-plan-tabs]')
    const update = () => {
      const button = nav?.querySelector<HTMLElement>(`[data-plan-tab="${displayedActive}"]`)
      if (!nav || !button) return
      setIndicator({ left: button.offsetLeft, width: button.offsetWidth, ready: true })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => observer.disconnect()
  }, [displayedActive, rootRef])

  async function changeTab(event: MouseEvent<HTMLAnchorElement>, key: string, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    if (key === active || busy.current) return
    busy.current = true
    setIsChanging(true)
    const destination = Math.max(0, (rootRef.current?.getBoundingClientRect().top ?? 0) + scrollY - 72)
    if (scrollY > destination + 120) {
      window.scrollTo({ top: destination, behavior: reduceMotion ? 'auto' : 'smooth' })
      await new Promise<void>((resolve) => {
        const start = performance.now()
        const tick = () =>
          Math.abs(scrollY - destination) < 3 || performance.now() - start > 1400
            ? resolve()
            : requestAnimationFrame(tick)
        requestAnimationFrame(tick)
      })
    }
    setVisualActive(key as typeof active)
    if (!reduceMotion) await new Promise((resolve) => setTimeout(resolve, 300))
    if (!reduceMotion && document.startViewTransition) {
      document.documentElement.style.setProperty('--plan-direction', key === 'supervision' ? '1' : '-1')
      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const done = () => {
              clearTimeout(timeout)
              document.removeEventListener('plan-content-ready', done)
              resolve()
            }
            const timeout = setTimeout(done, 2500)
            document.addEventListener('plan-content-ready', done, { once: true })
            router.push(href, { scroll: false })
          })
      )
      await transition.finished.catch(() => undefined)
    } else {
      router.push(href, { scroll: false })
    }
    busy.current = false
    setIsChanging(false)
  }

  const tabs = [
    { key: 'design' as const, href: ROUTES.PLANS, icon: PencilRuler, label: t('design') },
    { key: 'supervision' as const, href: ROUTES.PLANS_SUPERVISION, icon: HardHat, label: t('supervision') }
  ]

  return (
    <div
      ref={rootRef}
      data-page-entrance={entranceState}
      style={entranceStyle}
      className='plans-tabs-enter mx-auto w-full max-w-[90rem] px-4 pt-8 lg:px-8'
    >
      <nav
        data-plan-tabs
        data-entrance-step='0'
        data-entrance-from='soft-scale'
        className='bg-muted/60 relative mx-auto flex w-fit gap-1 rounded-xl p-1'
      >
        <span
          aria-hidden
          data-plan-tab-indicator
          className='bg-primary absolute top-1 bottom-1 rounded-lg shadow-sm'
          style={
            {
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.ready ? 1 : 0,
              '--tab-duration': reduceMotion ? '0ms' : '240ms'
            } as CSSProperties
          }
        />
        {tabs.map((tab) => {
          const isActive = tab.key === displayedActive
          return (
            <Link
              key={tab.key}
              href={tab.href}
              data-plan-tab={tab.key}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => void changeTab(event, tab.key, tab.href)}
              className={cn(
                'relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
              )}
            >
              <tab.icon className='relative z-10 size-4' />
              <span className='relative z-10'>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
