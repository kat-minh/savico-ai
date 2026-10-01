/**
 * Đầu vào Bước 1 của bản dự toán THẬT — logic thuần, bám đúng DTO của BE (TDD-PROJ-001):
 * `PUT /estimates/{id}/input` nhận ĐỦ mọi trường (null = chưa nhập) cùng `changedFields` là các trường vừa sửa.
 * Mọi chỗ ở đây không biết React hay HTTP nên kiểm được bằng `node --experimental-strip-types`.
 */

/** id dự toán thật là UUID; id mock có dạng `SVC-YYYY-NNNN`. */
export const isApiEstimateId = (id: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)

/** Mã dự án hiển thị cho khách: dự toán thật dùng 8 ký tự đầu của UUID (UUID đầy đủ quá dài cho tiêu đề), mock giữ nguyên. */
export const displayProjectId = (id: string): string => (isApiEstimateId(id) ? id.slice(0, 8).toUpperCase() : id)

export type FinishPackage = 'Basic' | 'Standard' | 'Vip'

/** Mặc định giống bản mock: gói giữa. */
export const DEFAULT_FINISH_PACKAGE: FinishPackage = 'Standard'

/** Mô tả tối đa 500 ký tự (BR-PROJ-002), tính theo ký tự Unicode (rune), không phải UTF-16. */
export const DESCRIPTION_MAX_LENGTH = 500

/** `input` của BE — giữ nguyên tên trường. */
export interface EstimateInputBody {
  buildingTypeId: string | null
  areaM2: string | null
  description: string | null
  provinceCode: string | null
  wardCode: string | null
  locationDatasetVersion: string | null
  addressDetail: string | null
  finishPackage: FinishPackage | null
  floorCount: number | null
  hasTum: boolean | null
  architectureStyleId: string | null
  interiorStyleId: string | null
  inputImageUrl: string | null
}

export type InputField = keyof EstimateInputBody

/** Thứ tự cố định để so sánh và gửi. */
export const INPUT_FIELDS: readonly InputField[] = [
  'buildingTypeId',
  'areaM2',
  'description',
  'provinceCode',
  'wardCode',
  'locationDatasetVersion',
  'addressDetail',
  'finishPackage',
  'floorCount',
  'hasTum',
  'architectureStyleId',
  'interiorStyleId',
  'inputImageUrl'
]

/** Bản đang nhập trong form: chuỗi cho ô gõ (rỗng = chưa nhập), còn lại như DTO. */
export interface EstimateInputDraft {
  buildingTypeId: string | null
  areaM2: string
  description: string
  provinceCode: string | null
  wardCode: string | null
  locationDatasetVersion: string | null
  addressDetail: string
  finishPackage: FinishPackage | null
  floorCount: number | null
  hasTum: boolean | null
  architectureStyleId: string | null
  interiorStyleId: string | null
  inputImageUrl: string | null
}

/* ===========================================================================
 * Danh mục (snapshot ghim lúc tạo bản)
 * ======================================================================== */

export interface CatalogBuildingType {
  buildingTypeId: string
  name: string
  floorsEnabled: boolean
  tumEnabled: boolean
  architectureEnabled: boolean
  interiorEnabled: boolean
  floorCounts: number[]
  architectureStyleIds: string[]
  interiorStyleIds: string[]
}

export interface CatalogStyle {
  styleId: string
  name: string
  imageUrl?: string
}

export interface EstimateCatalog {
  catalogRevisionId: string | null
  buildingTypes: CatalogBuildingType[]
  architectureStyles: CatalogStyle[]
  interiorStyles: CatalogStyle[]
}

const arr = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

/** Đọc phòng thủ: BE có thể bỏ trường rỗng. */
export function normalizeCatalog(raw: Partial<EstimateCatalog> | null | undefined): EstimateCatalog {
  return {
    catalogRevisionId: raw?.catalogRevisionId ?? null,
    buildingTypes: arr(raw?.buildingTypes).map((type) => ({
      ...type,
      floorCounts: [...arr(type.floorCounts)].sort((a, b) => a - b),
      architectureStyleIds: arr(type.architectureStyleIds),
      interiorStyleIds: arr(type.interiorStyleIds)
    })),
    architectureStyles: arr(raw?.architectureStyles),
    interiorStyles: arr(raw?.interiorStyles)
  }
}

