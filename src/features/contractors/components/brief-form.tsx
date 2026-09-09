'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  Armchair,
  BrickWall,
  Check,
  CheckCircle2,
  FileUp,
  Gift,
  House,
  Info,
  PaintRoller,
  Trash2
} from 'lucide-react'
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
import { formatDigitGroups } from '@/shared/utils'
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

/**
 * Icon của bốn thẻ "Phạm vi thi công" (Hình S10): ngôi nhà · tường gạch · con
 * lăn sơn · ghế. Ảnh vẽ icon lớn nằm trên nhãn, đó là thứ phân biệt bốn thẻ khi
 * chúng đứng cùng một hàng.
 */
const SCOPE_ICONS = {
  turnkey: House,
  shell: BrickWall,
  finishing: PaintRoller,
  interior: Armchair
} as const

/**
 * Dấu sao của trường bắt buộc — Hình S10 vẽ nó màu ĐỎ, tách hẳn khỏi màu nhãn.
 * Đặt `aria-hidden` vì bản thân input đã có `required`/schema Zod lo phần ngữ
 * nghĩa; dấu sao ở đây chỉ là tín hiệu thị giác.
 */
function Req() {
  return (
    <span aria-hidden className='text-destructive'>
      {' *'}
    </span>
  )
}

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

  /**
   * Mở lại hồ sơ đã lưu: đổ dữ liệu vào form.
   *
   * Mốc để biết "đã đổ bản này chưa" là `updatedAt`, KHÔNG phải một cờ bật-một-lần.
   * Bản trước dùng `loadedRef` bật một lần cho cả vòng đời component, nên khi khách
   * bấm "Chỉnh sửa" ở Bước 2 quay về đây mà component chưa bị gỡ (router giữ lại
   * cây React của route đã ghé), form giữ nguyên bản hồ sơ CŨ đọc được ở lần đổ đầu
   * — lúc đó Loại công trình / Tỉnh / Phường còn rỗng nên ba ô Select hiện lại
   * placeholder dù dữ liệu đã lưu đầy đủ.
   *
   * `updatedAt` chỉ đổi khi hồ sơ được ghi, nên cách này không đè lên những gì
   * khách đang gõ dở.
   */
  const loadedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!brief || loadedRef.current === brief.updatedAt) return
    loadedRef.current = brief.updatedAt
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
      budget: brief.budget ? formatDigitGroups(String(brief.budget), locale) : '',
      startWindow: brief.startWindow,
      scope: brief.scope,
      scopeNote: brief.scopeNote
    })
  }, [brief, form, locale])

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
          // Hình S10: link "Quay lại lựa chọn" màu XANH thương hiệu, không phải chữ mờ.
          className='text-primary-strong hover:text-primary inline-flex items-center gap-1.5 text-sm font-medium'
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
        {/* Hình S10: TOÀN BỘ form nằm trong MỘT khung bo góc — hai cột, khối tài
            liệu và cả hàng nút "Lưu nháp / Tiếp tục" đều ở trong đó. Bản trước
            tách thành ba thẻ rời rồi để hàng nút trôi bên ngoài. */}
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <section className='bg-card rounded-2xl border p-6'>
            {/* Hình S10: giữa hai cột có ĐƯỜNG KẺ DỌC. Dựng bằng `border-l`
                trên cột phải + lề hai bên, thay vì `gap-x` trơn. */}
            <div className='grid items-stretch gap-y-8 lg:grid-cols-2'>
              {/* Cột trái — Thông tin công trình. */}
              <div className='space-y-4 lg:pr-10'>
                <div>
                  {/* Hình S10: tiêu đề hai cột đều IN HOA. */}
                  <h2 className='text-sm font-semibold tracking-wide uppercase'>{t('site.title')}</h2>
                  <p className='text-muted-foreground mt-0.5 text-xs'>{t('site.requiredHint')}</p>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('site.name')}
                          <Req />
                        </FormLabel>
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
                        <FormLabel>
                          {t('site.buildingType')}
                          <Req />
                        </FormLabel>
                        {/* `key` đổi theo số lượng lựa chọn là để SỬA LỖI mất nhãn khi quay
                        lại Bước 1 từ Bước 2: form được `reset` ngay khi hồ sơ về, thường là
                        TRƯỚC khi danh mục (loại công trình / tỉnh / phường) tải xong. Radix
                        `SelectValue` in ra nội dung của `SelectItem` ĐANG khớp tại thời điểm
                        nhận `value`; lúc đó chưa có item nào nên nó hiện placeholder và không
                        tự vẽ lại khi danh mục về sau. Đổi `key` buộc Select dựng lại, lúc này
                        item đã có nên nhãn hiện đúng. Giá trị trong form chưa bao giờ mất —
                        chỉ phần hiển thị sai. */}
                        {/* Bỏ qua lời gọi với giá trị RỖNG.
                            Sau khi `form.reset` đổ hồ sơ đã lưu vào, ba ô Select
                            (loại công trình / tỉnh / phường) bắn `onValueChange('')`
                            và xoá sạch giá trị vừa đổ — đó là lý do bấm "Chỉnh sửa"
                            ở Bước 2 quay về thì ba ô này trắng trong khi các ô chữ
                            vẫn còn. Danh sách không có lựa chọn rỗng nào, nên chuỗi
                            rỗng chắc chắn không phải do người dùng chọn: bỏ qua là
                            đúng, và cũng chặn luôn mọi nguồn khác (autofill…) làm
                            điều tương tự. */}
                        <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              {/* Nhãn do MÌNH dựng, không để `SelectValue` tự tra.
                                  Radix chỉ in được nhãn khi `SelectItem` khớp đã
                                  mounted vào lúc nhận `value`; form thì `reset`
                                  ngay khi hồ sơ về — thường sớm hơn lúc danh mục
                                  tải xong — nên ô cứ hiện placeholder dù giá trị
                                  vẫn nằm trong form. */}
                              <SelectValue placeholder={t('site.buildingTypePlaceholder')}>
                                {field.value || undefined}
                              </SelectValue>
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
                      <FormLabel>
                        {t('site.landArea')}
                        <Req />
                      </FormLabel>
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
                      <FormLabel>
                        {t('site.condition')}
                        <Req />
                      </FormLabel>
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
                      <FormLabel>
                        {t('site.scale')}
                        <Req />
                      </FormLabel>
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
                  <legend className='text-sm font-medium'>
                    {t('site.address')}
                    <Req />
                  </legend>

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
                              // Xem ghi chú ở ô "Loại công trình".
                              if (!value) return
                              field.onChange(value)
                              // Đổi tỉnh thì phường cũ không còn thuộc tỉnh mới.
                              form.setValue('wardCode', '')
                            }}
                            disabled={isLoadingProvinces}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={t('site.province')}>
                                  {provinces.find((province) => String(province.code) === field.value)?.name}
                                </SelectValue>
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
                            onValueChange={(value) => value && field.onChange(value)}
                            disabled={!provinceCode || isLoadingWards}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                {/* Chưa tải xong danh sách phường thì lấy tạm tên đã
                                    lưu trong hồ sơ, để ô không rỗng khi mở lại. */}
                                <SelectValue placeholder={t('site.ward')}>
                                  {wards.find((ward) => String(ward.code) === field.value)?.name ??
                                    (field.value ? brief?.address.wardName : undefined)}
                                </SelectValue>
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
                        <FormLabel>
                          {t('site.budget')}
                          <Req />
                        </FormLabel>
                        <FormControl>
                          {/* Gõ tới đâu chấm tới đó. Giá trị trong form giữ luôn
                              chuỗi ĐÃ chấm; `parseAmount` khi lưu đã lọc bỏ mọi ký
                              tự không phải số nên không cần state thứ hai. */}
                          <Input
                            inputMode='numeric'
                            placeholder='1.850.000.000'
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value}
                            onChange={(event) => field.onChange(formatDigitGroups(event.target.value, locale))}
                          />
                        </FormControl>
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

                <div className='space-y-3 pt-2'>
                  {/* Hình S10: khối này ở ĐÁY CỘT TRÁI, ngay dưới "Ngân sách dự
                    kiến" — không phải một thẻ riêng ở cột phải. */}
                  <h3 className='text-xs font-semibold tracking-wide uppercase'>
                    {t('documents.title')}{' '}
                    <span className='text-muted-foreground text-[11px] font-normal normal-case'>
                      ({t('documents.optional')})
                    </span>
                  </h3>

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
                </div>
              </div>

              {/* Cột phải — Nhu cầu thi công. */}
              <div className='flex flex-col space-y-4 lg:border-l lg:pl-10'>
                <div>
                  <h2 className='text-sm font-semibold tracking-wide uppercase'>{t('needs.title')}</h2>
                  <p className='text-muted-foreground mt-0.5 text-xs'>{t('needs.subtitle')}</p>
                </div>

                <FormField
                  control={form.control}
                  name='scope'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('needs.scope')}
                        <Req />
                      </FormLabel>
                      {/* Hình S10: BỐN thẻ trên MỘT hàng, mỗi thẻ là icon lớn ở
                          giữa và nhãn nằm dưới — không có dòng mô tả phụ. Thẻ
                          đang chọn: viền xanh, nền xanh nhạt, kèm dấu tích tròn
                          xanh ở GÓC TRÊN PHẢI. */}
                      <ul className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
                        {CONSTRUCTION_SCOPES.map((value) => {
                          const active = field.value === value
                          const Icon = SCOPE_ICONS[value]
                          return (
                            <li key={value}>
                              <button
                                type='button'
                                onClick={() => field.onChange(value)}
                                aria-pressed={active}
                                title={tScopeHint(value)}
                                // `h-full`: ô lưới đã giãn bằng nhau, nhưng nút
                                // bên trong chỉ cao bằng nội dung — nhãn nào
                                // xuống hai dòng ("Thi công trọn gói") thì ô đó
                                // cao hơn hẳn ba ô còn lại. Cho nút chiếm trọn ô
                                // thì cả bốn bằng nhau, và vì các thẻ xếp từ
                                // TRÊN xuống nên biểu tượng của bốn thẻ vẫn nằm
                                // đúng một hàng, phần dôi ra dồn xuống đáy.
                                className={cn(
                                  'relative flex h-full w-full flex-col items-center gap-2 rounded-xl border px-2 py-4 transition-colors',
                                  active ? 'border-primary bg-accent' : 'hover:border-primary/40'
                                )}
                              >
                                {active ? (
                                  <CheckCircle2
                                    aria-hidden
                                    className='fill-primary text-primary-foreground absolute top-1.5 right-1.5 size-4'
                                  />
                                ) : null}
                                <Icon
                                  aria-hidden
                                  className={cn('size-7', active ? 'text-primary-strong' : 'text-primary')}
                                  strokeWidth={1.5}
                                />
                                <span
                                  className={cn(
                                    'text-center text-xs font-medium text-pretty',
                                    active && 'text-primary-strong'
                                  )}
                                >
                                  {tScope(value)}
                                </span>
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
                    // Hình S10: ô mô tả CAO HẾT phần còn lại của cột phải, nên
                    // hai cột bằng nhau và đường kẻ dọc chạy trọn chiều cao.
                    <FormItem className='flex flex-1 flex-col'>
                      <FormLabel>
                        {t('needs.note')}
                        <Req />
                      </FormLabel>
                      <FormControl>
                        <Textarea className='min-h-40 flex-1' placeholder={t('needs.notePlaceholder')} {...field} />
                      </FormControl>
                      <div className='text-muted-foreground flex items-center justify-between text-xs'>
                        <span>{t('needs.noteHint')}</span>
                        <span>{t('needs.counter', { current: field.value.length, max: BRIEF_NOTE_MAX_LENGTH })}</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Hàng nút nằm TRONG khung, có ĐƯỜNG KẺ NGANG ngăn với phần form
                phía trên. Hình S10 còn một nút "Lưu nháp" bên trái — đã bỏ theo
                yêu cầu: hồ sơ vốn được ghi lại ngay khi bấm "Tiếp tục" và vẫn
                nằm ở trạng thái nháp cho tới khi xác nhận ở Bước 2, nên nút đó
                chỉ là một đường ra thứ hai làm loãng thao tác chính. */}
            <div className='mt-8 flex flex-wrap items-center justify-end gap-3 border-t pt-6'>
              <Button type='submit' disabled={save.isPending}>
                {t('continue')}
                <ArrowRight className='size-4' />
              </Button>
            </div>
          </section>

          <p className='text-muted-foreground bg-warning/10 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-xs'>
            <Info className='text-warning-strong size-4 shrink-0' />
            <span className='text-pretty'>{t('notice')}</span>
            {/* Hình S10: link nằm SÁT MÉP PHẢI của dải lưu ý và LUÔN gạch chân,
                không phải chỉ gạch khi rê chuột. */}
            <Link href={ROUTES.PLANS} className='text-primary ml-auto font-medium underline underline-offset-4'>
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
 * Đo trên Hình S10 (ảnh gốc 800px, phần nội dung form x=50…748 = 699px):
 * - khung stepper x=128…661 → rộng 534px = **76.4% bề ngang nội dung**, canh
 *   giữa (tâm khung 394.5 so với tâm nội dung 399);
 * - cao 33px = 6.2% bề ngang khung;
 * - lề trong: trái 70px (13.1%), phải 64px (12%);
 * - VÒNG TRÒN VÀ NHÃN NẰM CẠNH NHAU trên một hàng, không phải vòng tròn trên
 *   nhãn dưới như bản trước: nấc 1 chiếm x=198…299, đường nối 312…509, nấc 2
 *   524…597. Đường nối dày 2px, đi qua tâm hai vòng (y=129) và ăn hết chỗ trống
 *   ở giữa — đó là lý do hai nấc KHÔNG chia đều bề ngang.
 *
 * Nấc đang đứng: vòng tròn xanh đặc, số trắng, nhãn đậm. Nấc chưa tới: vòng
 * tròn viền xám, số xám, nhãn xám. Nấc đã qua đổi số thành dấu tích.
 */
export function BriefSteps({ current }: { current: 1 | 2 }) {
  const t = useTranslations('contractors.brief.steps')
  const steps = [t('one'), t('two')]

  return (
    <ol className='bg-card mx-auto flex w-[76.4%] min-w-0 items-center rounded-2xl border py-3 pr-[12%] pl-[13.1%]'>
      {steps.map((label, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        return (
          <li key={label} className='contents'>
            {/* Đường nối ăn hết chỗ trống giữa hai nấc. */}
            {index > 0 ? <span aria-hidden className='bg-border mx-[2.4%] h-0.5 flex-1 rounded-full' /> : null}

            <span className='flex min-w-0 shrink-0 items-center gap-2'>
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  done || active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground border'
                )}
              >
                {done ? <Check className='size-4' strokeWidth={3} /> : step}
              </span>
              <span
                className={cn(
                  'truncate text-sm',
                  active ? 'text-foreground font-semibold' : done ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
