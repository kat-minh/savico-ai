'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import { FieldLabel } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { acceptAttribute, checkFile, uploadImage } from '@/shared/media'
import { designKeys } from '../api/design.keys'
import { estimateInputApi } from '../api/estimate-input.api'
import { useEstimateInput, type SaveStatus } from '../hooks/use-estimate-input'
import {
  areaProblem,
  DESCRIPTION_MAX_LENGTH,
  descriptionLength,
  selectedType,
  stylesFor,
  visibleFields
} from '../services/estimate-input.logic'
import { ChoiceCards, type ChoiceOption } from './choice-cards'

const MISSING_FIELD_KEYS = [
  'imageOrDescription',
  'areaM2',
  'buildingTypeId',
  'provinceCode',
  'wardCode',
  'finishPackage',
  'floorCount',
  'hasTum',
  'architectureStyleId',
  'interiorStyleId',
  'addressDetail'
] as const
type MissingFieldKey = (typeof MISSING_FIELD_KEYS)[number]

interface StepInputApiFormProps {
  projectId: string
  onSubmit: () => void
}

function GroupHeading({ index, children }: { index: number; children: ReactNode }) {
  return (
    <h2 className='text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.1em] uppercase'>
      {index} · {children}
    </h2>
  )
}

/** Dòng trạng thái tự lưu: chỉ báo "Đã lưu" sau khi BE xác nhận (BR-PROJ-003 khoản 8). */
function SaveIndicator({
  status,
  message,
  onRetry
}: {
  status: SaveStatus
  message: string | null
  onRetry: () => void
}) {
  const t = useTranslations('design.inputApi.status')
  if (status === 'idle') return null
  if (status === 'error' || status === 'denied') {
    return (
      <p className='text-destructive flex flex-wrap items-center justify-center gap-2 text-xs' role='status'>
        <AlertCircle className='size-3.5' />
        {status === 'denied' ? (message ?? t('denied')) : t('error')}
        {status === 'error' ? (
          <button type='button' onClick={onRetry} className='inline-flex items-center gap-1 font-medium underline'>
            <RefreshCw className='size-3' />
            {t('retry')}
          </button>
        ) : null}
      </p>
    )
  }
  return (
    <p className='text-muted-foreground flex items-center justify-center gap-1.5 text-xs' role='status'>
      {status === 'saved' ? null : <Loader2 className='size-3 animate-spin' />}
      {status === 'saved' ? t('saved') : status === 'saving' ? t('saving') : t('pending')}
    </p>
  )
}

/**
 * Bước 1 — Nhập liệu, nối BMT API (TDD-PROJ-001). Các trường bám đúng DTO của BE: ảnh HOẶC mô tả, tỉnh/xã + địa chỉ,
 * loại công trình (danh mục ghim của bản), diện tích, số tầng, tum, gói hoàn thiện và phong cách (theo loại công
 * trình đang chọn). Tự lưu sau mỗi lần sửa; nút "Nhận dự toán ngay" lưu nốt rồi mới sang bước sau.
 */
