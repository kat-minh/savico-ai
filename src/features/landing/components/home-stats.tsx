'use client'

import { Clock, Cog, FileText, House, Users, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { useCountUp } from '@/shared/hooks'
import { scrollToAndFlash } from '@/shared/lib'
import { cn } from '@/shared/lib/utils'
import { HOME_STATS, type HomeStat } from '../constants/landing.constants'

/** Biểu tượng lấy đúng theo ảnh mockup: nhà · bánh răng · tài liệu · người · đồng hồ. */
const STAT_ICON: Record<HomeStat, LucideIcon> = {
  photo: House,
  steps: Cog,
  options: FileText,
  contractors: Users,
  inspections: Clock
}

/**
 * Bấm ô → cuộn tới vùng liên quan (mục II.2, vùng 03): "3 bước" tới dải 5
 * bước (vùng 05, id `home-journey`), còn "phương án / nhà thầu / lượt" tới
 * đúng thẻ gói của nó ở vùng 06. "1 tấm ảnh" không trỏ đi đâu — không có gì
 * để mở rộng thêm ở đó.
 */
const STAT_TARGET: Partial<Record<HomeStat, string>> = {
  steps: 'home-journey',
  options: 'home-service-design',
  contractors: 'home-service-contractors',
  inspections: 'home-service-supervision'
}

/** "8 phương án" → { number: 8, suffix: " phương án" } để đếm phần số, giữ nguyên phần chữ. */
function splitLeadingNumber(value: string): { number: number; suffix: string } | null {
  const match = /^(\d+)(.*)$/.exec(value)
  if (!match) return null
  return { number: Number(match[1]), suffix: match[2] ?? '' }
}

/**
 * Dải 5 con số — một thẻ trắng RIÊNG nằm ĐÚNG TRÊN đường ranh giữa ảnh hero và
 * dải xanh bên dưới: `-mt` kéo nửa trên vào ảnh, `-mb` kéo dải xanh lên đúng
 * bấy nhiêu nên nửa dưới nằm trên nền xanh — hai khối dính liền, không còn
 * khoảng trắng ở giữa. Hai section kia không phải biết gì.
 *
 * Vạch ngăn dọc KHÔNG chạy hết chiều cao: mỗi ô tự vẽ một đoạn kẻ cao 36px bằng
 * `::before` căn giữa trục dọc, ô đầu ẩn đi. Màn hẹp xếp một cột nên đổi sang kẻ
 * ngang giữa các dòng.
 *
 * ★ Số đếm lên từ 0 đúng một lần khi cuộn tới (mục II.2); rê ô nổi vòng tròn
 * xanh nhạt sau icon; bấm ô có đích thì cuộn mượt + sáng viền đích một nhịp.
 */
export function HomeStats() {
  const t = useTranslations('landing.stats')
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      id='home-stats'
      initial={reduceMotion ? false : { opacity: 0, y: '20%' }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className='relative z-10 mx-auto -mt-9.5 -mb-9.5 w-full max-w-[90rem] px-4 motion-reduce:transform-none lg:px-8'
    >
      <ul className='bg-card grid divide-y overflow-hidden rounded-2xl border shadow-lg lg:grid-cols-5 lg:divide-y-0'>
        {HOME_STATS.map((stat) => {
          const Icon = STAT_ICON[stat]
          const target = STAT_TARGET[stat]
          const rawValue = t(`${stat}.value`)
          const parsed = splitLeadingNumber(rawValue)

          return (
            <StatCell
              key={stat}
              Icon={Icon}
              label={t(`${stat}.label`)}
              rawValue={rawValue}
              parsed={parsed}
              onActivate={target ? () => scrollToAndFlash(target) : undefined}
            />
          )
        })}
      </ul>
    </motion.section>
  )
}

interface StatCellProps {
  Icon: LucideIcon
  label: string
  rawValue: string
  parsed: { number: number; suffix: string } | null
  onActivate?: () => void
}

function StatCell({ Icon, label, rawValue, parsed, onActivate }: StatCellProps) {
  const { ref, display } = useCountUp(parsed?.number ?? 0, { duration: 1.45, delay: 0.1 })

  return (
    <li className='relative lg:before:bg-border lg:before:absolute lg:before:top-1/2 lg:before:left-0 lg:before:h-9 lg:before:w-px lg:before:-translate-y-1/2 lg:before:content-[""] lg:first:before:hidden'>
      <div
        role={onActivate ? 'button' : undefined}
        tabIndex={onActivate ? 0 : undefined}
        onClick={onActivate}
        onKeyDown={
          onActivate
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onActivate()
                }
              }
            : undefined
        }
        className={cn('group flex items-center gap-3.5 px-5 py-5', onActivate && 'cursor-pointer')}
      >
        {/* Icon để TRẦN theo ảnh mockup — không ô nền bo góc; rê ô thì mới nổi
            vòng tròn xanh nhạt sau lưng icon. */}
        <span className='group-hover:bg-accent animate-in fade-in-0 slide-in-from-bottom-2 -m-1.5 flex shrink-0 items-center justify-center rounded-full p-1.5 duration-700 ease-out motion-reduce:animate-none'>
          <Icon className='text-primary size-6 shrink-0' strokeWidth={1.75} />
        </span>
        <span ref={ref} className='flex flex-col leading-tight'>
          <span className='text-primary-strong animate-in fade-in-0 slide-in-from-bottom-2 text-[0.9375rem] font-bold tabular-nums duration-700 ease-out motion-reduce:animate-none'>
            {parsed ? `${display}${parsed.suffix}` : rawValue}
          </span>
          <span className='text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both text-xs text-pretty delay-100 duration-700 ease-out motion-reduce:animate-none'>
            {label}
          </span>
        </span>
      </div>
    </li>
  )
}
