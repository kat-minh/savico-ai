'use client'

import type { ComponentProps } from 'react'

import { type AuthDialogMode, useAuthDialogStore } from '@/shared/auth'
import { Button } from '@/shared/components/ui/button'

/** A Button that opens the global guest auth popup on the given tab. */
export function AuthCta({ mode = 'login', ...props }: ComponentProps<typeof Button> & { mode?: AuthDialogMode }) {
  const open = useAuthDialogStore((s) => s.open)
  return <Button onClick={() => open(mode)} {...props} />
}
