'use client'

import { LibraryTemplateManager } from './library-template-manager'

/**
 * MẪU BẢN VẼ 3D — thư viện mẫu trên BMT API (`drawingKind = 3D`). Dữ liệu cũ ở
 * kho CMS `handbookTemplates` không còn được màn này đọc / ghi.
 */
export function Template3DManager() {
  return <LibraryTemplateManager kind='3D' />
}
