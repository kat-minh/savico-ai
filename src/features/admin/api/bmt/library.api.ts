import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'

/**
 * Thư viện mẫu bản vẽ (AdminLibrary) — cần quyền `library.manage`.
 *
 * Một MẪU (`templateId`, khóa lạc quan `templateVersion`) có nhiều PHIÊN BẢN:
 * nháp (`Draft`) và đã công bố (`Published`). Phiên bản hiện hành là bản khách
 * đang xem; bản đã bị thay thế chỉ đọc. Mỗi phiên bản có khóa lạc quan riêng
 * `editVersion`, tăng sau mỗi lần sửa metadata / tài nguyên / thứ tự / cover.
 *
 * Tài nguyên (ảnh, tệp PDF/DWG/DXF) KHÔNG upload qua API: BE chỉ nhận URL https
 * thuộc tên miền kho presign đã cấu hình, rồi gắn vào phiên bản ở một vị trí.
 */

export type DrawingKind = '2D' | '3D'
export type LibraryVersionState = 'Draft' | 'Published'
export type LibraryAssetKind = 'Image' | 'Attachment'

export interface AdminTemplateItem {
  templateId: string
  templateVersion: number
  isHidden: boolean
  createdAtUtc: string
  currentVersionId?: string | null
  currentNumber?: number | null
  currentName?: string | null
  currentPublishedAtUtc?: string | null
  draftCount: number
}

export interface AdminVersionItem {
  versionId: string
  state: LibraryVersionState
  number?: number | null
  editVersion: number
  baseVersionId?: string | null
  isCurrent: boolean
  isReadOnly: boolean
  name?: string | null
  description?: string | null
  drawingKind?: string | null
  widthM?: string | null
  lengthM?: string | null
  areaM2?: string | null
  catalogRevisionId?: string | null
  buildingTypeId?: string | null
  buildingTypeName?: string | null
  floorCount?: number | null
  hasTum?: boolean | null
  coverAssetId?: string | null
  assetCount: number
  createdAtUtc: string
  modifiedAtUtc: string
  publishedAtUtc?: string | null
}

export interface AdminTemplateVersions {
  templateId: string
  templateVersion: number
  isHidden: boolean
  currentVersionId: string | null
  versions: AdminVersionItem[]
}

export interface AdminVersionAssetItem {
  assetId: string
  kind: LibraryAssetKind
  url: string
  originalName: string
  mediaType: string
  sizeBytes?: number | null
  position: number
  isCover: boolean
}

export interface AdminVersionAssets {
  versionId: string
  state: LibraryVersionState
  editVersion: number
  isCurrent: boolean
  isReadOnly: boolean
  coverAssetId: string | null
  assets: AdminVersionAssetItem[]
}

/** Metadata của một phiên bản. Mọi trường được để trống khi lưu nháp. */
export interface TemplateContent {
  name?: string | null
  description?: string | null
  drawingKind?: DrawingKind | null
  /** Chuỗi thập phân > 0, tối đa hai chữ số lẻ. */
  widthM?: string | null
  lengthM?: string | null
  areaM2?: string | null
  buildingTypeId?: string | null
  /** Bỏ trống khi loại công trình tắt chọn tầng — không gửi 0. */
  floorCount?: number | null
  /** Bỏ trống khi loại công trình tắt chọn tum — không gửi `false`. */
  hasTum?: boolean | null
}

export interface VersionCreated {
  templateId: string
  versionId: string
  templateVersion: number
  editVersion: number
}

export interface VersionEdited {
  versionId: string
  editVersion: number
}

export interface NewAsset {
  kind: LibraryAssetKind
  url: string
  originalName: string
  mediaType: string
  sizeBytes?: number | null
}

const BASE = '/admin/library/templates'
/** Trần `pageSize` của BE. */
const MAX_PAGE = 100

const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })

export function listLibraryTemplates(pageIndex: number, pageSize: number): Promise<PagedResult<AdminTemplateItem>> {
  return http.get<PagedResult<AdminTemplateItem>>(BASE, { params: { pageIndex, pageSize } })
}

/** Toàn bộ mẫu (đi hết các trang) — danh sách quản trị không lọc được theo 2D/3D hay tên. */
export async function listAllLibraryTemplates(): Promise<AdminTemplateItem[]> {
  const all: AdminTemplateItem[] = []
  for (let page = 1; ; page++) {
    const res = await listLibraryTemplates(page, MAX_PAGE)
    all.push(...res.items)
    if (!res.hasNextPage) return all
  }
}

interface RawTemplateVersions {
  templateId?: string
  templateVersion?: number
  isHidden?: boolean
  currentVersionId?: string | null
  versions?: PagedResult<AdminVersionItem> | null
}

/** Mọi phiên bản của một mẫu (đi hết các trang), mới nhất trước. */
export async function getTemplateVersions(templateId: string): Promise<AdminTemplateVersions> {
  const versions: AdminVersionItem[] = []
  let head: RawTemplateVersions | null = null
  for (let page = 1; ; page++) {
    const res = await http.get<RawTemplateVersions>(`${BASE}/${templateId}/versions`, {
      params: { pageIndex: page, pageSize: MAX_PAGE }
    })
    head ??= res
    versions.push(...(res.versions?.items ?? []))
    if (!res.versions?.hasNextPage) break
  }
  return {
    templateId,
    templateVersion: head?.templateVersion ?? 0,
    isHidden: Boolean(head?.isHidden),
    currentVersionId: head?.currentVersionId ?? null,
    versions: versions.sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc))
  }
}

