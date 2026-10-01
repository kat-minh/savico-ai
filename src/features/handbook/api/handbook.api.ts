import { env } from '@/shared/config/env'
import { bmtHandbookApi } from './handbook.bmt'
import { mockHandbookApi } from './handbook.mock'

/**
 * Chức năng đã nối BMT API — GIỮ MOCK LÀM NỀN. DB backend đang rỗng nên mọi hàm
 * ở đây TỰ VỀ MOCK khi API trả rỗng / lỗi / 404 / chưa đăng nhập (xem
 * `handbook.bmt.ts`), để demo không bị trống và giao diện đã chốt vẫn chạy đúng
 * với cả dữ liệu mock cũ lẫn API mới.
 *
 * Đã nối:
 *   - Bài viết: `listArticles` (`GET /news/articles`), `getArticle`
 *     (`GET /news/articles/{id}`, kèm `contentHtml`). Panel tư vấn theo `topic`
 *     không có API → luôn mock.
 *   - Thư viện mẫu: lưới `listTemplates` + bộ lọc đang dùng MOCK (xem `BmtHandbookApi`); `getTemplate`
 *     (chi tiết CẦN ĐĂNG NHẬP: access-info → open trừ 1 lượt → library-versions +
 *     assets), `getQuota` (`catalog.detail` của `/me/design-subscription`).
 *
 *   - Mẫu liên quan lúc tạo dự toán: `matchTemplates` (`POST /design-templates/matches`) — không có mock, rỗng là rỗng.
 *   - Chi tiết mẫu đọc THEO SECTION (`/library-versions/{id}/sections` → tệp từng section):
 *     ảnh vào trình xem, tệp PDF/DWG/DXF thành dòng tải về.
 *   - Bộ lọc thư viện (`getLibraryFilters`, `listTemplateIdsByStyle`) và danh mục tin
 *     (`listNewsCategories`, `getNewsCategory`, `listNewsCategoryTree`) — công khai; không có
 *     dữ liệu thì mock trả `null`/rỗng để giao diện tự suy tuỳ chọn từ danh sách đang có.
 *
 * Giữ mock: `listStages` (không có API); lượt TRA lưới của `getQuota` (API chỉ có
 * `catalog.detail`); `/me/library-history` không có màn UI tiêu thụ.
 */
/** id mẫu của BMT API là UUID; id mẫu mock có dạng khác. */
const isApiTemplateId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)

const BmtHandbookApi = {
  listArticles: bmtHandbookApi.listArticles,
  getArticle: bmtHandbookApi.getArticle,
  // Trang /handbook: CHỈ danh sách bài viết (khối dưới cùng) lấy API; lưới thư viện mẫu và bộ lọc của nó dùng mock (BE
  // chưa đủ dữ liệu). Chi tiết mẫu vẫn theo id: mẫu API (UUID, vd. từ "mẫu liên quan" ở màn dự toán) đọc BE, còn mẫu
  // mock đọc mock — nên `getTemplate` không chuyển hẳn sang mock.
  matchTemplates: bmtHandbookApi.matchTemplates,
  getTemplate: (id: string) => (isApiTemplateId(id) ? bmtHandbookApi.getTemplate(id) : mockHandbookApi.getTemplate(id)),
  getQuota: bmtHandbookApi.getQuota,
  listNewsCategories: bmtHandbookApi.listNewsCategories,
  getNewsCategory: bmtHandbookApi.getNewsCategory,
  listNewsCategoryTree: bmtHandbookApi.listNewsCategoryTree
} satisfies Partial<typeof mockHandbookApi>

export const handbookApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockHandbookApi : { ...mockHandbookApi, ...BmtHandbookApi }
