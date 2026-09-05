import { ADMIN_ROUTES, type AdminRoute } from '@/shared/constants'

/**
 * KHU NỘI DUNG CHIA THEO TRANG.
 *
 * Trước đây khu quản trị chia theo LOẠI THỨ — chữ một mục, ảnh một mục, bảng dữ
 * liệu một nhóm khác — nên muốn sửa trang Cẩm nang phải đi ba chỗ và tự nhớ chỗ
 * nào có gì. Giờ mỗi trang công khai là MỘT màn, mở ra có đủ tab: chữ của trang
 * đó, ảnh của trang đó, và các bảng dữ liệu mà chính trang đó hiển thị.
 *
 * File này chỉ KHAI BÁO. Component nào vẽ tab nào nằm ở
 * `components/pages/content-workspace.tsx` — hằng số không giữ được JSX.
 */

/** Các tab dữ liệu / tài liệu dùng lại được, khai bằng mã chứ không phải JSX. */
export type AdminPanelId =
  | 'termsPage'
  | 'privacyPage'
  | 'siteSettings'
  | 'templates'
  | 'articles'
  | 'guideVideos'
  | 'guideArticles'
  | 'consultants'

/** Hình dạng khai báo. `key` để `string` ở đây rồi thu hẹp lại bên dưới. */
interface AdminContentPageDeclaration {
  /** Đoạn cuối đường dẫn `/admin/content/{key}`, cũng là hậu tố khóa dịch. */
  key: string
  route: AdminRoute
  /**
   * Nhánh khóa dịch mà trang này SỞ HỮU.
   *
   * Mọi chữ trong các nhánh này hiện ở tab "Chữ trên trang" của trang, gom theo
   * đúng khối mà khách nhìn thấy. Không liệt kê tay từng khóa: chọn tay là đoán,
   * và đoán thì sót.
   *
   * Mọi nhánh (trừ `admin`) phải được một trang nào đó nhận, nếu không sẽ có chữ
   * không sửa được ở đâu cả.
   */
  copyNamespaces?: readonly string[]
  /**
   * Các khối đáng sửa của trang, khai tay THEO ĐÚNG THỨ TỰ CUỘN TRANG mà khách
   * nhìn thấy — màn quản trị phải đọc như chính trang đó, từ trên xuống dưới.
   * Tên khối nằm ở `admin.pageSections.{page}_{section}`, được đánh số tự động;
   * nhãn từng trường ở `admin.fieldNames`.
   *
   * Mọi khóa còn lại trong `copyNamespaces` gấp vào mục "Nâng cao" đóng sẵn.
   */
  featuredSections?: readonly { key: string; keys: readonly string[]; imageKeys?: readonly string[] }[]
  /** Tài liệu / bảng dữ liệu của riêng trang này. */
  panels?: readonly AdminPanelId[]
}

