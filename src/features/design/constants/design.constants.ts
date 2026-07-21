import type {
  ArchitectureStyle,
  BuildingType,
  CostSection,
  DesignStep,
  FloorCount,
  PackageTier
} from '../types/design.types'

/** Ảnh lô đất — JPG, PNG, HEIC tối đa 10MB (mục III.2, trường 1). */
export const LAND_PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const LAND_PHOTO_ACCEPT = ['image/jpeg', 'image/png', 'image/heic'] as const

/** Mô tả mong muốn — tối đa 500 ký tự (mục III.2, trường 9). */
export const WISHES_MAX_LENGTH = 500

export const BUILDING_TYPES: readonly BuildingType[] = ['house', 'townhouse', 'apartment'] as const

export const FLOOR_COUNTS: readonly FloorCount[] = ['ground', 'ground+1', 'ground+2', 'ground+3', 'ground+4'] as const

/** Slider 3 nấc, mặc định Tiêu chuẩn. */
export const PACKAGE_TIERS: readonly PackageTier[] = ['basic', 'standard', 'vip'] as const
export const DEFAULT_PACKAGE_TIER: PackageTier = 'standard'

export const ARCHITECTURE_STYLES: readonly ArchitectureStyle[] = ['roofed', 'modern-townhouse', 'neoclassical'] as const

/**
 * Phong cách nội thất — danh mục do admin cấu hình; giá trị dưới đây là seed
 * mặc định cho bản mock cho tới khi CMS cung cấp danh sách thật.
 *
 * Kept as a literal tuple so `design.input.interiorStyle.options.*` message
 * keys stay type-checked; widen to `string[]` only once the list comes from the
 * API and the labels move with it.
 */
export const INTERIOR_STYLES = ['modern', 'minimal', 'neoclassical', 'indochine'] as const

export const COST_SECTIONS: readonly CostSection[] = ['structure', 'finishing', 'interior'] as const

export const DESIGN_STEPS: readonly DesignStep[] = [1, 2, 3] as const

/**
 * Nút "?" của mỗi bước trỏ tới nhóm hướng dẫn nào trên trang Hướng dẫn
 * (mục II.4). Giá trị khớp `GuideTopic` nhưng khai báo dạng chuỗi vì
 * `features/design` không được import `features/guide`.
 */
export const STEP_HELP_TOPIC: Record<DesignStep, string> = {
  1: 'input',
  2: 'read-estimate',
  3: 'dossier'
}

/**
 * Trường nào áp dụng cho loại công trình nào (mục III.2, ghi chú).
 * Nhà ở và Nhà phố dùng chung bộ trường; Căn hộ ẩn Số tầng, Tum, Kiểu kiến trúc.
 */
export const FIELDS_BY_BUILDING_TYPE: Record<
  BuildingType,
  { floorCount: boolean; attic: boolean; architectureStyle: boolean }
> = {
  house: { floorCount: true, attic: true, architectureStyle: true },
  townhouse: { floorCount: true, attic: true, architectureStyle: true },
  apartment: { floorCount: false, attic: false, architectureStyle: false }
}

/** Autosave nháp Bước 1 — thoát ra vào lại vẫn còn nguyên (mục III.2). */
export const DESIGN_DRAFT_STORAGE_KEY = 'savico.design-draft'
