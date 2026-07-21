'use client'

import { Mail, Pencil, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/shared/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

/**
 * Thẻ hồ sơ tài khoản (mục IV, khu vực 1): tên, số điện thoại, email, nút chỉnh
 * sửa. Là cột trái cố định của Cửa sổ cá nhân nên trình bày theo chiều dọc —
 * ảnh đại diện lớn, danh tính, rồi các dòng liên hệ.
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
    <section className='bg-card overflow-hidden rounded-2xl border'>
      {/* Dải màu thương hiệu làm nền cho ảnh đại diện. */}
      <div className='from-primary/18 to-accent h-20 bg-linear-to-br' />

      <div className='-mt-10 px-6 pb-6 text-center'>
        <Avatar className='border-card mx-auto size-20 border-4 shadow-sm'>
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className='text-xl font-semibold'>{initials}</AvatarFallback>
        </Avatar>

        <h2 className='mt-3 truncate text-lg font-semibold'>{user.name}</h2>
        <p className='text-muted-foreground truncate text-sm'>{t('title')}</p>

        <dl className='mt-6 space-y-3 text-left'>
          {contacts.map(({ key, icon: Icon, value, muted }) => (
            <div key={key} className='bg-muted/50 flex items-center gap-3 rounded-xl px-3 py-2.5'>
              <Icon className='text-muted-foreground size-4 shrink-0' />
              <div className='min-w-0'>
                <dt className='text-muted-foreground text-xs'>{t(key)}</dt>
                <dd className={cn('truncate text-sm font-medium', muted && 'text-muted-foreground font-normal')}>
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        {/* TODO: open the profile edit form once the account endpoints exist. */}
        <Button variant='outline' className='mt-5 w-full'>
          <Pencil className='size-3.5' />
          {t('edit')}
        </Button>
      </div>
    </section>
  )
}
