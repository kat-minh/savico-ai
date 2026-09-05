'use client'

import { Suspense } from 'react'

import { AuthDialog, useLogout } from '@/features/auth'
import { CreateProjectDialog, useDesignStore } from '@/features/design'
import { usePathname } from '@/i18n/navigation'
import { useAuth } from '@/shared/auth'
import { AccountMenu } from '@/shared/components/account-menu'
import { ROUTES } from '@/shared/constants/routes'
import { SiteHeader } from '@/shared/layouts'
import { useHomeBackdropStore } from './home-backdrop.store'

/** Signed-in account dropdown, wired with the auth feature's logout flow. */
function UserMenu() {
  const { user } = useAuth()
  const logout = useLogout()
  if (!user) return null
  return <AccountMenu user={user} onLogout={() => logout.mutate()} />
}

/**
 * App-layer glue for the shared toolbar (mục II.1).
 *
 * Lives in `app/` because only this layer may import `features/auth` and
 * `features/design` at the same time. Also mounts the two global dialogs:
 * the guest auth popup and the "Tạo dự án" modal.
 */
export function MainChrome() {
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)

  // Switch nền chỉ có nghĩa ở trang chủ (nơi có `HomeBackdrop`), nên chỉ nối
  // handler khi đang ở route đó — các trang khác không thấy nút.
  const pathname = usePathname()
  const isHome = pathname === ROUTES.HOME
  const plainBackground = useHomeBackdropStore((s) => s.plain)
  const toggleBackground = useHomeBackdropStore((s) => s.toggle)

  return (
    <>
      <SiteHeader
        UserMenu={UserMenu}
        onCreateProject={openCreateDialog}
        plainBackground={plainBackground}
        onToggleBackground={isHome ? toggleBackground : undefined}
      />
      {/* `AuthDialog` đọc `?auth=` và `?redirect=` bằng `useSearchParams`, nên nó
          phải nằm trong ranh giới Suspense của RIÊNG mình. Trước đây ranh giới
          đó do `app/[locale]/loading.tsx` vô tình đảm nhiệm — mà chính file ấy
          lại làm treo mọi route có đoạn cuối động khi tải thẳng URL. Bỏ file
          kia thì phải khai báo ranh giới ở đúng chỗ cần, là đây. */}
      <Suspense fallback={null}>
        <AuthDialog />
      </Suspense>
      <CreateProjectDialog />
    </>
  )
}
