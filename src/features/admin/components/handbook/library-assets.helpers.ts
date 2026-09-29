import type { LibraryAssetKind } from '../../api/bmt/library.api'

/** Định dạng đã chốt (BR-LIB-001 khoản 2) — FE kiểm, BE chỉ kiểm URL. */
export const ASSET_EXTENSIONS: Record<LibraryAssetKind, Record<string, string>> = {
  Image: { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' },
  Attachment: { pdf: 'application/pdf', dwg: 'image/vnd.dwg', dxf: 'image/vnd.dxf' }
}

/** Tên tệp lấy từ phần cuối path của URL (rỗng nếu URL không hợp lệ). */
export function fileNameOf(url: string): string {
  try {
    const path = new URL(url).pathname
    return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1))
  } catch {
    return ''
  }
}

/** Phần mở rộng (đã hạ chữ thường) của một tên tệp. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/** Suy ra `mediaType` từ phần mở rộng của tên hiển thị hoặc của URL; không khớp → undefined. */
export function resolveMediaType(kind: LibraryAssetKind, url: string, originalName?: string): string | undefined {
  const name = originalName?.trim() || fileNameOf(url)
  return ASSET_EXTENSIONS[kind][extensionOf(name)] ?? ASSET_EXTENSIONS[kind][extensionOf(url)]
}
