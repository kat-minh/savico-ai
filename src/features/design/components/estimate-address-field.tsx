'use client'

import { Loader2, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { FieldLabel, LocationMap } from '@/shared/components/common'
import { geocodeApi } from '@/shared/geocode'
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
  /** Địa chỉ "phường/xã, tỉnh/thành" của vị trí vừa chọn / kéo ghim tới: form đổi ô tỉnh và phường theo đó. */
  onRegion?: (address: string) => void
  invalid?: boolean
}

/**
 * Số nhà, đường của Bước 1 kèm gợi ý địa chỉ (BE `/maps/search`) và bản đồ có ghim.
 *
 * Chọn một gợi ý → tra toạ độ (`/maps/place`), điền số nhà + đường, bản đồ bay tới đó và đặt ghim. Ghim kéo được, bấm
 * lên bản đồ cũng đặt lại ghim, để chỉnh cho đúng chỗ. Gõ tay sửa địa chỉ thì ghim cũ bị bỏ (không còn đúng).
 * Danh sách gợi ý nằm trong dòng chảy (không vẽ tuyệt đối) để khỏi bị thẻ nhóm cắt mất.
 */
export function EstimateAddressField({
  projectId,
  value,
  onChange,
  context,
  onRegion,
  invalid
}: EstimateAddressFieldProps) {
  const t = useTranslations('design.inputApi')
  const { location, setLocation } = useEstimateLocation(projectId)
  const [open, setOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolveFailed, setResolveFailed] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Chỉ tìm gợi ý khi danh sách đang mở (đang gõ): ô đổi chữ do kéo ghim thì không tốn thêm một lượt tìm.
  const { suggestions, isSearching, failed } = useEstimateAddressSearch(open ? value : '', context)
  // Chỉ kết quả của lần kéo MỚI NHẤT được ghi vào ô: kéo liên tiếp thì các câu trả lời về sau vẫn có thể đến trước.
  const reverseSeq = useRef(0)

  /** Ghim được kéo / bấm lên bản đồ: đổi vị trí rồi đổi ô số nhà, đường theo địa chỉ tại ghim. */
  async function movePin(latitude: number, longitude: number) {
    setLocation({ latitude, longitude })
    const seq = ++reverseSeq.current
    try {
      const found = await geocodeApi.reverse(latitude, longitude)
      // Không có địa chỉ quanh ghim thì giữ nguyên chữ đang có thay vì xoá trắng.
      if (seq === reverseSeq.current && found) {
        if (found.name) onChange(found.name)
        if (found.address) onRegion?.(found.address)
      }
    } catch {
      // Tra địa chỉ lỗi: ghim vẫn đúng chỗ khách chỉ, chỉ là ô chữ không đổi theo.
    }
  }

  async function pick(refId: string, name: string, display: string, region: string) {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    // Giữ số nhà khách đã gõ: gợi ý của VietMap thường chỉ có tên đường.
    onChange(addressWithHouseNumber(value, name || display))
    onRegion?.(region)
    reverseSeq.current++
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
                    onClick={() => void pick(item.refId, item.name, item.display, item.address)}
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
            onChange={(latitude, longitude) => void movePin(latitude, longitude)}
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
