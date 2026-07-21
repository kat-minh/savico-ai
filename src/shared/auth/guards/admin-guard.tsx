'use client'

import { ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { EmptyState } from '@/shared/components/common'
import { ROLES } from '../auth.constants'
import { RoleGuard } from './role-guard'

/**
 * In-page admin gate. Renders children only for `admin`, otherwise shows a
 * localized "no access" state. Use inside a page already wrapped by
 * `ProtectedRoute` to layer role authorization on top of authentication.
 *
 * UX only — the backend remains the source of truth for authorization.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const t = useTranslations('auth.forbidden')

  return (
    <RoleGuard
      allow={[ROLES.ADMIN]}
      fallback={<EmptyState icon={ShieldAlert} title={t('title')} description={t('description')} />}
    >
      {children}
    </RoleGuard>
  )
}
