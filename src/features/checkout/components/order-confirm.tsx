'use client'

import { CheckCircle2, Info, QrCode, RotateCcw, ShieldCheck, SquarePen } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth } from '@/shared/auth'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { ROUTES } from '@/shared/constants/routes'
import { useCmsCollection } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { DISCOUNT_CODES, REFUND_WINDOW_HOURS } from '../constants/checkout.constants'
import { useCreateOrder } from '../hooks/use-checkout'
import type { OrderKind } from '../types/checkout.types'
import { CheckoutSteps } from './checkout-steps'

interface OrderConfirmProps {
  productId: string
  kind: OrderKind
  projectId?: string
}

/**
 * Bước 2/4 — Xác nhận đơn hàng (S03).
 *
 * Bố cục hai cột: thông tin người mua + hóa đơn bên trái, "Đơn hàng của bạn"
 * bên phải và DÍNH THEO CUỘN — nút thanh toán là hành động chính của màn, để nó
 * trôi mất là bắt người dùng cuộn ngược lên tìm.
 *
 * R10: chỉ còn MỘT hình thức thanh toán nên không có ô chọn phương thức, chỉ có
 * một khối thông tin QR. Cũng vì thế không còn dòng nào nói về thẻ hay ví.
 */
export function OrderConfirm({ productId, kind, projectId }: OrderConfirmProps) {
  const t = useTranslations('checkout.confirm')
  const tPlans = useTranslations('plans.tiers')
  const tSupervision = useTranslations('supervision.tiers')
  const locale = useLocale() as Locale
  const { user } = useAuth()

  const plans = useCmsCollection('plans')
  const supervisionPackages = useCmsCollection('supervisionPackages')
  const createOrder = useCreateOrder()

  const product = useMemo(() => {
    if (kind === 'design') {
      const plan = plans.find((item) => item.id === productId)
      return plan
        ? { name: tPlans(plan.tier), price: plan.price, benefits: plan.features?.slice(0, 3) ?? [plan.perk] }
        : null
    }
    const supervision = supervisionPackages.find((item) => item.id === productId)
    return supervision
      ? { name: tSupervision(supervision.tier), price: supervision.price, benefits: supervision.benefits.slice(0, 3) }
      : null
  }, [kind, productId, plans, supervisionPackages, tPlans, tSupervision])

  const [buyer, setBuyer] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? ''
  })
  const [invoiceOn, setInvoiceOn] = useState(false)
  const [invoice, setInvoice] = useState({ company: '', taxCode: '', address: '', email: '' })
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState<{ code: string; percent: number } | null>(null)
  const [codeError, setCodeError] = useState(false)
  const [agreed, setAgreed] = useState(false)

  if (!product) {
    return (
      <div className='mx-auto w-full max-w-3xl px-4 py-16 lg:px-8'>
        <EmptyState
          title={t('missingProduct')}
          action={
            <Button asChild>
              <Link href={ROUTES.PLANS}>{t('backToPlans')}</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const discountAmount = applied ? Math.round((product.price * applied.percent) / 100) : 0
  const total = product.price - discountAmount

  const applyCode = () => {
    const percent = DISCOUNT_CODES[codeInput.trim().toUpperCase()]
    if (!percent) {
      setApplied(null)
      setCodeError(true)
      return
    }
    setApplied({ code: codeInput.trim().toUpperCase(), percent })
    setCodeError(false)
  }

  const submit = () =>
    createOrder.mutate({
      productId,
      kind,
      ...(projectId ? { projectId } : {}),
      buyer,
      invoice: { enabled: invoiceOn, ...invoice },
      discountCode: applied?.code ?? ''
    })

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-8 lg:px-8'>
      <CheckoutSteps current='confirm' />

      <header className='space-y-1 pt-2'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-[2.25rem]'>{t('title')}</h1>
        <p className='text-muted-foreground text-base'>{t('subtitle')}</p>
      </header>

      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-5'>
          <section className='bg-card rounded-2xl border p-5'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-lg font-semibold'>{t('buyerTitle')}</h2>
              <span className='text-primary flex items-center gap-1.5 text-sm'>
                <SquarePen className='size-4' />
                {t('buyerEditable')}
              </span>
            </div>

            <div className='mt-4 grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='buyer-name'>{t('name')}</Label>
                <Input
                  id='buyer-name'
                  value={buyer.name}
                  onChange={(event) => setBuyer({ ...buyer, name: event.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='buyer-phone'>{t('phone')}</Label>
                <Input
                  id='buyer-phone'
                  inputMode='tel'
                  value={buyer.phone}
                  onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='buyer-email'>{t('email')}</Label>
                <Input
                  id='buyer-email'
                  inputMode='email'
                  value={buyer.email}
                  onChange={(event) => setBuyer({ ...buyer, email: event.target.value })}
                />
              </div>
            </div>

            <p className='text-muted-foreground mt-3 text-xs'>{t('receiptNote')}</p>
          </section>

          {/* R10 — chỉ QR chuyển khoản, nên đây là một khối thông tin chứ không
              phải một danh sách để chọn. */}
          <section className='bg-card rounded-2xl border p-5'>
            <h2 className='text-lg font-semibold'>{t('paymentTitle')}</h2>

            <div className='border-primary bg-accent/40 mt-4 flex items-start gap-4 rounded-xl border p-4'>
              <span className='bg-card text-primary flex size-11 shrink-0 items-center justify-center rounded-lg'>
                <QrCode className='size-5' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='font-medium'>{t('qrTitle')}</p>
                <p className='text-muted-foreground mt-0.5 text-sm text-pretty'>{t('qrBody')}</p>
                <span className='bg-primary/10 text-primary-strong mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium'>
                  {t('qrFree')}
                </span>
              </div>
            </div>

            <p className='text-muted-foreground mt-3 flex items-start gap-2 text-xs'>
              <Info className='mt-0.5 size-3.5 shrink-0' />
              <span>{t('qrOnly')}</span>
            </p>
          </section>

          <section className='bg-card rounded-2xl border p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-base font-semibold'>{t('invoiceTitle')}</h2>
                <p className='text-muted-foreground text-sm'>{t('invoiceHint')}</p>
              </div>
              <Switch checked={invoiceOn} onCheckedChange={setInvoiceOn} aria-label={t('invoiceTitle')} />
            </div>

            {invoiceOn ? (
              <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='invoice-company'>{t('company')}</Label>
                  <Input
                    id='invoice-company'
                    value={invoice.company}
                    onChange={(event) => setInvoice({ ...invoice, company: event.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='invoice-tax'>{t('taxCode')}</Label>
                  <Input
                    id='invoice-tax'
                    value={invoice.taxCode}
                    onChange={(event) => setInvoice({ ...invoice, taxCode: event.target.value })}
                  />
                </div>
                <div className='space-y-2 sm:col-span-2'>
                  <Label htmlFor='invoice-address'>{t('address')}</Label>
                  <Input
                    id='invoice-address'
                    value={invoice.address}
                    onChange={(event) => setInvoice({ ...invoice, address: event.target.value })}
                  />
                </div>
                <div className='space-y-2 sm:col-span-2'>
                  <Label htmlFor='invoice-email'>{t('invoiceEmail')}</Label>
                  <Input
                    id='invoice-email'
                    inputMode='email'
                    value={invoice.email}
                    onChange={(event) => setInvoice({ ...invoice, email: event.target.value })}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <label className='flex cursor-pointer items-start gap-2.5 text-sm'>
            <Checkbox checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} />
            <span className='text-pretty'>{t('terms')}</span>
          </label>
        </div>

        {/* Cột phải dính theo cuộn. */}
        <aside className='lg:sticky lg:top-24 lg:self-start'>
          <section className='bg-card rounded-2xl border p-5'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-base font-semibold'>{t('orderTitle')}</h2>
              <Link href={ROUTES.PLANS} className='text-primary text-sm font-medium'>
                {t('changePlan')}
              </Link>
            </div>

            <div className='bg-accent/40 mt-4 rounded-xl border p-4'>
              <p className='text-primary-strong text-lg font-bold tracking-wide uppercase'>{product.name}</p>
              {projectId ? (
                <p className='text-muted-foreground mt-0.5 text-xs'>{t('forProject', { project: projectId })}</p>
              ) : null}

              <ul className='mt-3 space-y-2'>
                {product.benefits.map((benefit) => (
                  <li key={benefit} className='flex items-start gap-2 text-sm'>
                    <CheckCircle2 className='text-primary mt-0.5 size-4 shrink-0' />
                    <span className='text-pretty'>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='mt-4 space-y-2'>
              <Label htmlFor='discount'>{t('discountLabel')}</Label>
              <div className='flex gap-2'>
                <Input
                  id='discount'
                  value={codeInput}
                  placeholder={t('discountPlaceholder')}
                  onChange={(event) => setCodeInput(event.target.value)}
                />
                <Button type='button' variant='outline' onClick={applyCode}>
                  {t('apply')}
                </Button>
              </div>
              {applied ? (
                <p className='text-primary flex items-center gap-1.5 text-xs'>
                  <CheckCircle2 className='size-3.5' />
                  {t('discountApplied', { code: applied.code, percent: applied.percent })}
                </p>
              ) : null}
              {codeError ? <p className='text-destructive text-xs'>{t('discountInvalid')}</p> : null}
            </div>

            <dl className='mt-4 space-y-2 border-t pt-4 text-sm'>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>{t('subtotal')}</dt>
                <dd>{formatCurrency(product.price, locale)}</dd>
              </div>
              {discountAmount > 0 ? (
                <div className='flex items-center justify-between'>
                  <dt className='text-muted-foreground'>{t('discount')}</dt>
                  <dd className='text-primary'>−{formatCurrency(discountAmount, locale)}</dd>
                </div>
              ) : null}
              <div className='flex items-center justify-between border-t pt-2'>
                <dt className='font-semibold'>{t('total')}</dt>
                <dd className='text-primary-strong text-xl font-bold'>{formatCurrency(total, locale)}</dd>
              </div>
              <p className='text-muted-foreground text-right text-xs'>{t('vat')}</p>
            </dl>

            <Button className='mt-4 w-full' size='lg' onClick={submit} disabled={!agreed || createOrder.isPending}>
              {t('submit')}
            </Button>
            {!agreed ? <p className='text-muted-foreground mt-2 text-xs'>{t('termsRequired')}</p> : null}

            <ul className='text-muted-foreground mt-4 space-y-2 text-xs'>
              <li className='flex items-start gap-2'>
                <ShieldCheck className='text-primary mt-0.5 size-3.5 shrink-0' />
                <span>{t('noCardNote')}</span>
              </li>
              <li className='flex items-start gap-2'>
                <RotateCcw className='text-primary mt-0.5 size-3.5 shrink-0' />
                <span>{t('refund', { hours: REFUND_WINDOW_HOURS })}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
