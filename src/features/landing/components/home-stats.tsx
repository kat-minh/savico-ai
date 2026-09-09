'use client'

import { Clock, Cog, FileText, House, Users, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
 * Dải 5 con số — một thẻ trắng RIÊNG nằm ĐÚNG TRÊN đường ranh giữa ảnh hero và
 * dải xanh bên dưới: `-mt` kéo nửa trên vào ảnh, `-mb` kéo dải xanh lên đúng
 * bấy nhiêu nên nửa dưới nằm trên nền xanh — hai khối dính liền, không còn
 * khoảng trắng ở giữa. Hai section kia không phải biết gì.
 *
 * Vạch ngăn dọc KHÔNG chạy hết chiều cao: mỗi ô tự vẽ một đoạn kẻ cao 36px bằng
 * `::before` căn giữa trục dọc, ô đầu ẩn đi. Màn hẹp xếp một cột nên đổi sang kẻ
 * ngang giữa các dòng.
 */
export function HomeStats() {
  const t = useTranslations('landing.stats')

  return (
    <section className='relative z-10 mx-auto -mt-9.5 -mb-9.5 w-full max-w-[90rem] px-4 lg:px-8'>
      <ul className='bg-card grid divide-y overflow-hidden rounded-2xl border shadow-lg lg:grid-cols-5 lg:divide-y-0'>
        {HOME_STATS.map((stat) => {
          const Icon = STAT_ICON[stat]
          return (
            <li
              key={stat}
              className='relative flex items-center gap-3.5 px-5 py-5 lg:before:bg-border lg:before:absolute lg:before:top-1/2 lg:before:left-0 lg:before:h-9 lg:before:w-px lg:before:-translate-y-1/2 lg:before:content-[""] lg:first:before:hidden'
            >
              {/* Icon để TRẦN theo ảnh mockup — không ô nền bo góc. */}
              <Icon className='text-primary size-6 shrink-0' strokeWidth={1.75} />
              <span className='flex flex-col leading-tight'>
                <span className='text-primary-strong text-[0.9375rem] font-bold'>{t(`${stat}.value`)}</span>
                <span className='text-muted-foreground text-xs text-pretty'>{t(`${stat}.label`)}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