export function StepInputApiForm({ projectId, onSubmit }: StepInputApiFormProps) {
  const t = useTranslations('design.inputApi')
  const tInput = useTranslations('design.input')
  const input = useEstimateInput(projectId)
  const { draft, catalog, provinces, wards, missing } = input
  const quota = useQuery({
    queryKey: [...designKeys.quota(), 'api'],
    queryFn: () => estimateInputApi.getDesignQuota(),
    staleTime: 0
  })

  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (input.detail.isError || catalog.isError) {
    return (
      <div className='mx-auto w-full max-w-2xl px-4 py-5 lg:py-12 text-center'>
        <p className='text-muted-foreground mb-4 text-sm'>{t('loadError')}</p>
        <Button
          variant='outline'
          onClick={() => {
            void input.detail.refetch()
            void catalog.refetch()
          }}
        >
          {t('reload')}
        </Button>
      </div>
    )
  }

  if (!draft || !catalog.data || input.detail.isPending) {
    return (
      <div className='text-muted-foreground flex min-h-64 items-center justify-center'>
        <Loader2 className='size-5 animate-spin' />
      </div>
    )
  }

  const type = selectedType(catalog.data, draft)
  const fields = visibleFields(type)
  const lockReason = input.lock
  const locked = lockReason !== null
  const invalid = (field: string) => showErrors && missing.includes(field)
  const areaError = draft.areaM2 !== '' && areaProblem(draft.areaM2) !== null

  const floorOptions: ChoiceOption[] = (type?.floorCounts ?? []).map((count) => ({
    value: String(count),
    label: t('floorCount.option', { count })
  }))
  const styleOptions = (group: 'architecture' | 'interior'): ChoiceOption[] =>
    stylesFor(catalog.data, type, group).map((style) => ({
      value: style.styleId,
      label: style.name,
      imageUrl: style.imageUrl
    }))

  async function pickImage(file: File | undefined) {
    if (!file) return
    const problem = checkFile(file)
    if (problem) {
      toast.error(problem === 'UnsupportedType' ? t('image.errorType') : t('image.errorSize'))
      return
    }
    setUploading(true)
    try {
      // Ảnh cũ giữ nguyên cho tới khi ảnh mới tải xong (BR-PROJ-002 khoản 8): chỉ ghi vào form sau khi thành công.
      const uploaded = await uploadImage(file)
      input.patch({ inputImageUrl: uploaded.url })
    } catch {
      toast.error(t('image.errorUpload'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSubmit() {
    setShowErrors(true)
    setSubmitting(true)
    try {
      const saved = await input.flush()
      if (!saved) return
      // BE là nguồn chính thức về trường còn thiếu.
      const fresh = await input.detail.refetch()
      const serverMissing = fresh.data?.missingFields ?? []
      if (missing.length > 0 || serverMissing.length > 0) {
        const first = missing[0] ?? serverMissing[0]
        if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        toast.error(t('missing.title'))
        return
      }
      onSubmit()
    } finally {
      setSubmitting(false)
    }
  }

  // Tên trường còn thiếu cho người dùng; tên BE trả mà chưa có nhãn thì hiện nguyên.
  const missingLabels = missing.map((field) =>
    (MISSING_FIELD_KEYS as readonly string[]).includes(field) ? t(`missing.fields.${field as MissingFieldKey}`) : field
  )
  const outOfQuota = quota.data
    ? quota.data.hasSubscription && !quota.data.unlimited && (quota.data.available ?? 0) <= 0
    : false

  return (
    <div className='mx-auto w-full max-w-[90rem] px-4 pt-2 pb-5 lg:pb-6 lg:px-8 lg:pt-6'>
      {locked ? (
        <div
          role='alert'
          className='border-warning/40 bg-warning/10 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm'
        >
          <p className='min-w-0 flex-1 text-pretty'>{t(`lock.${lockReason}`)}</p>
          {lockReason === 'noEdit' ? (
            <Button asChild size='sm'>
              <Link href={ROUTES.PLANS}>{t('lock.plans')}</Link>
            </Button>
          ) : (
            <Button size='sm' onClick={onSubmit}>
              {t('lock.next')}
            </Button>
          )}
        </div>
      ) : null}

      <fieldset disabled={locked} className='m-0 min-w-0 border-0 p-0'>
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]'>
          <div className='bg-card space-y-7 rounded-2xl border p-5'>
            <section>
              <GroupHeading index={1}>{t('groups.media')}</GroupHeading>
              <div className='grid gap-5 md:grid-cols-2'>
                <div id='field-imageOrDescription' className='space-y-1.5'>
                  <FieldLabel hint={t('image.hint')}>{t('image.label')}</FieldLabel>
                  {draft.inputImageUrl ? (
                    <div className='group relative h-56 overflow-hidden rounded-xl border'>
                      <Image
                        src={draft.inputImageUrl}
                        alt={t('image.label')}
                        width={800}
                        height={600}
                        className='h-56 w-full object-cover'
                        unoptimized
                      />
                      <Button
                        type='button'
                        variant='secondary'
                        size='icon'
                        aria-label={t('image.remove')}
                        onClick={() => input.patch({ inputImageUrl: null })}
                        className='absolute top-2 right-2 rounded-full'
                      >
                        <X className='size-4' />
                      </Button>
                      {uploading ? (
                        <span className='bg-background/70 absolute inset-0 flex items-center justify-center'>
                          <Loader2 className='size-5 animate-spin' />
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        'text-muted-foreground hover:bg-muted/50 flex h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors',
                        invalid('imageOrDescription') && 'border-destructive'
                      )}
                    >
                      {uploading ? <Loader2 className='size-6 animate-spin' /> : <ImagePlus className='size-6' />}
                      {uploading ? t('image.uploading') : t('image.upload')}
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type='file'
                    accept={acceptAttribute()}
                    className='hidden'
                    onChange={(event) => void pickImage(event.target.files?.[0])}
                  />
                  {draft.inputImageUrl ? (
                    <Button type='button' variant='outline' size='sm' onClick={() => fileRef.current?.click()}>
                      {t('image.replace')}
                    </Button>
                  ) : null}
                  <p className='text-muted-foreground text-xs'>{t('image.hint')}</p>
                </div>

                <div className='space-y-2'>
                  <FieldLabel htmlFor='description' hint={t('description.hint')}>
                    {t('description.label')}
                  </FieldLabel>
                  <Textarea
                    id='description'
                    rows={7}
                    value={draft.description}
                    placeholder={t('description.placeholder')}
                    onChange={(event) => {
                      // Giới hạn theo ký tự Unicode như BE (đếm rune, không đếm UTF-16).
                      const next = [...event.target.value].slice(0, DESCRIPTION_MAX_LENGTH).join('')
                      input.patch({ description: next })
                    }}
                  />
                  <p className='text-muted-foreground text-right text-xs'>
                    {descriptionLength(draft.description)}/{DESCRIPTION_MAX_LENGTH}
                  </p>
                </div>
              </div>
            </section>

            <section className='space-y-4'>
              <GroupHeading index={2}>{t('groups.location')}</GroupHeading>
              <div className='grid gap-4 md:grid-cols-2'>
                <div id='field-provinceCode' className='space-y-2'>
                  <FieldLabel htmlFor='province' hint={t('province.hint')} required>
                    {t('province.label')}
                  </FieldLabel>
                  <Select value={draft.provinceCode ?? ''} onValueChange={input.chooseProvince}>
                    <SelectTrigger
                      id='province'
                      className={cn('w-full', invalid('provinceCode') && 'border-destructive')}
                    >
                      <SelectValue placeholder={provinces.isPending ? t('loading') : t('province.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(provinces.data?.provinces ?? []).map((province) => (
                        <SelectItem key={province.code} value={province.code}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {provinces.isError ? (
                    <p className='text-destructive text-xs'>
                      {t('province.loadError')}{' '}
                      <button type='button' className='font-medium underline' onClick={() => void provinces.refetch()}>
                        {t('reload')}
                      </button>
                    </p>
                  ) : null}
                </div>

                <div id='field-wardCode' className='space-y-2'>
                  <FieldLabel htmlFor='ward' hint={t('ward.hint')} required>
                    {t('ward.label')}
                  </FieldLabel>
                  <Select value={draft.wardCode ?? ''} onValueChange={input.chooseWard} disabled={!draft.provinceCode}>
                    <SelectTrigger id='ward' className={cn('w-full', invalid('wardCode') && 'border-destructive')}>
                      <SelectValue
                        placeholder={
                          !draft.provinceCode
                            ? t('ward.needProvince')
                            : wards.isPending
                              ? t('loading')
                              : t('ward.placeholder')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(wards.data ?? []).map((ward) => (
                        <SelectItem key={ward.code} value={ward.code}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div id='field-addressDetail' className='space-y-2'>
                <FieldLabel htmlFor='address-detail' hint={t('address.hint')} required>
                  {t('address.label')}
                </FieldLabel>
                <Input
                  id='address-detail'
                  value={draft.addressDetail}
                  placeholder={t('address.placeholder')}
                  className={cn(invalid('addressDetail') && 'border-destructive')}
                  onChange={(event) => input.patch({ addressDetail: event.target.value })}
                />
              </div>
            </section>

            <section className='space-y-5'>
              <GroupHeading index={3}>{t('groups.scope')}</GroupHeading>

              <div id='field-buildingTypeId' className='space-y-2'>
                <FieldLabel htmlFor='building-type' hint={tInput('buildingType.hint')} required>
                  {t('buildingType.label')}
                </FieldLabel>
                <Select value={draft.buildingTypeId ?? ''} onValueChange={input.chooseBuildingType}>
                  <SelectTrigger
                    id='building-type'
                    className={cn('w-full', invalid('buildingTypeId') && 'border-destructive')}
                  >
                    <SelectValue placeholder={t('buildingType.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.data.buildingTypes.map((option) => (
                      <SelectItem key={option.buildingTypeId} value={option.buildingTypeId}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div id='field-areaM2' className='space-y-2'>
                <FieldLabel htmlFor='area' hint={t('area.hint')} required>
                  {t('area.label')}
                </FieldLabel>
                <div className='relative max-w-xs'>
                  <Input
                    id='area'
                    inputMode='decimal'
                    value={draft.areaM2}
                    placeholder={t('area.placeholder')}
                    aria-invalid={areaError || invalid('areaM2')}
                    className={cn('pr-10', (areaError || invalid('areaM2')) && 'border-destructive')}
                    onChange={(event) => input.patch({ areaM2: event.target.value.replace(',', '.') })}
                  />
                  <span className='text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm'>
                    {t('area.unit')}
                  </span>
                </div>
                {areaError ? <p className='text-destructive text-xs'>{t('area.invalid')}</p> : null}
              </div>

              {fields.floors || fields.tum ? (
                <div className='flex flex-wrap items-start gap-x-6 gap-y-4'>
                  {fields.floors ? (
                    <div id='field-floorCount' className='space-y-2'>
                      <FieldLabel hint={tInput('floorCount.hint')} required>
                        {t('floorCount.label')}
                      </FieldLabel>
                      <ChoiceCards
                        compact
                        options={floorOptions}
                        value={draft.floorCount === null ? null : String(draft.floorCount)}
                        onChange={(value) => input.patch({ floorCount: Number(value) })}
                        invalid={invalid('floorCount')}
                      />
                    </div>
                  ) : null}
                  {fields.tum ? (
                    <div id='field-hasTum' className='space-y-2'>
                      <FieldLabel hint={tInput('attic.hint')} required>
                        {t('tum.label')}
                      </FieldLabel>
                      <ChoiceCards
                        compact
                        options={[
                          { value: 'yes', label: t('tum.yes') },
                          { value: 'no', label: t('tum.no') }
                        ]}
                        value={draft.hasTum === null ? null : draft.hasTum ? 'yes' : 'no'}
                        onChange={(value) => input.patch({ hasTum: value === 'yes' })}
                        invalid={invalid('hasTum')}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          {/* Thông tin bổ sung tách làm HAI thẻ: kiểu kiến trúc và phong cách nội thất (mỗi nhóm bật/tắt riêng theo loại công trình). */}
          <div className='space-y-5 lg:self-start'>
            {!type ? (
              <aside className='bg-card h-fit rounded-2xl border p-5'>
                <h2 className='mb-4 font-semibold'>{t('extra.title')}</h2>
                <div className='text-muted-foreground flex min-h-64 items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm'>
                  {t('extra.empty')}
                </div>
              </aside>
            ) : !fields.architecture && !fields.interior ? (
              <aside className='bg-card h-fit rounded-2xl border p-5'>
                <h2 className='mb-4 font-semibold'>{t('extra.title')}</h2>
                <p className='text-muted-foreground text-sm'>{t('extra.none')}</p>
              </aside>
            ) : null}

            {fields.architecture ? (
              <aside id='field-architectureStyleId' className='bg-card h-fit space-y-3 rounded-2xl border p-5'>
                <h2 className='font-semibold'>{t('style.architecture')}</h2>
                <FieldLabel hint={tInput('style.hint')} required>
                  {t('style.architectureHint')}
                </FieldLabel>
                <ChoiceCards
                  className='grid-cols-2 sm:grid-cols-2'
                  options={styleOptions('architecture')}
                  value={draft.architectureStyleId}
                  onChange={(value) => input.patch({ architectureStyleId: value })}
                  invalid={invalid('architectureStyleId')}
                />
              </aside>
            ) : null}

            {fields.interior ? (
              <aside id='field-interiorStyleId' className='bg-card h-fit space-y-3 rounded-2xl border p-5'>
                <h2 className='font-semibold'>{t('style.interior')}</h2>
                <FieldLabel hint={tInput('style.hint')} required>
                  {t('style.interiorHint')}
                </FieldLabel>
                <ChoiceCards
                  className='grid-cols-2 sm:grid-cols-2'
                  options={styleOptions('interior')}
                  value={draft.interiorStyleId}
                  onChange={(value) => input.patch({ interiorStyleId: value })}
                  invalid={invalid('interiorStyleId')}
                />
              </aside>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className='mt-6 space-y-2'>
        {showErrors && missingLabels.length > 0 ? (
          <p className='text-destructive text-center text-xs'>
            {t('missing.title')}: {missingLabels.join(', ')}
          </p>
        ) : null}
        <SaveIndicator status={input.status} message={input.errorMessage} onRetry={() => void input.retry()} />
        {quota.data ? (
          <p className='text-muted-foreground text-center text-xs'>
            {!quota.data.hasSubscription
              ? t('quota.none')
              : quota.data.unlimited
                ? t('quota.unlimited')
                : t('quota.plan', { remaining: quota.data.available ?? 0, total: quota.data.limit ?? 0 })}
          </p>
        ) : null}

        {outOfQuota ? (
          <Button asChild size='lg' className='w-full'>
            <Link href={ROUTES.PLANS}>{tInput('quota.upgrade')}</Link>
          </Button>
        ) : (
          <Button
            size='lg'
            className='w-full'
            onClick={() => void handleSubmit()}
            disabled={submitting || uploading || locked}
          >
            {submitting ? <Loader2 className='size-4 animate-spin' /> : null}
            {tInput('submit')}
          </Button>
        )}
      </div>
    </div>
  )
}
