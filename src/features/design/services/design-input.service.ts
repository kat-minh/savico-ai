import { DEFAULT_PACKAGE_TIER, STYLES_BY_BUILDING_TYPE } from '../constants/design.constants'
import type { BuildingType, DesignInput } from '../types/design.types'
import { buildingTypeFieldConfig, type BuildingTypeFieldConfig } from './design-catalog.service'

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

const NO_FIELDS: BuildingTypeFieldConfig = {
  floorCount: false,
  floorRequired: false,
  floorOptions: [],
  attic: false,
  atticRequired: false,
  atticFixed: null
}

/**
 * Trường điều kiện của loại công trình đang chọn — theo cấu hình Số tầng / Tum
 * admin đặt ở danh mục Loại công trình (epic ConstructionTypeManagement §7).
 */
export function visibleFields(buildingType: BuildingType | null): BuildingTypeFieldConfig {
  return buildingType ? buildingTypeFieldConfig(buildingType) : NO_FIELDS
}

/**
 * Đổi loại công trình giữa chừng: trường không còn áp dụng bị ẩn VÀ xóa giá trị,
 * các trường còn lại giữ nguyên (mục III.2, ghi chú).
 */
export function applyBuildingTypeChange(input: DesignInput, buildingType: BuildingType): DesignInput {
  const fields = buildingTypeFieldConfig(buildingType)
  // Danh mục phong cách đổi theo loại; phong cách cũ không còn trong danh mục
  // mới thì bỏ chọn, nếu không thẻ đang chọn sẽ biến mất mà state vẫn giữ.
  const styles = STYLES_BY_BUILDING_TYPE[buildingType]
  return {
    ...input,
    buildingType,
    // Không gửi giá trị không còn áp dụng: số tầng ngoài danh sách phương án mới
    // bị bỏ, Tum cố định thì lấy đúng giá trị cố định (§7).
    floorCount: input.floorCount && fields.floorOptions.includes(input.floorCount) ? input.floorCount : null,
    hasAttic: fields.atticFixed ?? (fields.attic ? input.hasAttic : null),
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
  if (fields.floorRequired && !input.floorCount) missing.push('floorCount')
  if (fields.atticRequired && input.hasAttic === null) missing.push('hasAttic')
  if (!input.style) missing.push('style')

  return missing
}

/** Nút "Nhận dự toán ngay" chỉ kích hoạt khi đã nhập đủ (mục VI). */
export function canSubmitDesignInput(input: DesignInput): boolean {
  return missingRequiredFields(input).length === 0
}
