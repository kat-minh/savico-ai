'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, FileUp, Gift, Info, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useCmsCollection } from '@/shared/cms'
import { Button } from '@/shared/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Textarea } from '@/shared/components/ui/textarea'
import { contractorReviewRoute, ROUTES } from '@/shared/constants/routes'
import { useGetProvinces, useGetWards } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { formatFileSize } from '../services/brief.service'
import {
  BRIEF_FILE_ACCEPT,
  BRIEF_FILE_MAX_BYTES,
  CONSTRUCTION_SCOPES,
  PROJECT_SCALES,
  SITE_CONDITIONS,
  START_WINDOWS
} from '../constants/contractors.constants'
import { useBrief, useSaveBrief } from '../hooks/use-brief'
import { BRIEF_NOTE_MAX_LENGTH, createBriefSchema, parseAmount, type BriefFormValues } from '../schemas/brief.schema'
import type { BriefDocument } from '../types/contractor.types'

interface BriefFormProps {
  projectId: string
}

/**
 * Bước 1 — Tự tạo hồ sơ dự án (S10), luồng B: khách chưa mua gói.
 *
 * Bố cục hai cột theo bản mô tả: "Thông tin công trình" bên trái, "Nhu cầu thi
 * công" + tài liệu bên phải. Cột trái dài hơn hẳn nên hai cột KHÔNG ép bằng
 * chiều cao — mỗi khối là một thẻ độc lập, xuống mobile thì xếp chồng theo đúng
 * thứ tự đọc.
 *
 * Ngân sách là trường bắt buộc nhưng có ghi chú rõ: nó chỉ dùng để ghép nhà thầu
 * và KHÔNG nằm trong hồ sơ gửi đi (xem S18) — bản mô tả nói hai điều đó ở hai
 * màn khác nhau, người nhập cần biết ngay tại chỗ nhập.
 */
