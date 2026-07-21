'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { type AuthDialogMode, useAuthDialogStore } from '@/shared/auth'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

/**
 * Guest auth popup: login and register in one dialog with tabs, so the public
 * site never navigates to a separate page. Open-state is global
 * (`useAuthDialogStore`) so any trigger opens it — mount this once per public
 * layout.
 */
export function AuthDialog() {
  const t = useTranslations('auth')
  const { isOpen, mode, open, setOpen } = useAuthDialogStore()
  // `useSearchParams`, không phải `window.location`: guard chuyển hướng bằng
  // `router.replace` nên dialog đã mounted sẵn — đọc URL một lần lúc mount thì
  // lần bị đá về sau đó sẽ không mở popup nữa.
  const authParam = useSearchParams().get('auth')

  // Deep-link support: a redirect from a protected route (or any CTA) lands on a
  // public page with `?auth=login|register` to auto-open the popup. The embedded
  // LoginForm reads `?redirect` to route on success (see proxy.ts).
  useEffect(() => {
    if (authParam === 'login' || authParam === 'register') open(authParam)
  }, [authParam, open])

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-lg' position='top-center'>
        <DialogHeader className='items-center text-center'>
          <DialogTitle className='text-title'>{t(`${mode}.title`)}</DialogTitle>
          <DialogDescription>{t(`${mode}.subtitle`)}</DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(value) => open(value as AuthDialogMode)}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='login'>{t('login.submit')}</TabsTrigger>
            <TabsTrigger value='register'>{t('register.submit')}</TabsTrigger>
          </TabsList>
          <TabsContent value='login' className='mt-4'>
            <LoginForm embedded />
          </TabsContent>
          <TabsContent value='register' className='mt-4'>
            <RegisterForm embedded onSwitchToLogin={() => open('login')} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
