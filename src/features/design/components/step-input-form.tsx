'use client'

import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { ARCHITECTURE_IMAGE, INTERIOR_IMAGE } from '@/shared/lib/imagery'
import { cn } from '@/shared/lib/utils'
import {
  ARCHITECTURE_STYLES,
  BUILDING_TYPES,
  FLOOR_COUNTS,
  INTERIOR_STYLES,
  WISHES_MAX_LENGTH
} from '../constants/design.constants'
import {
  composeAddress,
  EMPTY_DESIGN_INPUT,
  missingRequiredFields,
  visibleFields,
  type RequiredInputField
} from '../services/design-input.service'
import { useSaveInput } from '../hooks/use-save-input'
import { useDesignStore } from '../store/design.store'
import type { BuildingType, InteriorStyle } from '../types/design.types'
import { AddressField } from './address-field'
import { ChoiceCards, type ChoiceOption } from './choice-cards'
import { FieldLabel } from './field-label'
import { LandPhotoField } from './land-photo-field'
import { PackageSlider } from './package-slider'

interface StepInputFormProps {
  projectId: string
  onSubmit: () => void
}

/**
 * Bước 1 — Nhập liệu (mục III.2).
 *
 * MỘT màn hình, MỘT form duy nhất (không chia chế độ nhập nhanh / chi tiết).
 * Cột trái: ảnh lô đất → địa chỉ → loại công trình → khối trường phụ thuộc.
 * Cột phải "Thông tin bổ sung": chỉ hiện sau khi chọn loại công trình.
 * Không có ô nhập kích thước lô đất — AI tự nhận diện từ ảnh.
 */
