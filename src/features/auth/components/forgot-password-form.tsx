'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { createForgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/forgot-password.schema'

/** Password-reset request form. UI-first: sending the email is mocked. */
export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot')
  const tv = useTranslations('validation')
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      createForgotPasswordSchema({
        required: tv('required'),
        email: tv('email')
      }),
    [tv]
  )

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  })

  function onSubmit(values: ForgotPasswordFormValues) {
    setPending(true)
    setTimeout(() => {
      setPending(false)
      setSentTo(values.email)
    }, 900)
  }

  if (sentTo) {
    return (
      <Card className='w-full max-w-sm'>
        <CardHeader className='items-center text-center'>
          <div className='bg-success/10 mb-2 flex size-12 items-center justify-center rounded-full'>
            <MailCheck className='text-success size-6' />
          </div>
          <CardTitle className='text-title'>{t('sentTitle')}</CardTitle>
          <CardDescription>{t('sentSubtitle', { email: sentTo })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant='outline' className='w-full'>
            <Link href={`${ROUTES.HOME}?auth=login`}>
              <ArrowLeft className='size-4' />
              {t('backToLogin')}
            </Link>
          </Button>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
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

        <Button asChild variant='link' className='mt-4 w-full'>
          <Link href={ROUTES.LOGIN}>
            <ArrowLeft className='size-4' />
            {t('backToLogin')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
