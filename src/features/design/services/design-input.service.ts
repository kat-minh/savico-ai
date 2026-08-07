import { DEFAULT_PACKAGE_TIER, FIELDS_BY_BUILDING_TYPE, STYLES_BY_BUILDING_TYPE } from '../constants/design.constants'
import type { BuildingType, DesignInput, DesignStyle } from '../types/design.types'

/**
 * Frozen empty Bước 1 state — gói Tiêu chuẩn được chọn sẵn (mục III.2, trường 6).
 *
 * Exported as a stable reference so Zustand selectors can fall back to it
 * without returning a fresh object on every render (which would re-render forever).
 */
export const EMPTY_DESIGN_INPUT: Readonly<DesignInput> = Object.freeze({
  landPhotoUrl: null,
  address: '',
  addressDetail: Object.freeze({
    street: '',
    wardCode: null,
    wardName: '',
    provinceCode: null,
    provinceName: ''
  }),
  buildingType: null,
  floorCount: null,
  hasAttic: null,
  packageTier: DEFAULT_PACKAGE_TIER,
  style: null,
  wishes: ''
})

/** Mutable copy of {@link EMPTY_DESIGN_INPUT} for stores that write into it. */
export function emptyDesignInput(): DesignInput {
  return { ...EMPTY_DESIGN_INPUT, addressDetail: { ...EMPTY_DESIGN_INPUT.addressDetail } }
}

/** Ghép các phần địa chỉ thành chuỗi gửi lên API: "đường, xã/phường, tỉnh/TP". */
export function composeAddress(detail: DesignInput['addressDetail']): string {
  return [detail.street.trim(), detail.wardName, detail.provinceName].filter(Boolean).join(', ')
}

/** Which conditional fields the chosen building type shows (Phụ lục A). */
export function visibleFields(buildingType: BuildingType | null) {
  if (!buildingType) return { floorCount: false, attic: false }
  return FIELDS_BY_BUILDING_TYPE[buildingType]
}

/** Danh mục phong cách của loại công trình đang chọn (Phụ lục A, bảng cuối). */
export function stylesFor(buildingType: BuildingType | null): readonly DesignStyle[] {
  return buildingType ? STYLES_BY_BUILDING_TYPE[buildingType] : []
}

/**
 * Đổi loại công trình giữa chừng: trường không còn áp dụng bị ẩn VÀ xóa giá trị,
 * các trường còn lại giữ nguyên (mục III.2, ghi chú).
 */
export function applyBuildingTypeChange(input: DesignInput, buildingType: BuildingType): DesignInput {
  const fields = FIELDS_BY_BUILDING_TYPE[buildingType]
  // Danh mục phong cách đổi theo loại; phong cách cũ không còn trong danh mục
  // mới thì bỏ chọn, nếu không thẻ đang chọn sẽ biến mất mà state vẫn giữ.
  const styles = STYLES_BY_BUILDING_TYPE[buildingType]
  return {
    ...input,
    buildingType,
    floorCount: fields.floorCount ? input.floorCount : null,
    hasAttic: fields.attic ? input.hasAttic : null,
    style: input.style && styles.includes(input.style) ? input.style : null
  }
}

/** Field keys the submit button waits on, in the order they appear on screen. */
export type RequiredInputField = 'landPhotoUrl' | 'address' | 'buildingType' | 'floorCount' | 'hasAttic' | 'packageTier' | 'style' // prettier-ignore

/**
 * Trường bắt buộc còn thiếu, theo thứ tự hiển thị — bấm nút khi thiếu sẽ cuộn
 * tới trường đầu tiên trong danh sách này (mục III.2 + mục VI).
 */
export function missingRequiredFields(input: DesignInput): RequiredInputField[] {
  const fields = visibleFields(input.buildingType)
  const missing: RequiredInputField[] = []

  if (!input.landPhotoUrl) missing.push('landPhotoUrl')
  if (!input.address.trim()) missing.push('address')
  if (!input.buildingType) missing.push('buildingType')
  if (fields.floorCount && !input.floorCount) missing.push('floorCount')
  if (fields.attic && input.hasAttic === null) missing.push('hasAttic')
  if (!input.style) missing.push('style')

  return missing
}

/** Nút "Nhận dự toán ngay" chỉ kích hoạt khi đã nhập đủ (mục VI). */
export function canSubmitDesignInput(input: DesignInput): boolean {
  return missingRequiredFields(input).length === 0
}