export function StepInputForm({ projectId, onSubmit }: StepInputFormProps) {
  const t = useTranslations('design.input')
  const draft = useDesignStore((s) => s.drafts[projectId] ?? EMPTY_DESIGN_INPUT)
  const patchDraft = useDesignStore((s) => s.patchDraft)
  const setBuildingType = useDesignStore((s) => s.setBuildingType)
  const saveInput = useSaveInput(projectId)

  // Chỉ hiện viền đỏ sau lần bấm nút đầu tiên, không nhắc lỗi khi đang gõ.
  const [showErrors, setShowErrors] = useState(false)
  const missing = useMemo(() => missingRequiredFields(draft), [draft])
  const fields = visibleFields(draft.buildingType)
  const canSubmit = missing.length === 0
  const invalid = (field: RequiredInputField) => showErrors && missing.includes(field)

  const buildingTypeOptions = BUILDING_TYPES.map((value) => ({ value, label: t(`buildingType.options.${value}`) }))
  const floorOptions: ChoiceOption[] = FLOOR_COUNTS.map((value) => ({
    value,
    label: t(`floorCount.options.${value}`)
  }))
  const atticOptions: ChoiceOption[] = [
    { value: 'yes', label: t('attic.options.yes') },
    { value: 'no', label: t('attic.options.no') }
  ]
  // Thẻ ảnh chọn nhanh — ảnh khớp đúng kiểu kiến trúc / phong cách nó minh họa.
  const architectureOptions: ChoiceOption[] = ARCHITECTURE_STYLES.map((value) => ({
    value,
    label: t(`architectureStyle.options.${value}`),
    imageUrl: ARCHITECTURE_IMAGE[value]
  }))
  const interiorOptions: ChoiceOption[] = INTERIOR_STYLES.map((value) => ({
    value,
    label: t(`interiorStyle.options.${value}`),
    imageUrl: INTERIOR_IMAGE[value]
  }))

  function handleSubmit() {
    if (!canSubmit) {
      setShowErrors(true)
      // Bấm khi thiếu → cuộn tới trường còn thiếu đầu tiên kèm viền đỏ nhắc.
      const first = missing[0]
      if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // Ghi chính thức dữ liệu Bước 1 lên server rồi mới sang màn chờ — hồ sơ và
    // link chia sẻ lấy địa chỉ từ đây, không phải từ bản nháp phía client.
    saveInput.mutate(draft, { onSuccess: () => onSubmit() })
  }

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-8 lg:px-8'>
      <div className='grid gap-8 lg:grid-cols-2'>
        {/* ── Cột TRÁI ─────────────────────────────────────────────── */}
        <div className='space-y-6'>
          <div id='field-landPhotoUrl'>
            <LandPhotoField
              value={draft.landPhotoUrl}
              onChange={(landPhotoUrl) => patchDraft(projectId, { landPhotoUrl })}
              buildingType={draft.buildingType}
              invalid={invalid('landPhotoUrl')}
            />
          </div>

          <div id='field-address'>
            <AddressField
              value={draft.addressDetail}
              invalid={invalid('address')}
              onChange={(addressDetail) =>
                // `address` là chuỗi đã ghép gửi lên API; `addressDetail` giữ
                // lựa chọn để mở lại bản nháp vẫn đúng.
                patchDraft(projectId, { addressDetail, address: composeAddress(addressDetail) })
              }
            />
          </div>

          <div id='field-buildingType' className='space-y-2'>
            <FieldLabel htmlFor='building-type' hint={t('buildingType.hint')} required>
              {t('buildingType.label')}
            </FieldLabel>
            {/* Chuỗi rỗng, không phải `undefined`: `undefined` khiến Radix coi
                đây là select không kiểm soát rồi cảnh báo khi có giá trị. */}
            <Select
              value={draft.buildingType ?? ''}
              onValueChange={(value) => setBuildingType(projectId, value as BuildingType)}
            >
              <SelectTrigger
                id='building-type'
                className={cn('w-full', invalid('buildingType') && 'border-destructive')}
              >
                <SelectValue placeholder={t('buildingType.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {buildingTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Khối trường hiện sau khi chọn loại công trình. */}
          {draft.buildingType ? (
            <div className='space-y-6 border-t pt-6'>
              {fields.floorCount ? (
                <div id='field-floorCount' className='space-y-2'>
                  <FieldLabel hint={t('floorCount.hint')} required>
                    {t('floorCount.label')}
                  </FieldLabel>
                  <ChoiceCards
                    compact
                    options={floorOptions}
                    value={draft.floorCount}
                    onChange={(value) => patchDraft(projectId, { floorCount: value as typeof draft.floorCount })}
                    invalid={invalid('floorCount')}
                  />
                </div>
              ) : null}

              {fields.attic ? (
                <div id='field-hasAttic' className='space-y-2'>
                  <FieldLabel hint={t('attic.hint')} required>
                    {t('attic.label')}
                  </FieldLabel>
                  <ChoiceCards
                    compact
                    options={atticOptions}
                    value={draft.hasAttic === null ? null : draft.hasAttic ? 'yes' : 'no'}
                    onChange={(value) => patchDraft(projectId, { hasAttic: value === 'yes' })}
                    invalid={invalid('hasAttic')}
                  />
                </div>
              ) : null}

              <PackageSlider
                value={draft.packageTier}
                onChange={(packageTier) => patchDraft(projectId, { packageTier })}
              />
            </div>
          ) : null}
        </div>

        {/* ── Cột PHẢI — Thông tin bổ sung ─────────────────────────── */}
        <div className='space-y-6'>
          <h2 className='text-lg font-semibold'>{t('extra.title')}</h2>

          {!draft.buildingType ? (
            <div className='text-muted-foreground flex min-h-64 items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm'>
              {t('extra.empty')}
            </div>
          ) : (
            <>
              {fields.architectureStyle ? (
                <div id='field-architectureStyle' className='space-y-2'>
                  <FieldLabel hint={t('architectureStyle.hint')} required>
                    {t('architectureStyle.label')}
                  </FieldLabel>
                  <ChoiceCards
                    options={architectureOptions}
                    value={draft.architectureStyle}
                    onChange={(value) =>
                      patchDraft(projectId, { architectureStyle: value as typeof draft.architectureStyle })
                    }
                    invalid={invalid('architectureStyle')}
                  />
                </div>
              ) : null}

              <div id='field-interiorStyle' className='space-y-2'>
                <FieldLabel hint={t('interiorStyle.hint')} required>
                  {t('interiorStyle.label')}
                </FieldLabel>
                <ChoiceCards
                  options={interiorOptions}
                  value={draft.interiorStyle}
                  onChange={(value) => patchDraft(projectId, { interiorStyle: value as InteriorStyle })}
                  invalid={invalid('interiorStyle')}
                />
              </div>

              <div className='space-y-2'>
                <FieldLabel htmlFor='wishes' hint={t('wishes.hint')}>
                  {t('wishes.label')}
                </FieldLabel>
                <Textarea
                  id='wishes'
                  rows={5}
                  maxLength={WISHES_MAX_LENGTH}
                  value={draft.wishes}
                  placeholder={t('wishes.placeholder')}
                  onChange={(e) => patchDraft(projectId, { wishes: e.target.value })}
                />
                <p className='text-muted-foreground text-right text-xs'>
                  {draft.wishes.length}/{WISHES_MAX_LENGTH}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nút lớn, full-width dưới đáy màn hình. */}
      <div className='mt-10'>
        <Button
          size='lg'
          onClick={handleSubmit}
          aria-disabled={!canSubmit}
          disabled={saveInput.isPending}
          className={cn('w-full', !canSubmit && 'opacity-50')}
        >
          {saveInput.isPending ? <Loader2 className='size-4 animate-spin' /> : null}
          {t('submit')}
        </Button>
      </div>
    </div>
  )
}
