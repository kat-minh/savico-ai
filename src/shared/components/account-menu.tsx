'use client'

import { ArrowRight, LayoutDashboard, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { ROLES, type AuthUser } from '@/shared/auth'
import { PreferenceSwitches } from '@/shared/components/common/preference-switches'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'
import { ADMIN_ROUTES, ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'

/** Two-letter initials for the avatar fallback (first + last word). */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]![0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** "Mở tiếp dự án" — dự án dở gần nhất, tìm và tính route ở lớp app (mục II.2). */
export interface ResumeProjectLink {
  id: string
  href: string
}

/** Mỗi mục trong dropdown hiện LẦN LƯỢT khi mở (mục II.1) — `fill-mode-both` giữ
 * mục ẩn đúng cho tới lượt của nó thay vì chớp sáng rồi mới trễ. */
const ITEM_STAGGER = [
  'delay-0',
  'delay-[110ms]',
  'delay-[220ms]',
  'delay-[330ms]',
  'delay-[440ms]',
  'delay-[550ms]',
  'delay-[660ms]',
  'delay-[770ms]',
  'delay-[880ms]',
  'delay-[990ms]',
  'delay-[1100ms]',
  'delay-[1210ms]'
] as const

function staggerClass(index: number): string {
  return cn(
    'animate-in fade-in-0 slide-in-from-top-1 fill-mode-both duration-350 motion-reduce:animate-none',
    ITEM_STAGGER[index] ?? ITEM_STAGGER.at(-1)
  )
}

/**
 * Authenticated account dropdown (avatar trigger). Used in public headers where
 * a logged-in visitor should see their account, not the login CTA. Logout is
 * wired by the app layer (the auth feature owns the flow).
 *
 * `resumeProject`: chấm xanh trên avatar + mục "Mở tiếp dự án" đầu menu khi
 * khách đang có một dự án chưa hoàn tất (mục II.2) — lớp app tìm dự án đó
 * (`features/design`) rồi truyền route xuống, `shared/` không được biết
 * `features/design` tồn tại.
 */
export function AccountMenu({
  user,
  onLogout,
  onOpenChange,
  resumeProject
}: {
  user: Pick<AuthUser, 'name' | 'email' | 'avatarUrl' | 'roles'>
  onLogout?: () => void
  onOpenChange?: (open: boolean) => void
  resumeProject?: ResumeProjectLink | null
}) {
  const t = useTranslations('nav')
  const initials = initialsOf(user.name)
  const isAdmin = user.roles?.includes(ROLES.ADMIN) ?? false

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='ring-primary/0 hover:ring-primary/70 relative rounded-full ring-2 transition-[box-shadow] duration-300'
          aria-label={user.name}
        >
          <Avatar className='size-8'>
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
          </Avatar>
          {resumeProject ? (
            <span
              aria-hidden
              className='bg-primary ring-background absolute right-0 bottom-0 size-2.5 rounded-full ring-2'
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        {resumeProject ? (
          <>
            <DropdownMenuItem asChild className={staggerClass(0)}>
              <Link href={resumeProject.href}>
                <ArrowRight className='text-primary' />
                <span className='flex flex-col'>
                  <span className='font-medium'>{t('resumeProject')}</span>
                  <span className='text-muted-foreground font-mono text-xs'>{resumeProject.id}</span>
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={staggerClass(1)} />
          </>
        ) : null}
        <DropdownMenuLabel className='flex flex-col'>
          <span className={cn('truncate text-sm font-medium', staggerClass(resumeProject ? 2 : 0))}>{user.name}</span>
          <span
            className={cn('text-muted-foreground truncate text-xs font-normal', staggerClass(resumeProject ? 3 : 1))}
          >
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={staggerClass(resumeProject ? 4 : 2)} />
        <DropdownMenuItem asChild className={staggerClass(resumeProject ? 5 : 3)}>
          <Link href={ROUTES.DESIGN}>
            <LayoutDashboard />
            {t('design')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={staggerClass(resumeProject ? 6 : 4)}>
          <Link href={ROUTES.ACCOUNT}>
            <UserRound />
            {t('account')}
          </Link>
        </DropdownMenuItem>
        {/* Lối vào khu quản trị — chỉ hiện với vai trò admin (mục X). */}
        {isAdmin ? (
          <DropdownMenuItem asChild className={staggerClass(resumeProject ? 7 : 5)}>
            <Link href={ADMIN_ROUTES.DASHBOARD}>
              <ShieldCheck />
              {t('admin')}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className={staggerClass(resumeProject ? (isAdmin ? 8 : 7) : isAdmin ? 6 : 5)} />
        {/* Ngôn ngữ + giao diện là tuỳ chọn cá nhân nên nằm trong menu tài khoản,
            không chiếm chỗ thường trực trên thanh công cụ. */}
        <PreferenceSwitches className={staggerClass(resumeProject ? (isAdmin ? 9 : 8) : isAdmin ? 7 : 6)} />
        <DropdownMenuSeparator className={staggerClass(resumeProject ? (isAdmin ? 10 : 9) : isAdmin ? 8 : 7)} />
        <DropdownMenuItem
          onClick={onLogout}
          className={staggerClass(resumeProject ? (isAdmin ? 11 : 10) : isAdmin ? 9 : 8)}
        >
          <LogOut />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
