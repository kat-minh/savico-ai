'use client'

import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { LAND_PHOTO_ACCEPT, LAND_PHOTO_MAX_BYTES } from '../constants/design.constants'
import type { BuildingType } from '../types/design.types'
import { FieldLabel } from './field-label'

interface LandPhotoFieldProps {
  value: string | null
  onChange: (value: string | null) => void
  /** Căn hộ đổi nhãn thành "Ảnh mặt bằng căn hộ hiện trạng" (mục III.2, trường 1). */
  buildingType: BuildingType | null
  invalid?: boolean
}

/**
 * Trường 1 — Ảnh lô đất (mục III.2).
 *
 * Chụp ảnh hoặc kéo-thả / bấm tải ảnh; preview ngay sau khi tải.
 * JPG, PNG, HEIC tối đa 10MB. Không có ô nhập kích thước — hình dạng và tỷ lệ
 * lô đất do AI tự nhận diện từ ảnh.
 */
export function LandPhotoField({ value, onChange, buildingType, invalid }: LandPhotoFieldProps) {
  const t = useTranslations('design.input.landPhoto')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isApartment = buildingType === 'apartment'
  const label = isApartment ? t('labelApartment') : t('label')
  const hint = isApartment ? t('hintApartment') : t('hint')

  function accept(file: File | undefined) {
    if (!file) return
    if (!LAND_PHOTO_ACCEPT.includes(file.type as (typeof LAND_PHOTO_ACCEPT)[number])) {
      setError(t('errorType'))
      return
    }
    if (file.size > LAND_PHOTO_MAX_BYTES) {
      setError(t('errorSize'))
      return
    }
    setError(null)
    // Data URL chứ không phải `URL.createObjectURL`: bản nháp Bước 1 được lưu
    // lại (mục III.2), mà blob URL chết ngay khi tải lại trang — mở lại nháp sẽ
    // thấy ảnh vỡ. Ảnh thật sẽ do endpoint upload trả URL khi backend sẵn sàng.
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.onerror = () => setError(t('errorType'))
    reader.readAsDataURL(file)
  }

  return (
    <div className='space-y-2'>
      <FieldLabel htmlFor='land-photo' hint={hint} required>
        {label}
      </FieldLabel>

      {value ? (
        <div className='relative overflow-hidden rounded-xl border'>
          <Image src={value} alt={label} width={800} height={600} className='h-56 w-full object-cover' unoptimized />
          <Button
            type='button'
            variant='secondary'
            size='icon'
            aria-label={t('remove')}
            onClick={() => onChange(null)}
            className='absolute top-2 right-2 rounded-full'
          >
            <X className='size-4' />
          </Button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            accept(e.dataTransfer.files[0])
          }}
          className={cn(
            'flex h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors',
            dragging && 'border-primary bg-primary/5',
            invalid ? 'border-destructive' : 'border-border hover:border-primary/50 hover:bg-muted/40'
          )}
        >
          <ImagePlus className='text-muted-foreground size-8' />
          <span className='text-sm font-medium'>{t('cta')}</span>
          <span className='text-muted-foreground text-xs'>{t('constraints')}</span>
        </button>
      )}

      <input
        ref={inputRef}
        id='land-photo'
        type='file'
        accept={LAND_PHOTO_ACCEPT.join(',')}
        capture='environment'
        className='sr-only'
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {error ? <p className='text-destructive text-sm'>{error}</p> : null}
    </div>
  )
}
