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

/**
 * Thẻ ảnh của trường "Kiểu kiến trúc & phong cách" (Phụ lục A, trường 7).
 *
 * Một trường gộp nên mỗi phong cách chỉ có MỘT ảnh; Hình 04 dùng ảnh ngoại thất
 * cho nhà đất. Danh mục và ảnh sẽ do admin thay (mục X, #6) — các id dưới đây
 * là seed đã kiểm tra resolve được.
 */
export const STYLE_IMAGE = {
  /** Nhà phố / villa hiện đại — khối hộp, gỗ + kính. */
  modern: photo('photo-1600047509807-ba8f99d2cdde'),
  /** Wabi-sabi — vật liệu thô, tông ấm. */
  'wabi-sabi': photo('photo-1502672260266-1c1ef2d93688'),
  /** Tân cổ điển — phào chỉ, mái đầu hồi. */
  neoclassical: photo('photo-1592595896551-12b371d546d5'),
  /** Tối giản (Minimalism) — mặt phẳng, ít chi tiết. */
  minimal: photo('photo-1600585154340-be6161a56a0c'),
  /** Indochine — Đông Dương, gạch bông, cửa lá sách. */
  indochine: photo('photo-1616137466211-f939a420be84'),
  /** Nhà mái Thái hiện đại — mái dốc lợp ngói. */
  'thai-roof': photo('photo-1449844908441-8829872d2607'),
  /** Nhà mái Nhật hiện đại — mái dốc thấp, hiên rộng. */
  'japanese-roof': photo('photo-1580587771525-78b9dba3b914'),
  /** Nhà vườn mái Thái — dùng lại ảnh mái Thái cho tới khi có ảnh riêng. */
  'garden-thai-roof': photo('photo-1449844908441-8829872d2607'),
  /** Nhà vườn mái Nhật — dùng lại ảnh mái Nhật cho tới khi có ảnh riêng. */
  'garden-japanese-roof': photo('photo-1580587771525-78b9dba3b914'),
  /** Biệt thự / villa sân vườn. */
  'garden-villa': photo('photo-1613490493576-7fde63acd811'),
  /** Nhà cấp 4 hiện đại. */
  'level4-modern': photo('photo-1523217582562-09d0def993a6')
} as const

/** Phong cách nội thất — không gian bên trong, dùng cho cẩm nang & minh họa. */
export const INTERIOR_IMAGE = {
  modern: photo('photo-1600607687939-ce8a6c25118c'),
  minimal: photo('photo-1583847268964-b28dc8f51f92'),
  neoclassical: photo('photo-1616137466211-f939a420be84'),
  indochine: photo('photo-1502672260266-1c1ef2d93688')
} as const

