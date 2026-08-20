import enMessages from '../../../messages/en.json'
import viMessages from '../../../messages/vi.json'

import type { Locale } from '@/i18n/routing'
import { isOverridableMessageKey } from './cms-messages'

/**
 * Catalog dịch GỐC của cả hai ngôn ngữ, nạp thẳng từ `messages/*.json`.
 *
 * Màn "Chuỗi giao diện" của khu quản trị cần thấy bản gốc để đặt cạnh chữ đã ghi
 * đè — và cần bản gốc của NGÔN NGỮ ĐANG BIÊN TẬP, không phải của bảng điều khiển
 * (người vận hành người Việt vẫn soạn bản tiếng Anh với giao diện tiếng Việt).
 *
 * next-intl chỉ nạp catalog của ngôn ngữ đang xem nên không dùng lại được; import
 * cả hai ở đây là chấp nhận được vì file này chỉ nằm trong bundle của `(admin)`.
 */
const CATALOG: Record<Locale, unknown> = {
  vi: viMessages,
  en: enMessages
}

/** Một chuỗi trong catalog, đã làm phẳng thành khóa `namespace.dot.case`. */
export interface MessageEntry {
  /** Khóa đầy đủ, ví dụ `handbook.page.title`. */
  key: string
  /** Chữ gốc trong `messages/{locale}.json`. */
  value: string
}

/**
 * Làm phẳng catalog thành danh sách khóa → chữ.
 *
 * Bỏ qua mảng: `legal.terms.sections` là dữ liệu có cấu trúc chứ không phải chuỗi
 * rời, và nội dung hai trang đó đã sửa được ở màn "Trang tĩnh".
 */
function flatten(node: unknown, prefix: string, out: MessageEntry[]): void {
  if (typeof node === 'string') {
    out.push({ key: prefix, value: node })
    return
  }
  if (Array.isArray(node) || typeof node !== 'object' || node === null) return

  for (const [segment, child] of Object.entries(node)) {
    flatten(child, prefix ? `${prefix}.${segment}` : segment, out)
  }
}

/**
 * Mọi chuỗi ghi đè được của một ngôn ngữ.
 *
 * `sourceOrder` giữ nguyên thứ tự trong `messages/*.json` — thứ tự người soạn
 * catalog viết ra, bám khá sát thứ tự các khối trên trang. Mặc định sắp theo
 * khóa, tiện cho bảng tra.
 */
export function messageEntriesOf(locale: Locale, options?: { sourceOrder?: boolean }): MessageEntry[] {
  const entries: MessageEntry[] = []
  flatten(CATALOG[locale], '', entries)
  const overridable = entries.filter((entry) => isOverridableMessageKey(entry.key))
  return options?.sourceOrder ? overridable : overridable.sort((a, b) => a.key.localeCompare(b.key))
}

/** Tra nhanh chữ gốc theo khóa — dùng cho màn biên tập theo trang. */
export function messageMapOf(locale: Locale): Record<string, string> {
  return Object.fromEntries(messageEntriesOf(locale).map((entry) => [entry.key, entry.value]))
}

/** Nhánh cấp một của khóa (`handbook.page.title` → `handbook`). */
export function namespaceOf(key: string): string {
  return key.split('.')[0] ?? key
}

/**
 * KHỐI trên trang mà khóa này thuộc về (`handbook.foundation.title` →
 * `handbook.foundation`).
 *
 * Hai cấp đầu của khóa dịch trùng khớp với các khối khách nhìn thấy — đó là cách
 * catalog được soạn ngay từ đầu. Khóa chỉ có hai cấp (`guide.title`) thì cả nhánh
 * là một khối.
 */
export function sectionOf(key: string): string {
  const parts = key.split('.')
  return parts.length > 2 ? `${parts[0]}.${parts[1]}` : (parts[0] ?? key)
}
