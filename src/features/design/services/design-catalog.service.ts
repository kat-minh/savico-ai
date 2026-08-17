import type { CmsBuildingTypeOption, CmsStyleOption } from '@/shared/cms'

import { BUILDING_TYPES, DESIGN_STYLES, STYLES_BY_BUILDING_TYPE } from '../constants/design.constants'
import type { BuildingType, DesignStyle } from '../types/design.types'

/**
 * Danh mục Bước 1 lấy từ kho nội dung (mục X, #6: admin cấu hình loại công
 * trình và phong cách).
 *
 * Hai quy tắc của lớp này:
 *
 *  1. **Chỉ nhận id đã biết.** `BuildingType` / `DesignStyle` là union chuỗi cố
 *     định vì còn kéo theo trường điều kiện (`FIELDS_BY_BUILDING_TYPE`), ảnh
 *     minh họa và khóa dịch. Admin bịa thêm id lạ thì bỏ qua chứ không làm vỡ
 *     luồng — thêm loại mới vẫn phải khai báo trong `design.constants`.
 *  2. **Rỗng thì rơi về hằng số.** Admin tắt hết (hoặc kho chưa có gì) vẫn phải
 *     chọn được, nên danh sách rỗng sẽ dùng bảng mặc định theo Phụ lục A.
 *
 * Nhãn để `undefined` khi admin chưa soạn — lớp hook ghép với bản dịch i18n qua
 * `cmsText`, giống cách trang chủ làm.
 */

export interface CatalogBuildingType {
  value: BuildingType
  label?: string
}

export interface CatalogStyle {
  value: DesignStyle
  label?: string
  imageUrl?: string
}

function isBuildingType(id: string): id is BuildingType {
  return (BUILDING_TYPES as readonly string[]).includes(id)
}

function isDesignStyle(id: string): id is DesignStyle {
  return (DESIGN_STYLES as readonly string[]).includes(id)
}

/** Loại công trình hiện trong ô chọn, theo thứ tự admin xếp. */
export function catalogBuildingTypes(options: readonly CmsBuildingTypeOption[]): readonly CatalogBuildingType[] {
  const fromCms = options
    .filter((option) => option.enabled)
    .sort((a, b) => a.order - b.order)
    .flatMap<CatalogBuildingType>((option) =>
      isBuildingType(option.id) ? [{ value: option.id, label: option.label }] : []
    )

  return fromCms.length > 0 ? fromCms : BUILDING_TYPES.map((value) => ({ value }))
}

/** Thẻ phong cách của loại công trình đang chọn (Phụ lục A, bảng cuối). */
export function catalogStyles(
  options: readonly CmsStyleOption[],
  buildingType: BuildingType | null
): readonly CatalogStyle[] {
  if (!buildingType) return []

  const fromCms = options
    .filter((option) => option.enabled && option.buildingTypeIds.includes(buildingType))
    .sort((a, b) => a.order - b.order)
    .flatMap<CatalogStyle>((option) =>
      isDesignStyle(option.id) ? [{ value: option.id, label: option.label, imageUrl: option.imageUrl }] : []
    )

  return fromCms.length > 0 ? fromCms : STYLES_BY_BUILDING_TYPE[buildingType].map((value) => ({ value }))
}
