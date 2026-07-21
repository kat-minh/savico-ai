'use client'

import { Settings2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { PreferenceSwitches } from '@/shared/components/common/preference-switches'
import { Button } from '@/shared/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'

/**
 * Ngôn ngữ + giao diện cho khách chưa đăng nhập.
 *
 * Người đã đăng nhập chỉnh hai thứ này trong menu tài khoản; khách không có menu
 * đó nên vẫn cần một lối vào, nếu không họ mất hẳn khả năng đổi ngôn ngữ.
 */
export function PreferencesMenu() {
  const t = useTranslations('nav')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label={t('preferences')}>
          <Settings2 className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <PreferenceSwitches />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
