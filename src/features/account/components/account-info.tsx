'use client'

import { Mail, Pencil, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/shared/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

/**
 * Thẻ hồ sơ tài khoản (mục IX, Hình 17): ảnh đại diện lớn, tên, số điện thoại,
 * email và nút "Chỉnh sửa". Là thẻ trên cùng của cột trái trang Tài khoản; thẻ
 * "GÓI CỦA TÔI" nằm ngay dưới (`PlanCard`).
 */
export function AccountInfo() {
  const t = useTranslations('account.info')
  const { user } = useAuth()

  if (!user) return <Skeleton className='h-72 w-full rounded-2xl' />

  const initials =
    user.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'

  const contacts = [
    { key: 'phone' as const, icon: Phone, value: user.phone ?? t('notProvided'), muted: !user.phone },
    { key: 'email' as const, icon: Mail, value: user.email, muted: false }
  ]

  return (
    <section className='bg-card rounded-2xl border p-6 text-center'>
      <Avatar className='mx-auto size-24'>
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback className='text-2xl font-semibold'>{initials}</AvatarFallback>
      </Avatar>

      <h2 className='text-primary-strong mt-3 truncate text-xl font-bold'>{user.name}</h2>

      {/* Hình 17: mỗi dòng liên hệ là icon tròn xanh nhạt + "Nhãn: giá trị". */}
      <dl className='mt-4 space-y-2.5 text-left'>
        {contacts.map(({ key, icon: Icon, value, muted }) => (
          <div key={key} className='flex items-center gap-2.5'>
            <span className='bg-accent text-primary-strong flex size-7 shrink-0 items-center justify-center rounded-full'>
              <Icon className='size-3.5' />
            </span>
            <dt className='text-muted-foreground shrink-0 text-sm'>{t(key)}:</dt>
            <dd className={cn('min-w-0 truncate text-sm font-medium', muted && 'text-muted-foreground font-normal')}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {/* TODO: open the profile edit form once the account endpoints exist. */}
      <Button variant='outline' className='mt-5 w-full'>
        <Pencil className='size-3.5' />
        {t('edit')}
      </Button>
    </section>
  )
}
