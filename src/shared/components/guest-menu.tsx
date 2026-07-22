'use client'

import { LogIn, UserPlus, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useAuthDialogStore } from '@/shared/auth'
import { PreferenceSwitches } from '@/shared/components/common/preference-switches'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'

/**
 * Đối trọng của {@link AccountMenu} cho khách chưa đăng nhập (mục II.1).
 *
 * Thanh công cụ phải giữ nguyên hình dạng ở cả hai trạng thái: một nút chính
 * "Tạo dự án mới" và một biểu tượng tài khoản. Vì vậy khách cũng thấy avatar —
 * chỉ khác nội dung dropdown: Đăng nhập / Đăng ký thay cho hồ sơ và Đăng xuất.
 * Ngôn ngữ + giao diện nằm chung một chỗ ở cả hai menu nên không còn nút bánh
 * răng lẻ loi chỉ hiện với khách.
 */
export function GuestMenu() {
  const t = useTranslations('nav')
  const tLogin = useTranslations('auth.login')
  const tRegister = useTranslations('auth.register')
  const open = useAuthDialogStore((s) => s.open)

  // Mở popup ở tick sau, không mở ngay trong handler của menu item.
  //
  // Cả dropdown lẫn popup đều là lớp "modal" của Radix: khi mở, lớp ghi lại
  // `pointer-events` hiện tại của <body> rồi đặt thành `none`, lúc đóng thì trả
  // lại đúng giá trị đã ghi. Mở popup ngay trong handler nghĩa là popup mount
  // khi dropdown chưa tháo xong, nên nó ghi lại `none` — và tới khi người dùng
  // đăng nhập xong, popup đóng và áp `none` trở lại cho <body>: cả trang không
  // bấm được gì cho tới khi F5. Lùi một tick là dropdown đã tháo và trả
  // `pointer-events` về bình thường trước khi popup ghi lại.
  const openAfterMenuCloses = (mode: 'login' | 'register') => {
    setTimeout(() => open(mode), 0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full' aria-label={t('guest')}>
          <Avatar className='size-8'>
            <AvatarFallback>
              <UserRound className='size-4' />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel className='flex flex-col'>
          <span className='truncate text-sm font-medium'>{t('guest')}</span>
          <span className='text-muted-foreground text-xs font-normal text-pretty'>{t('guestHint')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openAfterMenuCloses('login')}>
          <LogIn />
          {tLogin('submit')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openAfterMenuCloses('register')}>
          <UserPlus />
          {tRegister('submit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <PreferenceSwitches />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