const PAGES = [
  /* ---------------------------------------------------------------------------
   * THỨ TỰ = ĐÚNG THỨ TỰ MENU TRÊN SITE (`shared/layouts/site-nav.config.ts`):
   * Trang chủ → Thiết kế & Dự toán → Cẩm nang → Hướng dẫn → Gói đăng ký →
   * Tư vấn 1:1 → rồi tới các trang không nằm trên menu (Tài khoản, Trang tĩnh,
   * Menu & Chân trang, Chữ dùng chung).
   *
   * Hai menu xếp y hệt nhau thì nhìn site là biết mở mục nào trong admin —
   * lệch thứ tự là người vận hành phải tự dịch trong đầu.
   * ------------------------------------------------------------------------ */
  {
    key: 'home',
    // Thứ tự khối = ĐÚNG thứ tự trong `(main)/page.tsx`: Hero (cam kết + khung
    // minh họa nằm ngay trong hero) → dải 3 bước → khối Hướng dẫn → khối Tư vấn.
    // Hai khối cuối dùng khóa của nhánh `guide`/`consult` nhưng chúng HIỂN THỊ
    // trên trang chủ nên phải sửa được từ đây — đứng ở trang nào thì sửa ở
    // trang đó.
    featuredSections: [
      {
        key: 'hero',
        keys: [
          'landing.hero.titleLead',
          'landing.hero.titleAccent',
          'landing.hero.subtitle',
          'landing.hero.primaryCta',
          'landing.hero.secondaryCta'
        ]
      },
      {
        key: 'promises',
        keys: [
          'landing.hero.promises.fast.title',
          'landing.hero.promises.fast.hint',
          'landing.hero.promises.accurate.title',
          'landing.hero.promises.accurate.hint',
          'landing.hero.promises.secure.title',
          'landing.hero.promises.secure.hint'
        ]
      },
      {
        key: 'showcase',
        keys: ['landing.showcase.label', 'landing.showcase.title'],
        imageKeys: ['style.modern', 'render.villa']
      },
      {
        key: 'steps',
        keys: [
          'landing.steps.input.title',
          'landing.steps.input.description',
          'landing.steps.estimate.title',
          'landing.steps.estimate.description',
          'landing.steps.dossier.title',
          'landing.steps.dossier.description'
        ]
      },
      { key: 'guideBlock', keys: ['guide.highlights.title', 'guide.highlights.subtitle', 'guide.highlights.viewAll'] },
      { key: 'consultBlock', keys: ['consult.home.title', 'consult.home.subtitle', 'consult.home.cta'] }
    ],
    copyNamespaces: ['landing'],
    route: ADMIN_ROUTES.PAGE_HOME
  },
  {
    key: 'design',
    // Thứ tự = đúng luồng khách đi: màn mở đầu → popup tạo dự án → Bước 1 →
    // Bước 2 → Bước 3. Ảnh phối cảnh mẫu nằm trong Bước 3 vì nó hiện ở đó.
    featuredSections: [
      { key: 'entry', keys: ['design.entry.title', 'design.entry.subtitle', 'design.entry.create'] },
      { key: 'create', keys: ['design.createProject.title', 'design.createProject.subtitle'] },
      { key: 'input', keys: ['design.input.pageTitle', 'design.input.submit'] },
      {
        key: 'estimate',
        keys: [
          'design.estimate.pageTitle',
          'design.estimate.title',
          'design.estimate.grandTotal',
          'design.estimate.advisoryTitle',
          'design.estimate.continue'
        ]
      },
      {
        key: 'dossier',
        keys: [
          'design.dossier.infoTitle',
          'design.dossier.previewTitle',
          'design.dossier.lockedHint',
          'design.dossier.readyTitle',
          'design.dossier.readyThanks',
          'design.dossier.privacyNote',
          'design.dossier.ctaTitle'
        ],
        imageKeys: ['render.villa']
      }
    ],
    copyNamespaces: ['design'],
    route: ADMIN_ROUTES.PAGE_DESIGN
  },
  {
    key: 'handbook',
    featuredSections: [
      {
        key: 'header',
        // KHÔNG có `page.subtitle`: khóa tồn tại nhưng trang không render nó
        // — bày ra một ô sửa không đổi gì trên site là field ma.
        keys: ['handbook.page.title', 'handbook.page.tabs.news', 'handbook.page.tabs.library']
      },
      {
        key: 'foundation',
        keys: [
          'handbook.foundation.eyebrow',
          'handbook.foundation.kicker',
          'handbook.foundation.title',
          'handbook.foundation.description',
          'handbook.foundation.start',
          'handbook.foundation.stagesTitle'
        ]
      },
      { key: 'latest', keys: ['handbook.latest.title', 'handbook.latest.seeAll'] },
      { key: 'newsletter', keys: ['handbook.newsletter.title'] },
      { key: 'articles', keys: ['handbook.articles.title', 'handbook.articles.searchPlaceholder'] }
    ],
    copyNamespaces: ['handbook'],
    route: ADMIN_ROUTES.PAGE_HANDBOOK,
    panels: ['templates', 'articles']
  },
  {
    key: 'guide',
    // `guide.title` chỉ đọc cho screen-reader (sr-only), `guide.subtitle` không
    // render — trang thật mở đầu bằng Ô TÌM KIẾM, rồi lưới video, rồi bài viết.
    featuredSections: [
      { key: 'header', keys: ['guide.searchPlaceholder'] },
      { key: 'videos', keys: ['guide.videoComingSoon'] },
      { key: 'articles', keys: ['guide.articlesTitle'] }
    ],
    copyNamespaces: ['guide'],
    route: ADMIN_ROUTES.PAGE_GUIDE,
    panels: ['guideVideos', 'guideArticles']
  },
  {
    key: 'plans',
    featuredSections: [
      { key: 'header', keys: ['plans.title', 'plans.subtitle'] },
      {
        key: 'cards',
        keys: [
          'plans.tiers.basic',
          'plans.tiers.advanced',
          'plans.tiers.pro',
          'plans.tierTags.basic',
          'plans.tierTags.advanced',
          'plans.tierTags.pro',
          'plans.oneTime',
          'plans.featuresTitle',
          'plans.popular',
          'plans.cta.basic',
          'plans.cta.advanced',
          'plans.cta.pro'
        ]
      },
      { key: 'gift', keys: ['plans.gift.badge', 'plans.gift.open', 'plans.gift.understood'] },
      { key: 'comparison', keys: ['plans.comparison.title', 'plans.value.title'] },
      {
        key: 'footer',
        keys: ['plans.notes.payment', 'plans.notes.credits', 'plans.notes.estimate', 'plans.notes.gift']
      }
    ],
    copyNamespaces: ['plans'],
    route: ADMIN_ROUTES.PAGE_PLANS
  },
  {
    key: 'consult',
    featuredSections: [
      {
        key: 'header',
        keys: [
          'consult.directory.title',
          'consult.directory.subtitle',
          'consult.directory.searchPlaceholder',
          'consult.directory.allSpecialties',
          'consult.directory.lead'
        ]
      },
      { key: 'cards', keys: ['consult.card.viewProfile'] },
      { key: 'profile', keys: ['consult.profile.bookCta', 'consult.slots.title'] },
      {
        key: 'booking',
        keys: [
          'consult.booking.title',
          'consult.booking.phoneLabel',
          'consult.booking.noteLabel',
          'consult.booking.submit',
          'consult.booking.successToast'
        ]
      }
    ],
    copyNamespaces: ['consult'],
    route: ADMIN_ROUTES.PAGE_CONSULT,
    panels: ['consultants']
  },
  {
    key: 'account',
    // Thứ tự thật trên trang: đầu trang → cột trái (thông tin + thẻ GÓI CỦA
    // TÔI) → cột phải (hai tab Dự án / Mẫu đã lưu).
    featuredSections: [
      { key: 'header', keys: ['account.title', 'account.subtitle'] },
      { key: 'side', keys: ['account.info.title', 'account.plan.title', 'account.plan.upgrade'] },
      { key: 'main', keys: ['account.projects.title', 'account.favorites.title'] }
    ],
    copyNamespaces: ['account'],
    route: ADMIN_ROUTES.PAGE_ACCOUNT
  },
  {
    key: 'legal',
    copyNamespaces: ['legal'],
    route: ADMIN_ROUTES.PAGE_LEGAL,
    panels: ['termsPage', 'privacyPage']
  },
  {
    key: 'shell',
    featuredSections: [
      {
        key: 'nav',
        keys: ['nav.home', 'nav.design', 'nav.handbook', 'nav.guide', 'nav.plans', 'nav.consult', 'nav.createProject']
      },
      {
        key: 'footer',
        keys: [
          'footer.tagline',
          'footer.contactTitle',
          'footer.workingHours',
          'footer.quickLinksTitle',
          'footer.policyTitle',
          'footer.socialTitle',
          'footer.rights'
        ]
      },
      { key: 'assistant', keys: ['assistant.title', 'chatbot.greeting'] },
      {
        key: 'notFound',
        keys: ['errors.pageNotFound.title', 'errors.pageNotFound.description', 'errors.pageNotFound.action']
      }
    ],
    copyNamespaces: ['nav', 'footer', 'assistant', 'chatbot', 'errors'],
    route: ADMIN_ROUTES.PAGE_SHELL,
    panels: ['siteSettings']
  },
  {
    // Chữ không thuộc riêng trang nào: nút chung, popup đăng nhập / đăng ký,
    // thông báo kiểm tra dữ liệu, công tắc giao diện & ngôn ngữ, nút yêu thích.
    key: 'common',
    route: ADMIN_ROUTES.PAGE_COMMON,
    copyNamespaces: ['common', 'auth', 'validation', 'theme', 'language', 'favorite']
  }
] as const satisfies readonly AdminContentPageDeclaration[]