export function selectedType(catalog: EstimateCatalog | undefined, draft: EstimateInputDraft) {
  return catalog?.buildingTypes.find((type) => type.buildingTypeId === draft.buildingTypeId)
}

/** Trường nào của form hiện theo loại công trình đang chọn. */
export function visibleFields(type: CatalogBuildingType | undefined) {
  return {
    floors: Boolean(type?.floorsEnabled),
    tum: Boolean(type?.tumEnabled),
    architecture: Boolean(type?.architectureEnabled),
    interior: Boolean(type?.interiorEnabled)
  }
}

/**
 * Chọn loại công trình: bỏ những giá trị không còn hợp lệ với loại mới (số tầng ngoài danh sách, tum khi tắt,
 * phong cách ngoài danh sách / nhóm tắt). BE yêu cầu nhóm tắt luôn lưu NULL, nên phải xoá thay vì để lại.
 */
export function applyBuildingType(
  draft: EstimateInputDraft,
  catalog: EstimateCatalog,
  buildingTypeId: string
): EstimateInputDraft {
  const type = catalog.buildingTypes.find((item) => item.buildingTypeId === buildingTypeId)
  if (!type) return { ...draft, buildingTypeId }
  return {
    ...draft,
    buildingTypeId,
    floorCount:
      type.floorsEnabled && draft.floorCount !== null && type.floorCounts.includes(draft.floorCount)
        ? draft.floorCount
        : null,
    hasTum: type.tumEnabled ? draft.hasTum : null,
    architectureStyleId:
      type.architectureEnabled &&
      draft.architectureStyleId &&
      type.architectureStyleIds.includes(draft.architectureStyleId)
        ? draft.architectureStyleId
        : null,
    interiorStyleId:
      type.interiorEnabled && draft.interiorStyleId && type.interiorStyleIds.includes(draft.interiorStyleId)
        ? draft.interiorStyleId
        : null
  }
}

/** Phong cách chọn được theo loại công trình (nhóm tắt → rỗng). */
export function stylesFor(
  catalog: EstimateCatalog | undefined,
  type: CatalogBuildingType | undefined,
  group: 'architecture' | 'interior'
): CatalogStyle[] {
  if (!catalog || !type) return []
  if (group === 'architecture') {
    if (!type.architectureEnabled) return []
    return catalog.architectureStyles.filter((style) => type.architectureStyleIds.includes(style.styleId))
  }
  if (!type.interiorEnabled) return []
  return catalog.interiorStyles.filter((style) => type.interiorStyleIds.includes(style.styleId))
}

/* ===========================================================================
 * Chuyển đổi API ⇄ form
 * ======================================================================== */

const text = (value: string | null | undefined): string => value ?? ''

/** `input` BE → bản đang nhập. `finishPackage` null (chưa chọn) lấy mặc định để thanh trượt có giá trị. */
export function draftFromInput(input: Partial<EstimateInputBody> | null | undefined): EstimateInputDraft {
  return {
    buildingTypeId: input?.buildingTypeId ?? null,
    areaM2: text(input?.areaM2),
    description: text(input?.description),
    provinceCode: input?.provinceCode ?? null,
    wardCode: input?.wardCode ?? null,
    locationDatasetVersion: input?.locationDatasetVersion ?? null,
    addressDetail: text(input?.addressDetail),
    finishPackage: input?.finishPackage ?? DEFAULT_FINISH_PACKAGE,
    floorCount: input?.floorCount ?? null,
    hasTum: input?.hasTum ?? null,
    architectureStyleId: input?.architectureStyleId ?? null,
    interiorStyleId: input?.interiorStyleId ?? null,
    inputImageUrl: input?.inputImageUrl ?? null
  }
}

const blankToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim())

/** Bản đang nhập → `input` gửi BE (đủ mọi trường, rỗng = null). Mô tả giữ nội dung gốc, chỉ khoảng trắng thì null. */
export function inputBody(draft: EstimateInputDraft): EstimateInputBody {
  return {
    buildingTypeId: draft.buildingTypeId,
    areaM2: blankToNull(draft.areaM2),
    description: draft.description.trim() === '' ? null : draft.description,
    provinceCode: draft.provinceCode,
    wardCode: draft.wardCode,
    locationDatasetVersion: draft.locationDatasetVersion,
    addressDetail: blankToNull(draft.addressDetail),
    finishPackage: draft.finishPackage,
    floorCount: draft.floorCount,
    hasTum: draft.hasTum,
    architectureStyleId: draft.architectureStyleId,
    interiorStyleId: draft.interiorStyleId,
    inputImageUrl: draft.inputImageUrl
  }
}