/** Loại công trình — dùng cho thẻ minh họa và ảnh bìa. */
export const BUILDING_IMAGE = {
  townhouse: photo('photo-1600585154340-be6161a56a0c'),
  villa: photo('photo-1613490493576-7fde63acd811'),
  roofed: photo('photo-1449844908441-8829872d2607'),
  garden: photo('photo-1580587771525-78b9dba3b914'),
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
 * Ảnh thi công dùng cho cẩm nang và tin tức xây dựng. Mỗi id đã kiểm tra
 * resolve và xem tận mắt để chắc đúng chủ đề; admin sẽ thay bằng ảnh chụp công
 * trình SAVICO khi có CMS.
 */
export const CONSTRUCTION_IMAGE = {
  /** Sàn thép chờ đổ bê tông — phần thô, kết cấu. */
  rebar: photo('photo-1504307651254-35680f356dfd'),
  /** Thợ đấu nối điện tại công trình — hệ thống kỹ thuật. */
  electrician: photo('photo-1621905251189-08b45d6a269e'),
  /** Cao ốc đang xây kèm cần cẩu — tin tức thị trường, vật liệu. */
  crane: photo('photo-1565008447742-97f6f38c985c'),
  /** Vòi nước, thiết bị vệ sinh. */
  faucet: photo('photo-1517646287270-a5a9ca602e5c')
} as const

/** Ba giai đoạn xây nhà của cẩm nang nền tảng (Phần 3.1). */
export const STAGE_IMAGE = {
  /** Phần thô — công trường, kết cấu chưa hoàn thiện. */
  structure: CONSTRUCTION_IMAGE.rebar,
  /** Phần hoàn thiện — kỹ sư đọc bản vẽ tại công trình. */
  finishing: photo('photo-1503387762-592deb58ef4e'),
  /** Trang trí nội thất — không gian đã hoàn thiện. */
  interior: photo('photo-1600607687939-ce8a6c25118c')
} as const

/**
 * Ảnh chân dung kiến trúc sư của trang Tư vấn 1:1 (mục VIII.1, Hình 14).
 * Toàn bộ là ảnh SEED — admin tải ảnh thật của KTS lên và thay ở mục X, #5.
 */
export const PORTRAIT_IMAGE = {
  /** Nam, vest tối — KTS trưởng. */
  man1: photo('photo-1560250097-0b93528c311a', 600),
  /** Nam, chân dung sáng. */
  man2: photo('photo-1507003211169-0a1dd7228f2d', 600),
  /** Nam, đeo kính. */
  man3: photo('photo-1568602471122-7832951cc4c5', 600),
  /** Nữ, trang phục công sở. */
  woman1: photo('photo-1573496359142-b8d87734a5a2', 600),
  /** Nữ, chân dung sáng. */
  woman2: photo('photo-1580489944761-15a19d654956', 600),
  /** Nữ, chân dung ngoài trời. */
  woman3: photo('photo-1544005313-94ddf0286df2', 600)
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

/* ===========================================================================
 * SỔ ẢNH PHẲNG — nguồn cho màn "Hình ảnh site" của khu quản trị.
 * ======================================================================== */

/** Gắn tiền tố nhóm vào khóa: `modern` → `style.modern`. */
function prefixed(prefix: string, group: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(group).map(([key, url]) => [`${prefix}.${key}`, url]))
}

/** `{ modern: … }` + tiền tố `style` → `{ 'style.modern': string }`, giữ khóa hằng. */
type Prefixed<P extends string, T> = { [K in keyof T & string as `${P}.${K}`]: string }

/**
 * Mọi ảnh dùng chung của giao diện, gộp về một bảng phẳng để khu quản trị liệt
 * kê và thay từng cái.
 *
 * Ảnh nằm TRONG các bảng nội dung (mẫu, bài viết, hồ sơ KTS, thẻ phong cách) đã
 * sửa được ngay trên bảng của chúng — chỗ này chỉ gom những ảnh mà trước đây
 * phải sửa code mới đổi được.
 */
export const SITE_IMAGE = {
  ...prefixed('style', STYLE_IMAGE),
  ...prefixed('interior', INTERIOR_IMAGE),
  ...prefixed('building', BUILDING_IMAGE),
  ...prefixed('topic', TOPIC_IMAGE),
  ...prefixed('construction', CONSTRUCTION_IMAGE),
  ...prefixed('stage', STAGE_IMAGE),
  ...prefixed('portrait', PORTRAIT_IMAGE),
  ...prefixed('render', RENDER_IMAGE)
} as Prefixed<'style', typeof STYLE_IMAGE> &
  Prefixed<'interior', typeof INTERIOR_IMAGE> &
  Prefixed<'building', typeof BUILDING_IMAGE> &
  Prefixed<'topic', typeof TOPIC_IMAGE> &
  Prefixed<'construction', typeof CONSTRUCTION_IMAGE> &
  Prefixed<'stage', typeof STAGE_IMAGE> &
  Prefixed<'portrait', typeof PORTRAIT_IMAGE> &
  Prefixed<'render', typeof RENDER_IMAGE>

export type SiteImageKey = keyof typeof SITE_IMAGE