/**
 * `key` là hằng chuỗi cụ thể (suy ra từ chính bảng trên), nhờ vậy
 * `t(`pages.${page.key}.title`)` được next-intl kiểm khóa dịch — chứ nếu để
 * `string` thì gõ sai một trang cũng không ai báo.
 */
export type AdminContentPageKey = (typeof PAGES)[number]['key']

/** Một trang công khai, kèm mọi thứ admin sửa được trên trang đó. */
export interface AdminContentPage extends AdminContentPageDeclaration {
  key: AdminContentPageKey
}

export const ADMIN_CONTENT_PAGES: readonly AdminContentPage[] = PAGES

/** Khai báo của một trang, hoặc `undefined` nếu đường dẫn không khớp trang nào. */
export function adminContentPageOf(key: string): AdminContentPage | undefined {
  return ADMIN_CONTENT_PAGES.find((page) => page.key === key)
}

/** Một khối sửa được của trang — cũng là một mục menu con. */
export type ContentPanelId = 'content' | AdminPanelId

/**
 * Các khối của một trang, theo đúng thứ tự hiện trên menu.
 *
 * Dữ liệu thật (bài viết, mẫu, hồ sơ KTS) lên trước vì đó là thứ sửa hằng ngày;
 * chữ và ảnh minh họa của khung trang xếp sau — chúng đổi vài tháng một lần.
 *
 * Menu trái và màn nội dung ĐỀU gọi hàm này, nên hai bên không thể lệch nhau.
 */
export function contentPanelsOf(page: AdminContentPage): readonly ContentPanelId[] {
  // "Nội dung trang" đứng đầu — đó là chính trang khách thấy, gồm CẢ chữ lẫn
  // ảnh xếp theo thứ tự cuộn; các bảng dữ liệu (mẫu, bài viết…) theo sau.
  return [...(page.copyNamespaces?.length ? (['content'] as const) : []), ...(page.panels ?? [])]
}
