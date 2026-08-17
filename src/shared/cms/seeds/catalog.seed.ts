import { STYLE_IMAGE } from '@/shared/lib/imagery'
import type { CmsBuildingTypeOption, CmsStyleOption, CmsUnitPrice } from '../cms.types'

/**
 * Danh mục Bước 1 và bảng đơn giá dự toán — mục X, #6 ghi rõ admin cấu hình
 * được. Seed dưới đây phản chiếu `features/design/constants` để hai bên khớp
 * nhau; sửa ở trang quản trị là đổi bảng cấu hình admin đang dùng.
 */
export const BUILDING_TYPES_SEED: CmsBuildingTypeOption[] = [
  { id: 'townhouse', label: 'Nhà phố', enabled: true, order: 1 },
  { id: 'villa', label: 'Villa - Biệt thự', enabled: true, order: 2 },
  { id: 'roofed', label: 'Nhà mái', enabled: true, order: 3 },
  { id: 'garden', label: 'Nhà vườn - Nhà cấp 4', enabled: true, order: 4 },
  { id: 'apartment', label: 'Căn hộ', enabled: true, order: 5 }
]

/** Kiểu kiến trúc & phong cách, kèm loại công trình mà nó xuất hiện (Phụ lục A, trường 7). */
export const STYLE_OPTIONS_SEED: CmsStyleOption[] = [
  {
    id: 'modern',
    label: 'Hiện đại',
    imageUrl: STYLE_IMAGE.modern,
    buildingTypeIds: ['townhouse', 'villa', 'apartment'],
    enabled: true,
    order: 1
  },
  {
    id: 'wabi-sabi',
    label: 'Wabi (Wabi-sabi)',
    imageUrl: STYLE_IMAGE['wabi-sabi'],
    buildingTypeIds: ['townhouse', 'apartment'],
    enabled: true,
    order: 2
  },
  {
    id: 'neoclassical',
    label: 'Tân cổ điển',
    imageUrl: STYLE_IMAGE.neoclassical,
    buildingTypeIds: ['townhouse', 'villa'],
    enabled: true,
    order: 3
  },
  {
    id: 'minimal',
    label: 'Tối giản (Minimalism)',
    imageUrl: STYLE_IMAGE.minimal,
    buildingTypeIds: ['townhouse', 'apartment'],
    enabled: true,
    order: 4
  },
  {
    id: 'indochine',
    label: 'Indochine',
    imageUrl: STYLE_IMAGE.indochine,
    buildingTypeIds: ['townhouse'],
    enabled: true,
    order: 5
  },
  {
    id: 'thai-roof',
    label: 'Nhà mái Thái hiện đại',
    imageUrl: STYLE_IMAGE['thai-roof'],
    buildingTypeIds: ['roofed'],
    enabled: true,
    order: 6
  },
  {
    id: 'japanese-roof',
    label: 'Nhà mái Nhật hiện đại',
    imageUrl: STYLE_IMAGE['japanese-roof'],
    buildingTypeIds: ['roofed'],
    enabled: true,
    order: 7
  },
  {
    id: 'garden-thai-roof',
    label: 'Nhà vườn mái Thái',
    imageUrl: STYLE_IMAGE['garden-thai-roof'],
    buildingTypeIds: ['garden'],
    enabled: true,
    order: 8
  },
  {
    id: 'garden-japanese-roof',
    label: 'Nhà vườn mái Nhật',
    imageUrl: STYLE_IMAGE['garden-japanese-roof'],
    buildingTypeIds: ['garden'],
    enabled: true,
    order: 9
  },
  {
    id: 'garden-villa',
    label: 'Biệt thự / Villa sân vườn',
    imageUrl: STYLE_IMAGE['garden-villa'],
    buildingTypeIds: ['garden'],
    enabled: true,
    order: 10
  },
  {
    id: 'level4-modern',
    label: 'Nhà cấp 4 hiện đại',
    imageUrl: STYLE_IMAGE['level4-modern'],
    buildingTypeIds: ['garden'],
    enabled: true,
    order: 11
  }
]

/**
 * Đơn giá theo m² sàn cho ba gói hoàn thiện (mục III.2, trường 6). Con số minh
 * họa — Bên A chốt bảng chính thức, admin cập nhật không cần deploy.
 */
export const UNIT_PRICES_SEED: CmsUnitPrice[] = [
  {
    id: 'up-foundation',
    section: 'structure',
    label: 'Phần móng',
    unit: 'm² sàn',
    basic: 1_450_000,
    standard: 1_650_000,
    vip: 1_900_000
  },
  {
    id: 'up-frame',
    section: 'structure',
    label: 'Kết cấu cột - dầm - sàn',
    unit: 'm² sàn',
    basic: 2_100_000,
    standard: 2_400_000,
    vip: 2_850_000
  },
  {
    id: 'up-masonry',
    section: 'structure',
    label: 'Tường xây - tô trát',
    unit: 'm² sàn',
    basic: 680_000,
    standard: 760_000,
    vip: 880_000
  },
  {
    id: 'up-roof',
    section: 'structure',
    label: 'Mái & chống thấm',
    unit: 'm² sàn',
    basic: 420_000,
    standard: 510_000,
    vip: 640_000
  },
  {
    id: 'up-tiling',
    section: 'finishing',
    label: 'Ốp lát',
    unit: 'm² sàn',
    basic: 520_000,
    standard: 720_000,
    vip: 1_150_000
  },
  {
    id: 'up-painting',
    section: 'finishing',
    label: 'Sơn bả',
    unit: 'm² sàn',
    basic: 180_000,
    standard: 240_000,
    vip: 340_000
  },
  {
    id: 'up-doors',
    section: 'finishing',
    label: 'Cửa & vách',
    unit: 'm² sàn',
    basic: 460_000,
    standard: 680_000,
    vip: 1_050_000
  },
  {
    id: 'up-sanitary',
    section: 'finishing',
    label: 'Thiết bị vệ sinh',
    unit: 'bộ',
    basic: 8_500_000,
    standard: 14_000_000,
    vip: 26_000_000
  },
  {
    id: 'up-mep',
    section: 'finishing',
    label: 'Điện nước & chiếu sáng',
    unit: 'm² sàn',
    basic: 350_000,
    standard: 460_000,
    vip: 690_000
  },
  {
    id: 'up-joinery',
    section: 'interior',
    label: 'Đồ gỗ cố định',
    unit: 'm² sàn',
    basic: 1_200_000,
    standard: 2_100_000,
    vip: 3_800_000
  },
  {
    id: 'up-loose',
    section: 'interior',
    label: 'Đồ rời & trang trí',
    unit: 'm² sàn',
    basic: 650_000,
    standard: 1_150_000,
    vip: 2_400_000
  },
  {
    id: 'up-design',
    section: 'interior',
    label: 'Thiết kế nội thất',
    unit: 'm² sàn',
    basic: 120_000,
    standard: 180_000,
    vip: 300_000
  }
]
