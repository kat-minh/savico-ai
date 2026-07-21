'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Link, useRouter } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { PasswordInput } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { createRegisterSchema, type RegisterFormValues } from '../schemas/register.schema'
import { GoogleButton } from './google-button'

interface RegisterFormProps {
  /** Render bare (no Card chrome) for embedding inside the auth dialog. */
  embedded?: boolean
  /** In embedded mode, switch to the login tab instead of navigating. */
  onSwitchToLogin?: () => void
}

/**
 * Account creation form. UI-first: submission is mocked (no backend) — it
 * simulates a request then routes the new user to the login screen (or, when
 * embedded in the auth dialog, switches to the login tab).
 */
export function RegisterForm({ embedded = false, onSwitchToLogin }: RegisterFormProps = {}) {
  const t = useTranslations('auth.register')
  const tSocial = useTranslations('auth.social')
  const tv = useTranslations('validation')
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const schema = useMemo(
    () =>
      createRegisterSchema({
        required: tv('required'),
        email: tv('email'),
        passwordMin: tv('passwordMin', { min: 8 }),
        passwordMismatch: tv('passwordMismatch'),
        agreeTerms: tv('agreeTerms')
      }),
    [tv]
  )

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    }
  })

  function onSubmit() {
    setPending(true)
    // Mock registration latency.
    setTimeout(() => {
      setPending(false)
      toast.success(t('success'))
      if (embedded && onSwitchToLogin) {
        onSwitchToLogin()
      } else {
        router.push(ROUTES.LOGIN)
      }
    }, 900)
  }

  const content = (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('nameLabel')}</FormLabel>
                <FormControl>
                  <Input autoComplete='name' placeholder={t('namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete='new-password' placeholder={t('passwordPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete='new-password' placeholder={t('confirmPasswordPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='agreeTerms'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <div className='flex flex-row items-center gap-2'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className='font-normal'>
                    {t.rich('agree', {
                      terms: (chunks) => (
                        <Link
                          href={ROUTES.TERMS}
                          target='_blank'
                          className='text-foreground font-medium hover:underline'
                        >
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <Link
                          href={ROUTES.PRIVACY}
                          target='_blank'
                          className='text-foreground font-medium hover:underline'
                        >
                          {chunks}
                        </Link>
                      )
                    })}
                  </FormLabel>
                </div>
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

      <div className='my-6 flex items-center gap-3'>
        <span className='bg-border h-px flex-1' />
        <span className='text-muted-foreground text-xs'>{tSocial('or')}</span>
        <span className='bg-border h-px flex-1' />
      </div>

      <GoogleButton />

      {!embedded && (
        <p className='text-muted-foreground mt-6 text-center text-sm'>
          {t('haveAccount')}{' '}
          <Link href={ROUTES.LOGIN} className='text-foreground font-medium hover:underline'>
            {t('signIn')}
          </Link>
        </p>
      )}
    </>
  )

  if (embedded) return content

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-title'>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