/**
 * Chuẩn hoá `input` do BE trả về để so với bản đang nhập. KHÔNG áp mặc định (`finishPackage` null vẫn là null):
 * trường ngoài `changedFields` phải khớp đúng bản đã lưu, nên mặc định của form phải hiện là "đã đổi".
 */
export function normalizeSaved(input: Partial<EstimateInputBody> | null | undefined): EstimateInputBody {
  const blank = (value: string | null | undefined): string | null =>
    value === null || value === undefined || value.trim() === '' ? null : value
  return {
    buildingTypeId: input?.buildingTypeId ?? null,
    areaM2: blank(input?.areaM2),
    description: blank(input?.description),
    provinceCode: input?.provinceCode ?? null,
    wardCode: input?.wardCode ?? null,
    locationDatasetVersion: input?.locationDatasetVersion ?? null,
    addressDetail: blank(input?.addressDetail),
    finishPackage: input?.finishPackage ?? null,
    floorCount: input?.floorCount ?? null,
    hasTum: input?.hasTum ?? null,
    architectureStyleId: input?.architectureStyleId ?? null,
    interiorStyleId: input?.interiorStyleId ?? null,
    inputImageUrl: input?.inputImageUrl ?? null
  }
}

/** Trường nào khác bản đã lưu — chính là `changedFields` (trường ngoài danh sách phải khớp bản đã lưu). */
export function changedFields(saved: EstimateInputBody, draft: EstimateInputDraft): InputField[] {
  const next = inputBody(draft)
  return INPUT_FIELDS.filter((field) => !sameValue(field, saved[field], next[field]))
}

function sameValue(field: InputField, a: unknown, b: unknown): boolean {
  if (field === 'areaM2') return numberText(a) === numberText(b)
  return a === b
}

/** "70", "70.0", "70.00" cùng một giá trị; chuỗi hỏng giữ nguyên để so sánh theo chữ. */
function numberText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = String(value)
  return AREA_PATTERN.test(s) ? String(Number(s)) : s
}

/* ===========================================================================
 * Kiểm hợp lệ phía khách (BE vẫn kiểm lại)
 * ======================================================================== */

/** >0, tối đa 2 chữ số lẻ, tối đa 26 chữ số nguyên, không dấu / mũ (BR-PROJ-001 khoản 6). */
const AREA_PATTERN = /^\d{1,26}(\.\d{1,2})?$/

export function areaProblem(value: string): 'format' | null {
  const s = value.trim()
  if (s === '') return null
  return AREA_PATTERN.test(s) && Number(s) > 0 ? null : 'format'
}

/** Độ dài mô tả tính theo ký tự Unicode (rune) như BE. */
export function descriptionLength(value: string): number {
  return [...value].length
}

/**
 * Trường còn thiếu trước khi gửi AI (BR-PROJ-001/002): ảnh HOẶC mô tả (một trong hai là đủ), diện tích, loại công
 * trình, địa chỉ (tỉnh + xã + số nhà/đường), gói, và các trường mà loại công trình đang chọn bật (số tầng, tum, mỗi nhóm phong
 * cách). BE trả danh sách chính thức trong `missingFields`; hàm này chỉ để tô đỏ ngay khi nhập.
 */
export function missingFields(draft: EstimateInputDraft, catalog: EstimateCatalog | undefined): string[] {
  const missing: string[] = []
  if (!draft.inputImageUrl && draft.description.trim() === '') missing.push('imageOrDescription')
  if (draft.areaM2.trim() === '' || areaProblem(draft.areaM2)) missing.push('areaM2')
  if (!draft.buildingTypeId) missing.push('buildingTypeId')
  if (!draft.provinceCode) missing.push('provinceCode')
  if (!draft.wardCode) missing.push('wardCode')
  if (draft.addressDetail.trim() === '') missing.push('addressDetail')
  if (!draft.finishPackage) missing.push('finishPackage')

  const type = selectedType(catalog, draft)
  const fields = visibleFields(type)
  if (fields.floors && draft.floorCount === null) missing.push('floorCount')
  if (fields.tum && draft.hasTum === null) missing.push('hasTum')
  if (fields.architecture && !draft.architectureStyleId) missing.push('architectureStyleId')
  if (fields.interior && !draft.interiorStyleId) missing.push('interiorStyleId')
  return missing
}
