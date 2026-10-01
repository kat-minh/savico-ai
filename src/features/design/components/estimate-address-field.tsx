'use client'

import { Loader2, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { FieldLabel, LocationMap } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import { mapsApi } from '../api/maps.api'
import { useEstimateAddressSearch } from '../hooks/use-address-search'
import { useEstimateLocation } from '../hooks/use-estimate-location'
import { addressWithHouseNumber } from '../services/address.logic'

interface EstimateAddressFieldProps {
  projectId: string
  /** Số nhà, đường đang nhập (trường `addressDetail` của đầu vào dự toán). */
  value: string
  onChange: (value: string) => void
  /** Tên phường/xã + tỉnh/thành đã chọn: ghép vào lúc tìm để ưu tiên kết quả đúng khu vực. */
  context: string
  invalid?: boolean
}

/**
 * Số nhà, đường của Bước 1 kèm gợi ý địa chỉ (BE `/maps/search`) và bản đồ có ghim.
 *
 * Chọn một gợi ý → tra toạ độ (`/maps/place`), điền số nhà + đường, bản đồ bay tới đó và đặt ghim. Ghim kéo được, bấm
 * lên bản đồ cũng đặt lại ghim, để chỉnh cho đúng chỗ. Gõ tay sửa địa chỉ thì ghim cũ bị bỏ (không còn đúng).
 * Danh sách gợi ý nằm trong dòng chảy (không vẽ tuyệt đối) để khỏi bị thẻ nhóm cắt mất.
 */
export function EstimateAddressField({ projectId, value, onChange, context, invalid }: EstimateAddressFieldProps) {
  const t = useTranslations('design.inputApi')
  const { location, setLocation } = useEstimateLocation(projectId)
  const [open, setOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolveFailed, setResolveFailed] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { suggestions, isSearching, failed } = useEstimateAddressSearch(value, context)

  async function pick(refId: string, name: string, display: string) {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    // Giữ số nhà khách đã gõ: gợi ý của VietMap thường chỉ có tên đường.
    onChange(addressWithHouseNumber(value, name || display))
    setOpen(false)
    setResolving(true)
    setResolveFailed(false)
    try {
      const place = await mapsApi.place(refId)
      setLocation({ latitude: place.latitude, longitude: place.longitude })
    } catch {
      setResolveFailed(true)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div id='field-addressDetail' className='space-y-2 sm:col-span-2'>
      <FieldLabel htmlFor='address-detail' hint={t('address.hint')} required>
        {t('address.label')}
      </FieldLabel>
      <div className='relative'>
        <Input
          id='address-detail'
          value={value}
          placeholder={t('address.placeholder')}
          className={cn(invalid && 'border-destructive')}
          autoComplete='off'
          onChange={(event) => {
            onChange(event.target.value)
            setLocation(null)
            setResolveFailed(false)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150)
          }}
        />
        {resolving ? (
          <Loader2 className='text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin' />
        ) : null}
      </div>

      {open && value.trim().length >= 2 ? (
        <div
          className='bg-popover overflow-hidden rounded-lg border shadow-xs'
          // Bấm xuống một dòng không được làm ô nhập mất focus: mất focus là danh sách bị gỡ trước khi click kịp tới nút.
          onMouseDown={(event) => event.preventDefault()}
        >
          {isSearching ? (
            <p className='text-muted-foreground px-3 py-2.5 text-sm'>{t('address.searching')}</p>
          ) : failed ? (
            <p className='text-muted-foreground px-3 py-2.5 text-sm'>{t('address.searchFailed')}</p>
          ) : suggestions.length ? (
            <ul className='max-h-64 overflow-y-auto'>
              {suggestions.map((item) => (
                <li key={item.refId}>
                  <button
                    type='button'
                    className='hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left transition-colors'
                    onClick={() => void pick(item.refId, item.name, item.display)}
                  >
                    <MapPin className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-medium'>{item.name || item.display}</span>
                      <span className='text-muted-foreground block truncate text-xs'>{item.address}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground px-3 py-2.5 text-sm'>{t('address.noResult')}</p>
          )}
        </div>
      ) : null}

      {resolveFailed ? <p className='text-destructive text-xs'>{t('address.resolveFailed')}</p> : null}

      {/* Chưa chọn địa chỉ cụ thể thì chưa có gì để chỉ trên bản đồ: chỉ hiện sau khi có vị trí. */}
      {location ? (
        <>
          <LocationMap
            latitude={location.latitude}
            longitude={location.longitude}
            onChange={(latitude, longitude) => setLocation({ latitude, longitude })}
          />
          <p className='text-muted-foreground text-xs'>
            {t('address.coordinates', {
              lat: location.latitude.toFixed(6),
              lng: location.longitude.toFixed(6)
            })}
          </p>
        </>
      ) : (
        <p className='text-muted-foreground text-xs'>{t('address.mapHint')}</p>
      )}
    </div>
  )
}
