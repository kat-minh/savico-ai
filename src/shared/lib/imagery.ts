/**
 * Semantic image registry.
 *
 * Every photo is picked to MATCH what it illustrates — a pitched-roof house for
 * "Nhà mái", a neoclassical living room for "Tân cổ điển" — rather than pulled
 * from a random pool. Swap the URLs for CMS assets when admin uploads the real
 * catalogue (mục VI: dữ liệu tĩnh do admin biên soạn); the keys stay the same.
 *
 * Remote photos are royalty-free (Unsplash) and every id below was verified to
 * resolve. Local renders under `/images` ship with the app.
 */

const UNSPLASH = 'https://images.unsplash.com/'

/** Build a sized Unsplash URL. */
const photo = (id: string, width = 900) => `${UNSPLASH}${id}?w=${width}&q=80&auto=format&fit=crop`

/** Kiểu kiến trúc — mặt ngoài công trình (mục III.2, trường 7). */
export const ARCHITECTURE_IMAGE = {
  /** Nhà mái Thái / Nhật / ngói truyền thống — mái dốc, lợp ngói. */
  roofed: photo('photo-1449844908441-8829872d2607'),
  /** Nhà phố hiện đại — khối hộp, vật liệu gỗ + kính. */
  'modern-townhouse': photo('photo-1600047509807-ba8f99d2cdde'),
  /** Nhà tân cổ điển — gạch, mái đầu hồi, chi tiết cổ điển. */
  neoclassical: photo('photo-1592595896551-12b371d546d5')
} as const

/** Phong cách nội thất — không gian bên trong (mục III.2, trường 8). */
export const INTERIOR_IMAGE = {
  modern: photo('photo-1600607687939-ce8a6c25118c'),
  minimal: photo('photo-1583847268964-b28dc8f51f92'),
  neoclassical: photo('photo-1616137466211-f939a420be84'),
  indochine: photo('photo-1502672260266-1c1ef2d93688')
} as const

/** Loại công trình — dùng cho thẻ minh họa và ảnh bìa. */
export const BUILDING_IMAGE = {
  house: photo('photo-1580587771525-78b9dba3b914'),
  townhouse: photo('photo-1600585154340-be6161a56a0c'),
  apartment: photo('photo-1522708323590-d24dbb6b0267')
} as const

/** Ảnh chủ đề dùng chung cho cẩm nang, hướng dẫn và hồ sơ. */
export const TOPIC_IMAGE = {
  /** Công trường / lô đất — minh họa bước chụp ảnh lô đất. */
  site: photo('photo-1541888946425-d81bb19240f5'),
  /** Kiến trúc sư đang đọc bản vẽ — minh họa nhập liệu, hồ sơ, dự toán. */
  blueprint: photo('photo-1503387762-592deb58ef4e'),
  /** Bếp mở — mẫu nội thất. */
  kitchen: photo('photo-1484154218962-a197022b5858'),
  /** Phòng khách sáng, thoáng — mẫu bố trí. */
  livingRoom: photo('photo-1600566753086-00f18fb6b3ea'),
  /** Phòng khách ấm, nhiều cây — mẫu bố trí. */
  warmLiving: photo('photo-1616486338812-3dadae4b4ace'),
  /** Phòng khách nhiều tranh — bài viết ngân sách nội thất. */
  gallery: photo('photo-1600210492486-724fe5c67fb0')
} as const

/**
 * Phối cảnh 3D mẫu — model kiến trúc trắng, ảnh dựng sẵn trong `/public`.
 * Dùng ở khung minh họa trang chủ và thẻ xem trước hồ sơ.
 */
export const RENDER_IMAGE = {
  villa: '/images/villa-light.png',
  townhouse: '/images/townhouse-light.png',
  apartment: '/images/appartment-light.png'
} as const