interface RawVersionAssets extends Partial<Omit<AdminVersionAssets, 'assets'>> {
  assets?: PagedResult<AdminVersionAssetItem> | null
}

/**
 * Mọi tài nguyên đã gắn của một phiên bản, theo `position`. Các trang sau gửi
 * `expectedEditVersion` của trang đầu — phiên bản bị sửa giữa chừng thì BE trả
 * 409 và màn tải lại.
 */
export async function getVersionAssets(templateId: string, versionId: string): Promise<AdminVersionAssets> {
  const assets: AdminVersionAssetItem[] = []
  let head: RawVersionAssets | null = null
  for (let page = 1; ; page++) {
    const res: RawVersionAssets = await http.get<RawVersionAssets>(
      `${BASE}/${templateId}/versions/${versionId}/assets`,
      { params: { pageIndex: page, pageSize: MAX_PAGE, expectedEditVersion: head?.editVersion } }
    )
    head ??= res
    assets.push(...(res.assets?.items ?? []))
    if (!res.assets?.hasNextPage) break
  }
  return {
    versionId,
    state: head?.state ?? 'Draft',
    editVersion: head?.editVersion ?? 0,
    isCurrent: Boolean(head?.isCurrent),
    isReadOnly: Boolean(head?.isReadOnly),
    coverAssetId: head?.coverAssetId ?? null,
    assets: assets.sort((a, b) => a.position - b.position)
  }
}

/** Tạo mẫu cùng nháp đầu tiên — mẫu chưa công khai cho tới khi công bố. */
export function createLibraryTemplate(content: TemplateContent): Promise<VersionCreated> {
  return http.post<VersionCreated>(BASE, content, idempotent())
}

/** Sao phiên bản hiện hành thành nháp mới (metadata, phân loại, tài nguyên, cover). */
export function createTemplateDraft(
  templateId: string,
  expectedTemplateVersion: number,
  baseVersionId: string
): Promise<VersionCreated> {
  return http.post<VersionCreated>(
    `${BASE}/${templateId}/drafts`,
    { expectedTemplateVersion, baseVersionId },
    idempotent()
  )
}

/** Thay toàn bộ metadata của nháp hoặc phiên bản hiện hành (giữ `versionId`). */
export function saveTemplateVersion(
  templateId: string,
  versionId: string,
  expectedEditVersion: number,
  content: TemplateContent
): Promise<VersionEdited> {
  return http.put<VersionEdited>(
    `${BASE}/${templateId}/versions/${versionId}`,
    { expectedEditVersion, ...content },
    idempotent()
  )
}

/** Chỉ xóa được nháp; bản đã công bố dùng Ẩn. */
export function deleteTemplateDraft(templateId: string, versionId: string, expectedEditVersion: number) {
  return http.delete<void>(`${BASE}/${templateId}/versions/${versionId}`, {
    params: { expectedEditVersion },
    ...idempotent()
  })
}

/** Lưu URL tệp đã upload thành tài nguyên CHƯA gắn của mẫu (không idempotent). */
export function createTemplateAsset(templateId: string, asset: NewAsset): Promise<{ assetId: string }> {
  return http.post<{ assetId: string }>(`${BASE}/${templateId}/assets`, asset)
}

/** Gắn tài nguyên vào phiên bản ở `position` (vị trí trống), tùy chọn đặt làm ảnh đại diện. */
export function attachTemplateAsset(
  templateId: string,
  versionId: string,
  assetId: string,
  body: { expectedEditVersion: number; position: number; setAsCover: boolean }
): Promise<VersionEdited> {
  return http.put<VersionEdited>(`${BASE}/${templateId}/versions/${versionId}/assets/${assetId}`, body, idempotent())
}

/** Gỡ tài nguyên khỏi phiên bản — không xóa tệp ở kho. */
export function detachTemplateAsset(
  templateId: string,
  versionId: string,
  assetId: string,
  expectedEditVersion: number
): Promise<VersionEdited> {
  return http.delete<VersionEdited>(`${BASE}/${templateId}/versions/${versionId}/assets/${assetId}`, {
    params: { expectedEditVersion },
    ...idempotent()
  })
}

export function reorderTemplateAssets(
  templateId: string,
  versionId: string,
  expectedEditVersion: number,
  items: { assetId: string; position: number }[]
): Promise<VersionEdited> {
  return http.post<VersionEdited>(
    `${BASE}/${templateId}/versions/${versionId}/reorder`,
    { expectedEditVersion, items },
    idempotent()
  )
}

export function publishTemplateVersion(
  templateId: string,
  versionId: string,
  body: { expectedTemplateVersion: number; expectedEditVersion: number; expectedCurrentVersionId: string | null }
) {
  return http.post<{ versionId: string; number: number; templateVersion: number; editVersion: number }>(
    `${BASE}/${templateId}/versions/${versionId}/publish`,
    body,
    idempotent()
  )
}

export function setTemplateVisibility(templateId: string, expectedTemplateVersion: number, isHidden: boolean) {
  return http.put<{ templateId: string; templateVersion: number; isHidden: boolean }>(
    `${BASE}/${templateId}/visibility`,
    { expectedTemplateVersion, isHidden },
    idempotent()
  )
}
