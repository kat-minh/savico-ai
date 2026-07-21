import { mockDelay } from '@/shared/lib/mock'
import { ARCHITECTURE_IMAGE, BUILDING_IMAGE, INTERIOR_IMAGE, TOPIC_IMAGE } from '@/shared/lib/imagery'
import type { HandbookArticle, HandbookTemplate } from '../types/handbook.types'

/**
 * Seed catalogue for the in-browser mock. The real data is static content the
 * admin authors in the CMS, tagged per mục VI. Each photo is picked to match
 * what the item actually shows (see `shared/lib/imagery.ts`).
 */
const TEMPLATES: HandbookTemplate[] = [
  {
    id: 'tpl-01',
    name: 'Nhà phố 3 tầng mặt tiền 5m',
    imageUrl: TOPIC_IMAGE.livingRoom,
    styleLabel: 'Hiện đại',
    kind: 'layout',
    tags: {
      buildingType: 'townhouse',
      floorCount: 'ground+2',
      hasAttic: false,
      architectureStyle: 'modern-townhouse',
      interiorStyle: 'modern'
    }
  },
  {
    id: 'tpl-02',
    name: 'Nhà mái Thái 1 trệt 1 lầu',
    imageUrl: TOPIC_IMAGE.warmLiving,
    styleLabel: 'Tối giản',
    kind: 'layout',
    tags: {
      buildingType: 'house',
      floorCount: 'ground+1',
      hasAttic: true,
      architectureStyle: 'roofed',
      interiorStyle: 'minimal'
    }
  },
  {
    id: 'tpl-03',
    name: 'Căn hộ 2 phòng ngủ 68m²',
    imageUrl: BUILDING_IMAGE.apartment,
    styleLabel: 'Indochine',
    kind: 'layout',
    tags: { buildingType: 'apartment', interiorStyle: 'indochine' }
  },
  {
    id: 'tpl-04',
    name: 'Phòng khách tân cổ điển',
    imageUrl: INTERIOR_IMAGE.neoclassical,
    styleLabel: 'Tân cổ điển',
    kind: 'interior',
    tags: { interiorStyle: 'neoclassical' }
  },
  {
    id: 'tpl-05',
    name: 'Bếp mở liên thông phòng ăn',
    imageUrl: TOPIC_IMAGE.kitchen,
    styleLabel: 'Hiện đại',
    kind: 'interior',
    tags: { interiorStyle: 'modern' }
  },
  {
    id: 'tpl-06',
    name: 'Phòng khách tối giản gam ấm',
    imageUrl: INTERIOR_IMAGE.minimal,
    styleLabel: 'Tối giản',
    kind: 'interior',
    tags: { interiorStyle: 'minimal' }
  },
  {
    id: 'tpl-07',
    name: 'Không gian Indochine nhiều cây xanh',
    imageUrl: INTERIOR_IMAGE.indochine,
    styleLabel: 'Indochine',
    kind: 'interior',
    tags: { interiorStyle: 'indochine' }
  },
  {
    id: 'tpl-08',
    name: 'Biệt thự hiện đại 2 tầng có hồ bơi',
    imageUrl: BUILDING_IMAGE.house,
    styleLabel: 'Hiện đại',
    kind: 'layout',
    tags: {
      buildingType: 'house',
      floorCount: 'ground+1',
      hasAttic: false,
      architectureStyle: 'modern-townhouse',
      interiorStyle: 'modern'
    }
  },
  {
    id: 'tpl-09',
    name: 'Nhà mái ngói truyền thống sân vườn',
    imageUrl: ARCHITECTURE_IMAGE.roofed,
    styleLabel: 'Tân cổ điển',
    kind: 'layout',
    tags: {
      buildingType: 'house',
      floorCount: 'ground',
      hasAttic: false,
      architectureStyle: 'roofed',
      interiorStyle: 'neoclassical'
    }
  }
]

const ARTICLES: HandbookArticle[] = [
  {
    id: 'art-01',
    title: 'Chọn kiểu mái phù hợp khí hậu miền Nam',
    excerpt: 'So sánh mái Thái, mái Nhật và mái bằng về chi phí, khả năng thoát nước và tuổi thọ.',
    imageUrl: ARCHITECTURE_IMAGE.roofed,
    topic: 'architecture',
    tags: { architectureStyle: 'roofed' }
  },
  {
    id: 'art-02',
    title: 'Nhà phố mặt tiền hẹp: lấy sáng và thông gió',
    excerpt: 'Giếng trời, ô thông tầng và cách bố trí cầu thang để căn nhà không bí.',
    imageUrl: ARCHITECTURE_IMAGE['modern-townhouse'],
    topic: 'architecture',
    tags: { buildingType: 'townhouse' }
  },
  {
    id: 'art-03',
    title: 'Ngân sách nội thất nên chia thế nào',
    excerpt: 'Tỷ lệ hợp lý giữa nội thất gỗ cố định, đồ rời và chiếu sáng trang trí.',
    imageUrl: TOPIC_IMAGE.gallery,
    topic: 'interior',
    tags: {}
  },
  {
    id: 'art-04',
    title: 'Tân cổ điển: giữ nét sang mà không rườm rà',
    excerpt: 'Phào chỉ, màu sơn và đồ gỗ — ba thứ quyết định căn phòng tân cổ điển đạt hay hỏng.',
    imageUrl: INTERIOR_IMAGE.neoclassical,
    topic: 'interior',
    tags: { interiorStyle: 'neoclassical' }
  }
]

export const mockHandbookApi = {
  listTemplates: async (): Promise<HandbookTemplate[]> => {
    await mockDelay(250)
    return TEMPLATES
  },

  listArticles: async (topic?: string): Promise<HandbookArticle[]> => {
    await mockDelay(250)
    return topic ? ARTICLES.filter((article) => article.topic === topic) : ARTICLES
  }
}
