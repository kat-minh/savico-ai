import { useAuthStore } from '@/shared/auth'
import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'
import type { HandbookArticle, HandbookFloor, HandbookQuota, HandbookTemplate } from '../types/handbook.types'
import { mockHandbookApi } from './handbook.mock'

/**
 * Nối cụm Cẩm nang vào BMT API — GIỮ MOCK LÀM NỀN.
 *
 * DB backend đang RỖNG nên mọi hàm ở đây phải TỰ VỀ MOCK khi API trả rỗng, lỗi,
 * 404 hoặc khách chưa đăng nhập: demo không bao giờ bị trống và giao diện đã
 * chốt vẫn chạy đúng với cả dữ liệu mock cũ lẫn dữ liệu API mới.
 *
 * - Bài viết (news): list + detail CÔNG KHAI, render `contentHtml`.
 * - Thư viện mẫu: list CÔNG KHAI; chi tiết CẦN ĐĂNG NHẬP (access-info → open trừ
 *   1 lượt → library-versions + assets). Mẫu API gắn cờ `source: 'bmt'` để trang
 *   chi tiết biết dựng cổng đăng nhập và đọc chi tiết từ đây (không lấy từ pool).
 */

/* ===========================================================================
 * DTO — News (bài viết)
 * ======================================================================== */

interface BmtArticleCategory {
  id: string
  name: string
}

interface BmtArticleSummary {
  id: string
  title: string
  readingTimeMinutes?: number | null
  coverImageUrl: string
  firstPublishedAtUtc: string
  categories: BmtArticleCategory[]
}

interface BmtArticleDetail extends BmtArticleSummary {
  contentHtml: string
}

/* ===========================================================================
 * DTO — Design templates / library access / subscription
 * ======================================================================== */

interface BmtDesignTemplateSummary {
  templateId: string
  versionId: string
  number: number
  name: string
  drawingKind: '2D' | '3D'
  widthM: string
  lengthM: string
  areaM2: string
  buildingTypeId: string
  buildingTypeName?: string | null
  floorCount?: number | null
  hasTum?: boolean | null
  thumbnailUrl?: string | null
  publishedAtUtc: string
}

interface BmtLibraryAccessInfo {
  templateId?: string
  currentVersionId?: string
  number?: number
  editVersion?: number
  alreadyOpened?: boolean
  requiresConfirmation?: boolean
  canOpen?: boolean
  deniedCode?: string | null
}

interface BmtLibraryOpened {
  templateId?: string
  versionId?: string
  number?: number
  editVersion?: number
  charged?: boolean
  detailUrl?: string
}

interface BmtLibraryVersionDetail {
  templateId: string
  versionId: string
  state: 'Draft' | 'Published'
  number?: number | null
  editVersion: number
  isCurrent: boolean
  name?: string | null
  description?: string | null
  drawingKind?: string | null
  widthM?: string | null
  lengthM?: string | null
  areaM2?: string | null
  buildingTypeId?: string | null
  buildingTypeName?: string | null
  floorCount?: number | null
  hasTum?: boolean | null
  publishedAtUtc?: string | null
  coverAssetId?: string | null
  coverContentUrl?: string | null
  assetCount: number
  assetsUrl: string
}

interface BmtLibraryVersionAssetItem {
  assetId: string
  kind: 'Image' | 'Attachment'
  name: string
  mediaType: string
  sizeBytes?: number | null
  position: number
  isCover: boolean
  contentUrl: string
}

interface BmtLibraryVersionAssets {
  versionId?: string
  editVersion?: number
  coverAssetId?: string | null
  assets?: PagedResult<BmtLibraryVersionAssetItem>
}

interface BmtQuotaBalanceView {
  code: string
  label: string
  isUnlimited: boolean
  limit?: number | null
  used: number
  reserved: number
  available?: number | null
}

interface BmtDesignSubscriptionView {
  quotas?: BmtQuotaBalanceView[]
}

/* ===========================================================================
 * Helpers
 * ======================================================================== */

const isAuthenticated = () => useAuthStore.getState().isAuthenticated

/** "2 tầng", "2 tầng + tum" — nhãn quy mô gộp thông tin tum (chuỗi dữ liệu, không phải chữ UI). */
function floorLabelOf(floorCount?: number | null, hasTum?: boolean | null): string {
  if (floorCount == null) return ''
  return `${floorCount} tầng${hasTum ? ' + tum' : ''}`
}

/** Số phút đọc ước tính từ độ dài nội dung (≈200 từ/phút), tối thiểu 1. */
function readingMinutesOf(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 3
  return Math.max(1, Math.round(text.split(' ').length / 200))
}

function dimensionSpecs(width?: string | null, length?: string | null, area?: string | null) {
  const lotSize = width && length ? `${width} × ${length} m` : undefined
  const floorArea = area ? `${area} m²` : undefined
  return { lotSize, floorArea }
}

