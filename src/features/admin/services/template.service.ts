import type { HandbookTemplate } from '@/shared/cms'

/**
 * Quy tắc của thư viện mẫu 2D / 3D — thuần, không React, không HTTP.
 */

/** "5" hoặc "4,5" — số đo viết theo dấu phẩy thập phân của tiếng Việt. */
export function formatMeters(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
}

/** Tag số tầng dùng chung với Bước 1: `ground`, `ground+1`, `ground+2`. */
export function floorCountTag(levels: number): string {
  return levels <= 1 ? 'ground' : `ground+${levels - 1}`
}

export type TemplateProblem = 'name' | 'type' | 'lot' | 'images' | 'style'

/**
 * Lý do mẫu CHƯA được chuyển Active (2DTemplateManagement §5) — `null` khi đủ dữ
 * liệu hợp lệ. Mẫu 2D: đủ ảnh đúng số tầng, kích thước lô và diện tích > 0.
 * Mẫu 3D: có phong cách nội thất và ít nhất một ảnh.
 */
export function templateProblem(template: HandbookTemplate): TemplateProblem | null {
  if (!template.name.trim()) return 'name'
  if (template.kind === '3d') {
    if (!template.interiorStyleId) return 'style'
    return template.floors.some((floor) => floor.imageUrl) ? null : 'images'
  }
  if (!template.buildingTypeId) return 'type'
  if (!(template.lotWidth && template.lotLength && template.area)) return 'lot'
  const count = template.floorCount ?? 0
  const floors = template.floors.slice(0, count)
  return count >= 1 && floors.length === count && floors.every((floor) => floor.imageUrl) ? null : 'images'
}
