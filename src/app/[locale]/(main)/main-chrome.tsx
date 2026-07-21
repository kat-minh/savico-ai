'use client'

import type { ReactNode } from 'react'

import { AuthDialog, useLogout } from '@/features/auth'
import { CreateProjectDialog, useDesignStore } from '@/features/design'
import { useAuth } from '@/shared/auth'
import { AccountMenu } from '@/shared/components/account-menu'
import { AuthCta } from '@/shared/components/auth-cta'
import { SiteHeader } from '@/shared/layouts'

/** CTA that opens the global guest auth popup — injected into the toolbar. */
function AuthTrigger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AuthCta mode='login' size='sm' className={className}>
      {children}
    </AuthCta>
  )
}

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
      <SiteHeader AuthTrigger={AuthTrigger} UserMenu={UserMenu} onCreateProject={openCreateDialog} />
      <AuthDialog />
      <CreateProjectDialog />
    </>
  )
}