function toArticleSummary(dto: BmtArticleSummary): HandbookArticle {
  return {
    id: dto.id,
    // Route `/handbook/bai-viet/[slug]` nhận id trực tiếp làm slug.
    slug: dto.id,
    title: dto.title,
    // BE đã bỏ `summary`; type UI khách bắt buộc `excerpt` nên để chuỗi rỗng.
    excerpt: '',
    imageUrl: dto.coverImageUrl,
    category: dto.categories[0]?.name ?? '',
    publishedAt: dto.firstPublishedAtUtc,
    // Ưu tiên số phút đọc do BE trả; thiếu thì mặc định 3 (danh sách không có nội dung để ước lượng).
    readingMinutes: dto.readingTimeMinutes ?? 3,
    body: [],
    tags: {}
  }
}

function toArticleDetail(dto: BmtArticleDetail): HandbookArticle {
  return {
    ...toArticleSummary(dto),
    // Số phút đọc lấy từ BE; thiếu thì ước lượng theo độ dài nội dung.
    readingMinutes: dto.readingTimeMinutes ?? readingMinutesOf(dto.contentHtml ?? ''),
    contentHtml: dto.contentHtml,
    body: []
  }
}

function toTemplateSummary(dto: BmtDesignTemplateSummary): HandbookTemplate {
  const kind = dto.drawingKind === '3D' ? '3d' : '2d'
  const { lotSize, floorArea } = dimensionSpecs(dto.widthM, dto.lengthM, dto.areaM2)
  const buildingTypeLabel = dto.buildingTypeName ?? ''
  return {
    id: dto.templateId,
    name: dto.name,
    kind,
    imageUrl: dto.thumbnailUrl ?? undefined,
    styleLabel: buildingTypeLabel,
    specs: {
      buildingTypeLabel,
      floorLabel: floorLabelOf(dto.floorCount, dto.hasTum),
      ...(kind === '2d' ? { lotSize, floorArea } : {})
    },
    description: [],
    floors: [],
    tags: {
      buildingType: dto.buildingTypeId || undefined,
      floorCount: dto.floorCount != null ? String(dto.floorCount) : undefined,
      hasAttic: dto.hasTum ?? undefined
    },
    buildingTypeId: dto.buildingTypeId || undefined,
    floorCount: dto.floorCount ?? undefined,
    lotWidth: Number(dto.widthM) || undefined,
    lotLength: Number(dto.lengthM) || undefined,
    area: Number(dto.areaM2) || undefined,
    versionId: dto.versionId,
    source: 'bmt'
  }
}

