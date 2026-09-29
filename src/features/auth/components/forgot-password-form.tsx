'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { isApiError } from '@/shared/lib/api'
import { PasswordInput } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import {
  createForgotPasswordSchema,
  createResetCodeSchema,
  createResetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetCodeFormValues,
  type ResetPasswordFormValues
} from '../schemas/forgot-password.schema'
import { authApi } from '../api/auth.api'

type Step = 'email' | 'code' | 'password' | 'done'

/**
 * Luồng QUÊN MẬT KHẨU 3 bước nối BMT API (STORY-AUTH-001 ALT-02):
 * nhập email → nhập mã gửi qua email (BE cấp phiên quên MK qua cookie) → đặt
 * mật khẩu mới. Xong thì mọi phiên bị cắt, đưa người dùng đăng nhập lại.
 */
export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot')
  const tv = useTranslations('validation')
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)

  const emailSchema = useMemo(() => createForgotPasswordSchema({ required: tv('required'), email: tv('email') }), [tv])
  const codeSchema = useMemo(() => createResetCodeSchema({ required: tv('required'), code: t('codeInvalid') }), [tv, t])
  const passwordSchema = useMemo(
    () =>
      createResetPasswordSchema({
        required: tv('required'),
        passwordMin: tv('passwordMin', { min: 8 }),
        passwordMismatch: tv('passwordMismatch')
      }),
    [tv]
  )

  const emailForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  })
  const codeForm = useForm<ResetCodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' }
  })
  const passwordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  })

  /** Chuẩn hóa lỗi API về một thông báo, fallback là thông báo mặc định. */
  function showError(error: unknown, fallback: string) {
    toast.error(isApiError(error) && error.message ? error.message : fallback)
  }

  async function onSubmitEmail(values: ForgotPasswordFormValues) {
    setPending(true)
    try {
      await authApi.requestPasswordReset(values.email)
      setEmail(values.email)
      setStep('code')
    } catch (error) {
      showError(error, t('requestError'))
    } finally {
      setPending(false)
    }
  }

  async function onSubmitCode(values: ResetCodeFormValues) {
    setPending(true)
    try {
      await authApi.verifyResetCode(email, Number(values.code))
      setStep('password')
    } catch (error) {
      showError(error, t('codeError'))
    } finally {
      setPending(false)
    }
  }

  async function onSubmitPassword(values: ResetPasswordFormValues) {
    setPending(true)
    try {
      await authApi.resetPassword(values.newPassword)
      setStep('done')
    } catch (error) {
      showError(error, t('resetError'))
    } finally {
      setPending(false)
    }
  }

  async function onResend() {
    setPending(true)
    try {
      await authApi.requestPasswordReset(email)
      toast.success(t('resendOk'))
    } catch (error) {
      showError(error, t('requestError'))
    } finally {
      setPending(false)
    }
  }

  const backToLogin = (
    <Button asChild variant='link' className='mt-4 w-full'>
      <Link href={ROUTES.LOGIN}>
        <ArrowLeft className='size-4' />
        {t('backToLogin')}
      </Link>
    </Button>
  )

  if (step === 'done') {
    return (
      <Card className='w-full max-w-sm'>
        <CardHeader className='items-center text-center'>
          <div className='bg-success/10 mb-2 flex size-12 items-center justify-center rounded-full'>
            <MailCheck className='text-success size-6' />
          </div>
          <CardTitle className='text-title'>{t('doneTitle')}</CardTitle>
          <CardDescription>{t('doneSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className='w-full'>
            <Link href={`${ROUTES.HOME}?auth=login`}>{t('goToLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'code') {
    return (
      <Card className='w-full max-w-sm'>
        <CardHeader className='items-center text-center'>
          <div className='bg-primary/10 mb-2 flex size-12 items-center justify-center rounded-full'>
            <KeyRound className='text-primary size-6' />
          </div>
          <CardTitle className='text-title'>{t('codeTitle')}</CardTitle>
          <CardDescription>{t('codeSubtitle', { email })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className='space-y-4'>
              <FormField
                control={codeForm.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('codeLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        autoComplete='one-time-code'
                        placeholder={t('codePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? <Loader2 className='size-4 animate-spin' /> : null}
                {t('codeSubmit')}
              </Button>
            </form>
          </Form>
          <div className='mt-4 flex items-center justify-between text-sm'>
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground'
              onClick={() => setStep('email')}
              disabled={pending}
            >
              {t('changeEmail')}
            </button>
            <button
              type='button'
              className='text-primary hover:underline disabled:opacity-50'
              onClick={onResend}
              disabled={pending}
            >
              {t('resend')}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'password') {
    return (
      <Card className='w-full max-w-sm'>
        <CardHeader className='text-center'>
          <CardTitle className='text-title'>{t('passwordTitle')}</CardTitle>
          <CardDescription>{t('passwordSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className='space-y-4'>
              <FormField
                control={passwordForm.control}
                name='newPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newPasswordLabel')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete='new-password' placeholder={t('passwordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete='new-password' placeholder={t('passwordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? <Loader2 className='size-4 animate-spin' /> : null}
                {t('resetSubmit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-title'>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className='space-y-4'>
            <FormField
              control={emailForm.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type='email' autoComplete='email' placeholder={t('emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full' disabled={pending}>
              {pending ? <Loader2 className='size-4 animate-spin' /> : null}
              {t('submit')}
            </Button>
          </form>
        </Form>
        {backToLogin}
      </CardContent>
    </Card>
  )
}