export function BriefForm({ projectId }: BriefFormProps) {
  const t = useTranslations('contractors.brief')
  const tScope = useTranslations('contractors.scope')
  const tScopeHint = useTranslations('contractors.scopeHint')
  const tCondition = useTranslations('contractors.siteCondition')
  const tScale = useTranslations('contractors.scale')
  const tStart = useTranslations('contractors.startWindow')
  const tValidation = useTranslations('validation')
  const locale = useLocale() as Locale
  const router = useRouter()

  const { data: brief, isPending } = useBrief(projectId)
  const save = useSaveBrief(projectId)
  const buildingTypes = useCmsCollection('buildingTypes')

  const [documents, setDocuments] = useState<BriefDocument[]>([])
  const fileInput = useRef<HTMLInputElement>(null)

  const schema = useMemo(
    () =>
      createBriefSchema({
        required: tValidation('required'),
        nameMaxLength: tValidation('maxLength', { max: 120 }),
        areaPositive: tValidation('positiveNumber'),
        budgetPositive: tValidation('positiveNumber'),
        noteRequired: tValidation('required'),
        noteMaxLength: tValidation('maxLength', { max: BRIEF_NOTE_MAX_LENGTH })
      }),
    [tValidation]
  )

  const form = useForm<BriefFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      buildingType: '',
      landArea: '',
      siteCondition: 'empty',
      scale: 'ground+1',
      provinceCode: '',
      wardCode: '',
      street: '',
      budget: '',
      startWindow: 'in-1-3-months',
      scope: 'turnkey',
      scopeNote: ''
    }
  })

  const provinceCode = form.watch('provinceCode')
  const { provinces, isLoadingProvinces } = useGetProvinces()
  const { wards, isLoadingWards } = useGetWards(provinceCode ? Number(provinceCode) : undefined)

  // Mở lại hồ sơ đã lưu: đổ dữ liệu vào form một lần khi nó về tới.
  const loadedRef = useRef(false)
  useEffect(() => {
    if (!brief || loadedRef.current) return
    loadedRef.current = true
    setDocuments(brief.documents)
    form.reset({
      name: brief.name,
      buildingType: brief.buildingType,
      landArea: brief.landArea ? String(brief.landArea) : '',
      siteCondition: brief.siteCondition,
      scale: brief.scale,
      provinceCode: brief.address.provinceCode ? String(brief.address.provinceCode) : '',
      wardCode: brief.address.wardCode ? String(brief.address.wardCode) : '',
      street: brief.address.street,
      budget: brief.budget ? String(brief.budget) : '',
      startWindow: brief.startWindow,
      scope: brief.scope,
      scopeNote: brief.scopeNote
    })
  }, [brief, form])

  /** Gom giá trị form + danh mục hành chính thành payload lưu xuống. */
  const toPayload = (values: BriefFormValues) => ({
    name: values.name,
    buildingType: values.buildingType,
    landArea: parseAmount(values.landArea),
    siteCondition: values.siteCondition,
    scale: values.scale,
    address: {
      provinceCode: Number(values.provinceCode),
      provinceName: provinces.find((p) => String(p.code) === values.provinceCode)?.name ?? '',
      wardCode: Number(values.wardCode),
      wardName: wards.find((w) => String(w.code) === values.wardCode)?.name ?? '',
      street: values.street
    },
    budget: parseAmount(values.budget),
    startWindow: values.startWindow,
    scope: values.scope,
    scopeNote: values.scopeNote,
    documents,
    selfCreated: true
  })

  const onSubmit = (values: BriefFormValues) => {
    save.mutate(toPayload(values), { onSuccess: () => router.push(contractorReviewRoute(projectId)) })
  }

  /** "Lưu nháp": ghi lại đúng những gì đang có, không bắt điền đủ trường. */
  const saveDraft = () => {
    const values = form.getValues()
    save.mutate(toPayload(values), { onSuccess: () => toast.success(t('draftSaved')) })
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const accepted = BRIEF_FILE_ACCEPT.split(',')
    const next: BriefDocument[] = []

    for (const file of Array.from(files)) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
      if (!accepted.includes(extension)) {
        toast.error(t('documents.wrongType', { name: file.name }))
        continue
      }
      if (file.size > BRIEF_FILE_MAX_BYTES) {
        toast.error(t('documents.tooLarge', { name: file.name }))
        continue
      }
      next.push({
        id: `${file.name}-${file.size}`,
        name: file.name,
        sizeBytes: file.size,
        kind: file.type.startsWith('image/') ? 'image' : 'document'
      })
    }

    setDocuments((current) => [...current, ...next.filter((doc) => !current.some((item) => item.id === doc.id))])
  }

  if (isPending) {
    return (
      <div className='mx-auto w-full max-w-6xl px-4 py-8 lg:px-8'>
        <Skeleton className='h-[36rem] rounded-2xl' />
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-8 lg:px-8'>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          href={ROUTES.CONTRACTORS}
          className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
        >
          <ArrowLeft className='size-4' />
          {t('back')}
        </Link>
        <span className='bg-accent text-primary-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium'>
          <Gift className='size-3.5' />
          {t('badge')}
        </span>
      </div>

      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      <BriefSteps current={1} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <div className='grid items-start gap-5 lg:grid-cols-2'>
            {/* Cột trái — Thông tin công trình. */}
            <section className='bg-card space-y-4 rounded-2xl border p-5'>
              <div>
                <h2 className='text-base font-semibold'>{t('site.title')}</h2>
                <p className='text-muted-foreground text-xs'>{t('site.requiredHint')}</p>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('site.name')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('site.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='buildingType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('site.buildingType')} *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder={t('site.buildingTypePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildingTypes
                            .filter((option) => option.enabled)
                            .map((option) => (
                              <SelectItem key={option.id} value={option.label}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='landArea'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('site.landArea')} *</FormLabel>
                    <FormControl>
                      <Input inputMode='numeric' placeholder='120' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='siteCondition'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('site.condition')} *</FormLabel>
                    <ChoiceRow
                      options={SITE_CONDITIONS.map((value) => ({ value, label: tCondition(value) }))}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='scale'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('site.scale')} *</FormLabel>
                    <ChoiceRow
                      options={PROJECT_SCALES.map((value) => ({ value, label: tScale(value) }))}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <fieldset className='space-y-3'>
                <legend className='text-sm font-medium'>{t('site.address')} *</legend>

                <div className='grid gap-3 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='provinceCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-muted-foreground text-xs'>{t('site.province')}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            // Đổi tỉnh thì phường cũ không còn thuộc tỉnh mới.
                            form.setValue('wardCode', '')
                          }}
                          disabled={isLoadingProvinces}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('site.province')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province.code} value={String(province.code)}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='wardCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-muted-foreground text-xs'>{t('site.ward')}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!provinceCode || isLoadingWards}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={t('site.ward')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {wards.map((ward) => (
                              <SelectItem key={ward.code} value={String(ward.code)}>
                                {ward.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='street'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs'>{t('site.street')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('site.streetPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className='text-muted-foreground text-xs'>{t('site.addressHint')}</p>
              </fieldset>

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='budget'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('site.budget')} *</FormLabel>
                      <FormControl>
                        <Input inputMode='numeric' placeholder='1.850.000.000' {...field} />
                      </FormControl>
                      <p className='text-muted-foreground text-xs text-pretty'>{t('site.budgetHint')}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='startWindow'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('site.startWindow')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {START_WINDOWS.map((value) => (
                            <SelectItem key={value} value={value}>
                              {tStart(value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Cột phải — Nhu cầu thi công + tài liệu. */}
            <div className='space-y-5'>
              <section className='bg-card space-y-4 rounded-2xl border p-5'>
                <div>
                  <h2 className='text-base font-semibold'>{t('needs.title')}</h2>
                  <p className='text-muted-foreground text-xs'>{t('needs.subtitle')}</p>
                </div>

                <FormField
                  control={form.control}
                  name='scope'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('needs.scope')} *</FormLabel>
                      <ul className='grid gap-2.5 sm:grid-cols-2'>
                        {CONSTRUCTION_SCOPES.map((value) => {
                          const active = field.value === value
                          return (
                            <li key={value}>
                              <button
                                type='button'
                                onClick={() => field.onChange(value)}
                                aria-pressed={active}
                                className={cn(
                                  'w-full rounded-xl border p-3 text-left transition-colors',
                                  active ? 'border-primary bg-accent' : 'hover:border-primary/40'
                                )}
                              >
                                <span className={cn('block text-sm font-medium', active && 'text-primary-strong')}>
                                  {tScope(value)}
                                </span>
                                <span className='text-muted-foreground mt-0.5 block text-xs'>{tScopeHint(value)}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='scopeNote'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('needs.note')} *</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder={t('needs.notePlaceholder')} {...field} />
                      </FormControl>
                      <div className='text-muted-foreground flex items-center justify-between text-xs'>
                        <span>{t('needs.noteHint')}</span>
                        <span>{t('needs.counter', { current: field.value.length, max: BRIEF_NOTE_MAX_LENGTH })}</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className='bg-card space-y-3 rounded-2xl border p-5'>
                <h2 className='text-sm font-semibold'>
                  {t('documents.title')}{' '}
                  <span className='text-muted-foreground text-xs font-normal'>({t('documents.optional')})</span>
                </h2>

                <div className='flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4'>
                  <span className='bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
                    <FileUp className='size-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{t('documents.dropzone')}</p>
                    <p className='text-muted-foreground text-xs'>{t('documents.formats')}</p>
                  </div>
                  <input
                    ref={fileInput}
                    type='file'
                    multiple
                    accept={BRIEF_FILE_ACCEPT}
                    className='hidden'
                    onChange={(event) => {
                      addFiles(event.target.files)
                      event.target.value = ''
                    }}
                  />
                  <Button type='button' variant='outline' size='sm' onClick={() => fileInput.current?.click()}>
                    {t('documents.choose')}
                  </Button>
                </div>

                {documents.length > 0 ? (
                  <ul className='space-y-2'>
                    {documents.map((document) => (
                      <li key={document.id} className='flex items-center gap-3 rounded-lg border px-3 py-2'>
                        <span className='min-w-0 flex-1 truncate text-sm'>{document.name}</span>
                        <span className='text-muted-foreground text-xs'>{formatFileSize(document, locale)}</span>
                        <button
                          type='button'
                          aria-label={t('documents.remove')}
                          onClick={() => setDocuments((current) => current.filter((item) => item.id !== document.id))}
                          className='text-muted-foreground hover:text-destructive transition-colors'
                        >
                          <Trash2 className='size-4' />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Button type='button' variant='outline' onClick={saveDraft} disabled={save.isPending}>
              {t('saveDraft')}
            </Button>
            <Button type='submit' disabled={save.isPending}>
              {t('continue')}
              <ArrowRight className='size-4' />
            </Button>
          </div>

          <p className='text-muted-foreground bg-warning/10 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-xs'>
            <Info className='text-warning-strong size-4 shrink-0' />
            <span className='text-pretty'>{t('notice')}</span>
            <Link href={ROUTES.PLANS} className='text-primary font-medium underline-offset-4 hover:underline'>
              {t('noticeAction')}
            </Link>
          </p>
        </form>
      </Form>
    </div>
  )
}

/** Hàng nút chọn một-trong-nhiều (Hiện trạng, Quy mô) — S10. */
function ChoiceRow<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm transition-colors',
              active ? 'border-primary bg-accent text-primary-strong font-medium' : 'hover:border-primary/40'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Stepper 2 nấc dùng chung cho S10 và S11.
 *
 * Cùng một bố cục với thanh tiến trình của luồng thanh toán và luồng 3 bước:
 * vòng tròn nằm TRÊN, nhãn nằm DƯỚI và canh giữa theo vòng tròn, đường nối chạy
 * ngang qua tâm hai vòng, hai nấc chia ĐỀU cả chiều rộng. Bản cũ đặt nhãn nằm
 * cạnh vòng tròn nên hai nấc rộng khác nhau, đường nối chỉ mọc ra sau nấc 1 và
 * cả thanh nhìn lệch về một bên. Nấc đã qua cũng đổi sang dấu tích thay vì giữ
 * nguyên con số, cho khớp hai stepper kia.
 */
export function BriefSteps({ current }: { current: 1 | 2 }) {
  const t = useTranslations('contractors.brief.steps')
  const steps = [t('one'), t('two')]

  return (
    <ol className='bg-card mx-auto flex w-full max-w-xl items-start rounded-2xl border px-4 py-4'>
      {steps.map((label, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        return (
          <li key={label} className='relative flex min-w-0 flex-1 flex-col items-center gap-1.5'>
            {/* Đường nối do nấc SAU vẽ, kéo từ tâm nấc trước sang tâm nấc này. */}
            {index > 0 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute top-4 -left-1/2 h-0.5 w-full rounded-full',
                  done || active ? 'bg-primary' : 'bg-border'
                )}
              />
            ) : null}

            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border'
              )}
            >
              {done ? <Check className='size-4' strokeWidth={3} /> : step}
            </span>

            <span
              className={cn(
                'min-w-0 truncate px-2 text-center text-sm',
                active ? 'text-primary-strong font-semibold' : done ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
