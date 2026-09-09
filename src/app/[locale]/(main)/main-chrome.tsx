'use client'

import { Suspense } from 'react'

import { AuthDialog, useLogout } from '@/features/auth'
import { CreateProjectDialog, useDesignStore } from '@/features/design'
import { useAuth } from '@/shared/auth'
import { AccountMenu } from '@/shared/components/account-menu'
import { SiteHeader } from '@/shared/layouts'

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

  return (
    <>
      <SiteHeader UserMenu={UserMenu} onCreateProject={openCreateDialog} />
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
