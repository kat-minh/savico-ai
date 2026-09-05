'use client'

import { HardHat, PencilRuler } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
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

  const tabs = [
    { key: 'design' as const, href: ROUTES.PLANS, icon: PencilRuler, label: t('design') },
    { key: 'supervision' as const, href: ROUTES.PLANS_SUPERVISION, icon: HardHat, label: t('supervision') }
  ]

  return (
    <div className='mx-auto w-full max-w-[90rem] px-4 pt-8 lg:px-8'>
      <nav className='bg-muted/60 mx-auto flex w-fit gap-1 rounded-xl p-1'>
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className='size-4' />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
