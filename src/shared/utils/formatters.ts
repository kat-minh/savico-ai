import type { Locale } from '@/i18n/routing'

/**
 * Locale-aware formatting helpers built on the native Intl API.
 * Pass the active locale (from `useLocale()`) so output matches the UI.
 */

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, options).format(date)
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function formatCurrency(value: number, locale: Locale, currency = 'VND'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2
  }).format(value)
}

/**
 * Ngày ngắn dạng `dd/MM` (thêm năm khi cần) — định dạng bản mô tả dùng ở mọi
 * lịch trình và chip nhắc lịch.
 *
 * KHÔNG dùng `Intl` cho dạng này: `vi-VN` trả về "23-09" (gạch nối) còn bản mô
 * tả viết "23/09", và hai kiểu này từng đứng cạnh nhau trong cùng một màn.
 */
export function formatDayMonth(
  value: Date | string | number,
  options: { year?: boolean; time?: boolean } = {}
): string {
  const date = value instanceof Date ? value : new Date(value)
  const pad = (input: number) => String(input).padStart(2, '0')

  const base = options.year
    ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`

  return options.time ? `${base} ${pad(date.getHours())}:${pad(date.getMinutes())}` : base
}

/**
 * Giá dạng gọn `399.000đ` — cách viết trong bản mô tả (thẻ gói S01, S19).
 *
 * `Intl` tiếng Việt trả về "399.000 ₫" (có khoảng trắng và ký hiệu ₫), còn bản
 * mô tả viết liền chữ "đ". Chỉ dùng cho GIÁ HIỂN THỊ TRÊN THẺ; hoá đơn và bảng
 * kê vẫn dùng `formatCurrency` để giữ định dạng chuẩn.
 */
export function formatPriceTag(value: number, locale: Locale): string {
  if (locale !== 'vi') return formatCurrency(value, locale)
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

/**
 * Ngân sách dạng gọn `1,85 tỷ` — cách viết trong Hình S11 (thẻ dự án cột phải).
 *
 * Chỗ đó chỉ cần độ lớn để khách liếc qua, in đủ `1.850.000.000 ₫` thì dài gấp
 * ba và đè lên nhãn. Dưới một tỷ thì rơi về `formatPriceTag` vì "0,85 tỷ" khó
 * đọc hơn "850.000.000đ".
 */
export function formatBudgetShort(value: number, locale: Locale): string {
  if (locale !== 'vi' || value < 1_000_000_000) return formatPriceTag(value, locale)
  return `${formatNumber(value / 1_000_000_000, locale, { maximumFractionDigits: 2 })} tỷ`
}

/**
 * Nhóm chữ số theo hàng nghìn cho Ô NHẬP: `1850000000` → `1.850.000.000`.
 *
 * Khác `formatCurrency`/`formatPriceTag` ở chỗ KHÔNG kèm ký hiệu tiền tệ — người
 * dùng đang gõ dở, thêm "₫" vào giữa sẽ nhảy con trỏ. Mọi ký tự không phải số bị
 * bỏ, nên dán "1.850.000.000 đ" từ chỗ khác vào vẫn ra đúng.
 */
export function formatDigitGroups(value: string, locale: Locale): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return formatNumber(Number(digits), locale)
}
