'use client'

import { LibraryTemplateManager } from './library-template-manager'

/**
 * MẪU BẢN VẼ 2D — thư viện mẫu trên BMT API (`drawingKind = 2D`). Dữ liệu cũ ở
 * kho CMS `handbookTemplates` không còn được màn này đọc / ghi.
 */
export function Template2DManager() {
  return <LibraryTemplateManager kind='2D' />
}