function toTemplateDetail(detail: BmtLibraryVersionDetail, assets: BmtLibraryVersionAssetItem[]): HandbookTemplate {
  const kind = detail.drawingKind === '3D' ? '3d' : '2d'
  const { lotSize, floorArea } = dimensionSpecs(detail.widthM, detail.lengthM, detail.areaM2)
  const buildingTypeLabel = detail.buildingTypeName ?? ''
  const images = assets.filter((asset) => asset.kind === 'Image').sort((a, b) => a.position - b.position)
  const floors: HandbookFloor[] = images.map((asset, index) => ({
    id: asset.assetId,
    label: asset.name || `Ảnh ${index + 1}`,
    imageUrl: asset.contentUrl
  }))
  const coverUrl = detail.coverContentUrl ?? images.find((asset) => asset.isCover)?.contentUrl ?? images[0]?.contentUrl

  return {
    id: detail.templateId,
    name: detail.name ?? '',
    kind,
    imageUrl: coverUrl ?? undefined,
    styleLabel: buildingTypeLabel,
    specs: {
      buildingTypeLabel,
      floorLabel: floorLabelOf(detail.floorCount, detail.hasTum),
      ...(kind === '2d' ? { lotSize, floorArea } : { imageCount: images.length })
    },
    description: (detail.description ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    floors,
    tags: {
      buildingType: detail.buildingTypeId ?? undefined,
      floorCount: detail.floorCount != null ? String(detail.floorCount) : undefined,
      hasAttic: detail.hasTum ?? undefined
    },
    buildingTypeId: detail.buildingTypeId ?? undefined,
    floorCount: detail.floorCount ?? undefined,
    lotWidth: Number(detail.widthM) || undefined,
    lotLength: Number(detail.lengthM) || undefined,
    area: Number(detail.areaM2) || undefined,
    versionId: detail.versionId,
    source: 'bmt'
  }
}

/* ===========================================================================
 * Adapter
 * ======================================================================== */

export const bmtHandbookApi = {
  /**
   * Danh sách bài viết công khai (`GET /news/articles`). Panel tư vấn (`topic`)
   * không có API nên luôn dùng mock. API rỗng/lỗi → mock.
   */
  async listArticles(topic?: string): Promise<HandbookArticle[]> {
    if (topic) return mockHandbookApi.listArticles(topic)
    try {
      const page = await http.get<PagedResult<BmtArticleSummary>>('/news/articles', {
        params: { pageIndex: 1, pageSize: 100 }
      })
      if (!page.items.length) return mockHandbookApi.listArticles(topic)
      return page.items.map(toArticleSummary)
    } catch {
      return mockHandbookApi.listArticles(topic)
    }
  },

  /** Chi tiết bài viết công khai (`GET /news/articles/{id}`). 404/lỗi → mock. */
  async getArticle(idOrSlug: string): Promise<HandbookArticle | null> {
    try {
      return toArticleDetail(await http.get<BmtArticleDetail>(`/news/articles/${idOrSlug}`))
    } catch {
      // 404 (bài nháp/ẩn/không tồn tại) hoặc lỗi bất kỳ → về mock để demo không trống.
      return mockHandbookApi.getArticle(idOrSlug)
    }
  },

  /** Danh sách mẫu công khai (`GET /design-templates`). API rỗng/lỗi → mock. */
  async listTemplates(): Promise<HandbookTemplate[]> {
    try {
      const items: BmtDesignTemplateSummary[] = []
      for (let pageIndex = 1; pageIndex <= 20; pageIndex++) {
        const page = await http.get<PagedResult<BmtDesignTemplateSummary>>('/design-templates', {
          params: { pageIndex, pageSize: 100 }
        })
        items.push(...page.items)
        if (!page.hasNextPage) break
      }
      if (!items.length) return mockHandbookApi.listTemplates()
      return items.map(toTemplateSummary)
    } catch {
      return mockHandbookApi.listTemplates()
    }
  },

  /**
   * Chi tiết mẫu CẦN ĐĂNG NHẬP: access-info → (nếu chưa mở) open trừ 1 lượt →
   * library-versions + assets. Chưa đăng nhập / mẫu mock / lỗi → mock (component
   * dựng cổng đăng nhập trước khi hook này được phép chạy cho mẫu API).
   */
  async getTemplate(id: string): Promise<HandbookTemplate | null> {
    if (!isAuthenticated()) return mockHandbookApi.getTemplate(id)
    try {
      const access = await http.get<BmtLibraryAccessInfo>(`/design-templates/${id}/access-info`)
      const versionId = access.currentVersionId
      if (!versionId) return mockHandbookApi.getTemplate(id)

      if (!access.alreadyOpened) {
        // Mở lần đầu: xác nhận dùng 1 lượt kèm editVersion đọc từ access-info.
        await http.post<BmtLibraryOpened>(`/design-templates/${id}/open`, {
          versionId,
          expectedEditVersion: access.editVersion,
          confirmUse: true
        })
      }

      const detail = await http.get<BmtLibraryVersionDetail>(`/library-versions/${versionId}`)
      const assets = await collectAssets(versionId, detail.editVersion)
      return toTemplateDetail(detail, assets)
    } catch {
      // 404 (mẫu mock/không có ở API), 409 (đổi phiên bản), lỗi bất kỳ → về mock.
      return mockHandbookApi.getTemplate(id)
    }
  },

  /**
   * Hạn mức xem chi tiết trong ngày. Lấy `catalog.detail` từ
   * `/me/design-subscription`; lượt TRA lưới không có API nên giữ theo mock.
   * Chưa đăng nhập / 401 / rỗng → mock (giữ counter demo).
   */
  async getQuota(): Promise<HandbookQuota> {
    const base = await mockHandbookApi.getQuota()
    if (!isAuthenticated()) return base
    try {
      const sub = await http.get<BmtDesignSubscriptionView | null>('/me/design-subscription')
      const detail = sub?.quotas?.find((quota) => quota.code === 'catalog.detail')
      if (!detail) return base
      if (detail.isUnlimited) return base
      return {
        ...base,
        detailTotal: detail.limit ?? base.detailTotal,
        detailRemaining: detail.available ?? base.detailRemaining
      }
    } catch {
      return base
    }
  }
}

/** Gom mọi trang tài nguyên của một phiên bản, giữ khóa lạc quan `expectedEditVersion`. */
async function collectAssets(versionId: string, editVersion: number): Promise<BmtLibraryVersionAssetItem[]> {
  const items: BmtLibraryVersionAssetItem[] = []
  for (let pageIndex = 1; pageIndex <= 20; pageIndex++) {
    const page = await http.get<BmtLibraryVersionAssets>(`/library-versions/${versionId}/assets`, {
      params: { pageIndex, pageSize: 100, expectedEditVersion: editVersion }
    })
    const assets = page.assets
    if (!assets) break
    items.push(...assets.items)
    if (!assets.hasNextPage) break
  }
  return items
}
