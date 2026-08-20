import type { CmsHomeContent, CmsSiteSettings, CmsStaticPage } from '../cms.types'

/**
 * Nội dung site khởi điểm — bản sao tiếng Việt của các chuỗi đang nằm trong
 * `messages/vi.json`. Giao diện đọc CMS trước, rỗng thì rơi về i18n, nên đổi
 * seed ở đây KHÔNG phá bản dịch tiếng Anh.
 */
export const HOME_CONTENT_SEED: CmsHomeContent = {
  // RỖNG có chủ đích: `cmsText(doc, t(...))` lấy doc TRƯỚC, nên seed mà chứa chữ
  // thật thì nó đè lên bản dịch — trang chủ tiếng Anh từng hiện tiếng Việt vì
  // đúng lỗi này. Chữ hero giờ ở `messages/*.json` + ghi đè `uiStrings`; tài liệu
  // này chỉ giữ CẤU TRÚC (id khớp icon) chờ backend.
  heroTitleLead: '',
  heroTitleAccent: '',
  heroSubtitle: '',
  heroPrimaryCta: '',
  heroSecondaryCta: '',
  promises: [
    { id: 'fast', title: '', hint: '' },
    { id: 'accurate', title: '', hint: '' },
    { id: 'secure', title: '', hint: '' }
  ],
  steps: [
    { id: 'input', title: '', description: '' },
    { id: 'estimate', title: '', description: '' },
    { id: 'dossier', title: '', description: '' }
  ]
}

const LEGAL_UPDATED_NOTE = 'Cập nhật lần cuối: nội dung mẫu — SAVICO cung cấp nội dung chính thức trước khi go-live.'

export const TERMS_PAGE_SEED: CmsStaticPage = {
  title: 'Điều khoản sử dụng',
  updatedNote: LEGAL_UPDATED_NOTE,
  intro:
    'Các điều khoản này điều chỉnh việc bạn sử dụng nền tảng SAVICO AI. Khi tạo tài khoản hoặc sử dụng dịch vụ, bạn đồng ý với các điều khoản dưới đây.',
  sections: [
    {
      heading: '1. Chấp nhận điều khoản',
      body: 'Khi truy cập hoặc sử dụng nền tảng, bạn đồng ý tuân thủ Điều khoản sử dụng và Chính sách bảo mật của chúng tôi.'
    },
    {
      heading: '2. Sử dụng dịch vụ',
      body: 'Bản vẽ và dự toán do AI tạo ra chỉ mang tính tham khảo; kết quả và chi phí thực tế có thể thay đổi. Bạn chịu trách nhiệm về tính chính xác của thông tin cung cấp.'
    },
    {
      heading: '3. Tài khoản',
      body: 'Bạn cần cung cấp thông tin đăng ký chính xác và bảo mật thông tin đăng nhập. Bạn chịu trách nhiệm cho các hoạt động trong tài khoản của mình.'
    },
    {
      heading: '4. Sở hữu trí tuệ',
      body: 'Nội dung, thương hiệu và tài liệu trên nền tảng thuộc về SAVICO trừ khi có ghi chú khác.'
    },
    {
      heading: '5. Giới hạn trách nhiệm',
      body: 'Dự toán chỉ mang tính tham khảo. SAVICO không chịu trách nhiệm cho các quyết định chỉ dựa trên kết quả do AI tạo ra.'
    },
    {
      heading: '6. Liên hệ',
      body: 'Mọi thắc mắc về điều khoản, vui lòng liên hệ qua các kênh ở mục liên hệ.'
    }
  ]
}

export const PRIVACY_PAGE_SEED: CmsStaticPage = {
  title: 'Chính sách bảo mật',
  updatedNote: LEGAL_UPDATED_NOTE,
  intro:
    'Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
  sections: [
    {
      heading: '1. Dữ liệu thu thập',
      body: 'Thông tin tài khoản (họ tên, email, SĐT), ảnh mặt bằng bạn tải lên để xử lý AI, và thông tin từ form liên hệ. Chúng tôi không thu thập ảnh sổ đỏ.'
    },
    {
      heading: '2. Mục đích sử dụng',
      body: 'Để cung cấp dịch vụ thiết kế và dự toán, phản hồi yêu cầu của bạn và cải thiện nền tảng.'
    },
    {
      heading: '3. Dữ liệu hình ảnh',
      body: 'Ảnh mặt bằng tải lên chỉ dùng để tạo bản vẽ và phối cảnh. Dữ liệu được lưu trữ an toàn và có thể xóa theo yêu cầu.'
    },
    {
      heading: '4. Chia sẻ dữ liệu',
      body: 'Chúng tôi không bán dữ liệu cá nhân của bạn. Việc xử lý AI có thể liên quan đến các đối tác đáng tin cậy theo cam kết bảo mật.'
    },
    {
      heading: '5. Quyền của bạn',
      body: 'Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bất cứ lúc nào.'
    },
    {
      heading: '6. Liên hệ',
      body: 'Mọi yêu cầu về bảo mật, vui lòng liên hệ qua các kênh ở mục liên hệ.'
    }
  ]
}

/**
 * Placeholder cho tới khi Bên A gửi hotline, Fanpage / Zalo OA và thông tin
 * pháp lý thật (Q&A §3.3.1) — cùng bộ giá trị với `shared/config/site.ts`.
 */
export const SITE_SETTINGS_SEED: CmsSiteSettings = {
  brandName: 'SAVICO AI',
  tagline: 'Thiết kế & dự toán xây nhà bằng AI',
  hotline: '1900 0000',
  email: 'hello@savico.ai',
  address: 'TP. Hồ Chí Minh, Việt Nam',
  zaloUrl: 'https://zalo.me/0000000000',
  messengerUrl: 'https://m.me/savico',
  facebookUrl: 'https://facebook.com/savico',
  youtubeUrl: 'https://youtube.com/@savico',
  tiktokUrl: 'https://tiktok.com/@savico',
  companyName: 'Công ty Cổ phần SAVICO',
  taxCode: '0000000000',
  seoTitle: 'SAVICO AI — Thiết kế & dự toán xây nhà bằng AI',
  seoDescription: 'Chụp một tấm ảnh lô đất, nhận bản vẽ, phối cảnh 3D và dự toán chi phí chi tiết trong vài phút.',
  maintenanceNotice: ''
}
