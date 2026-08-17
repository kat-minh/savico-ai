# Trạng thái dựng khung — SAVICO AI

Đối chiếu 11 màn hình ở [MO_TA_GIAO_DIEN.md](./MO_TA_GIAO_DIEN.md) mục V với code hiện có,
kèm phần **Khu quản trị (admin)** dựng theo những chỗ spec giao việc cho admin.
Cập nhật file này mỗi khi hoàn thiện một màn hình.

> Trang **Tư vấn 1:1** (dòng 12, 13, 13a) dựng theo **mục VIII, Hình 14–16** của bản
> "Mô tả giao diện web SAVICO **v2.0 — 05/08/2026**" (bản Bên A gửi qua Google Docs,
> chưa đưa vào repo). Bản v2.0 cũng thêm section Tư vấn 1:1 ở trang chủ (mục III.2)
> và mục "Tư vấn 1:1" trên thanh công cụ (mục II.1) — cả hai đã làm.

## Bản đồ màn hình → route → code

| # | Màn hình | Route | Code chính | Trạng thái |
|---|----------|-------|-----------|-----------|
| 1 | Trang chủ | `/` | `features/landing` (`HomeHero`, `HeroShowcase`, `HomeSteps`) + `features/guide` (`GuideHighlights`) | Đủ 4 khối; minh họa dựng bằng SVG/markup |
| 2 | Cẩm nang | `/handbook` | `features/handbook` (`HandbookBrowser` → `TemplateLibrary` / `FoundationBlock` + `NewsletterBlock` + `ArticleList`) | Dựng lại theo [MO_TA_CAM_NANG.md](./MO_TA_CAM_NANG.md): 2 tab lớn, công tắc 2D/3D, hạn mức theo ngày |
| 2a | Chi tiết mẫu 2D / 3D | `/handbook/mau/[id]` | `TemplateDetail` + `FloorSwitcher` + `TemplateInfo` | Chuyển tầng, dải ảnh xem trước, mẫu tương tự, nút đặt lịch tư vấn 1:1 |
| 2b | Trang bài viết | `/handbook/bai-viet/[slug]` | `ArticleDetail` | Breadcrumb 4 cấp, mục đánh số, bài cùng chủ đề, khối mời tạo dự án |
| 3 | Hướng dẫn | `/guide` | `features/guide/components/guide-browser.tsx` | Khung tìm kiếm + nhóm theo topic; **video chưa phát được** |
| 4 | Modal Tạo dự án | (modal toàn cục) | `features/design/components/create-project-dialog.tsx` | Đủ theo spec |
| 5 | Bước 1 — Nhập liệu | `/design/[projectId]/input` | `step-input-form.tsx` + `address-field.tsx` | Đủ 9 trường + tooltip (i) + autosave nháp + autocomplete tỉnh/phường |
| 6 | Bước 2 — màn chờ | `/design/[projectId]/estimate` | `GenerationWaiting` + `PersonalizedPanel` + `ProactiveChatStream` | Vòng %, panel 5 mẫu **bản vẽ 2D** kèm dòng căn cứ lọc, thu nhỏ được, chatbot tự trò chuyện |
| 7 | Bước 2 — kết quả | `/design/[projectId]/estimate` | `EstimateResultView`, `EstimateTable`, `CostDonut`, `AdvisoryNote` | Đủ 4 khối; "XEM CHI TIẾT" / "Tải Excel" xuất `.xlsx` đầy đủ hạng mục con |
| 8 | Bước 3 — chưa render | `/design/[projectId]/dossier` | `DossierOverview` | Đủ thông tin dự án + 4 thẻ xem trước + nút disabled |
| 9 | Bước 3 — màn chờ render | `/design/[projectId]/dossier` | `GenerationWaiting` (flow `dossier`) | Dùng lại bố cục Bước 2, panel đổi sang mẫu **nội thất 3D**, 3 thanh tiến trình kèm số n/N |
| 10 | Bước 3 — hoàn tất | `/design/[projectId]/dossier` | `DossierReady` + `DossierShareDialog` | 4 nút đã chạy: tải PDF thật, link chia sẻ, QR, gửi email (mock) |
| 11 | Cửa sổ cá nhân | `/account` | `features/account` + `MyProjects` (từ `features/design`) | Đủ 3 khu vực |
| 12 | Tư vấn 1:1 — danh sách KTS | `/consult` | `features/consultation` (`ConsultantDirectory` + `ConsultantCard`) | Tìm + lọc chuyên môn, đếm KTS, lưới 3 cột; danh sách nhóm theo chuyên môn |
| 13 | Tư vấn 1:1 — hồ sơ + chọn giờ | `/consult/[consultantId]` | `ConsultantDetail` = `ConsultantRail` + `ConsultantProfile` + `SlotPicker` | Cột trái danh sách thu gọn, hồ sơ + 4 ảnh công trình, chip 7 ngày, slot 30 phút, slot kín hiện "Kín" |
| 13a | Modal xác nhận đặt lịch | (modal) | `BookingDialog` | Dòng tóm tắt KTS · thứ ngày · khung giờ, SĐT (i) + ghi chú, toast góc phải trên, slot vừa đặt chuyển "Kín" |
| — | Xem hồ sơ qua link | `/share/[token]` | `SharedDossierView` | Đọc-chỉ: thông tin dự án + bảng dự toán 3 phần; token sai → trạng thái hết hạn |

## Khu quản trị (admin)

Spec không vẽ màn hình admin, chỉ nói rải rác "admin biên soạn / cấu hình" (mục VI,
mục VIII, mục X). Khu này dựng theo đúng những chỗ đó: mỗi thứ spec giao cho admin là
một trang. URL vẫn `/admin/...` (route group `(admin)`), chỉ tài khoản vai `admin` vào được.

| Trang | Route | Code chính | Sửa được cái gì |
|-------|-------|-----------|------------------|
| Tổng quan | `/admin` | `AdminOverview` | Số liệu đếm thẳng từ kho nội dung |
| Nội dung trang chủ | `/admin/content/home` | `HomeContentEditor` | Tiêu đề/phụ đề hero, 2 nút CTA, 3 điểm cam kết, 4 bước (mục II–III) |
| Trang tĩnh | `/admin/content/pages` | `StaticPagesEditor` | Điều khoản, Chính sách bảo mật — từng mục có tiêu đề + đoạn |
| Cấu hình site | `/admin/settings` | `SiteSettingsEditor` | Tên site, hotline, email, địa chỉ, Zalo/Messenger/Facebook/YouTube/TikTok ở footer |
| Thư viện mẫu | `/admin/handbook/templates` | `TemplateManager` | Mẫu 2D / 3D: nhóm, tag, thông số, ảnh từng tầng (mục VI) |
| Bài viết Cẩm nang | `/admin/handbook/articles` | `ArticleManager` | Bài viết + chủ đề + các mục đánh số trong bài |
| Hướng dẫn | `/admin/guide` | `GuideManager` | Video (link + ảnh bìa + topic) và bài hướng dẫn |
| Kiến trúc sư | `/admin/consultants` | `ConsultantManager` | Hồ sơ KTS, chuyên môn, 4 ảnh công trình (mục VIII, mục X #5) |
| Lịch tư vấn | `/admin/bookings` | `BookingManager` | Lịch đã đặt: ngày, khung giờ, trạng thái, ghi chú |
| Gói đăng ký | `/admin/plans` | `PlanManager` | Giá, số lượt, quyền lợi 3 gói — trang `/plans` đổi theo ngay (mục X #4) |
| Dự án | `/admin/projects` | `ProjectManager` | Danh sách dự án khách tạo, trạng thái, bước đang đứng |
| Khách hàng | `/admin/customers` | `CustomerManager` | Thông tin liên hệ, gói đang dùng, hạn dùng |
| Danh mục Bước 1 | `/admin/catalog` | `CatalogManager` | Loại công trình + phong cách: bật/tắt, đổi thứ tự, đổi nhãn, đổi ảnh (mục X #6) |
| Bảng đơn giá | `/admin/pricing` | `PricingManager` | Đơn giá theo 3 phần chi phí × 3 gói — **chưa nối vào bảng dự toán**, xem việc còn lại #2 |

Nội dung admin sửa nằm ở kho dùng chung `shared/cms` (chi tiết ở phần kiến trúc bên dưới).
Đã nối ngược ra site công khai: trang chủ, footer, Điều khoản / Bảo mật, Cẩm nang,
Hướng dẫn, Gói đăng ký, Tư vấn 1:1 và **danh mục Bước 1** đều đọc từ kho này.

## Việc còn lại (theo thứ tự ưu tiên)

1. **Nối API .NET** — hiện chạy bằng mock (`NEXT_PUBLIC_USE_MOCK_API=true`). Các endpoint placeholder nằm ở `features/*/api/*.api.ts`.
2. **Đối chiếu Phụ lục 02 + nối bảng đơn giá** — ba thứ dưới đây đang dùng nội dung TỰ SOẠN vì Phụ lục 02 không có trong repo, cần khớp lại khi có tài liệu:
   - danh mục hạng mục con + đơn giá trong `design.mock.ts` (`SECTION_SEEDS`);
   - văn mẫu đoạn tư vấn ở `messages/*.json` → `design.estimate.advisory.*`;
   - cấu trúc bộ hồ sơ PDF ở `services/pdf/dossier-pdf.tsx`.

   **Còn hở một chỗ**: trang `/admin/pricing` sửa được bảng đơn giá (`unitPrices`:
   3 phần chi phí × 3 gói) nhưng bảng dự toán vẫn lấy số cứng từ `SECTION_SEEDS`
   — sửa đơn giá ở admin CHƯA đổi kết quả Bước 2. Nối hai bên lại là quyết định
   nghiệp vụ (dự toán tính theo m² sàn × gói, hay giữ bảng hạng mục con chi tiết
   của Phụ lục 02), nên chờ Phụ lục 02 rồi làm một lần.
3. **Ảnh render thật** — bản vẽ mặt bằng 2D và phối cảnh ngoại thất hiện dựng bằng SVG/ảnh mẫu; hồ sơ PDF bỏ trống hai trang này cho tới khi API trả ảnh. Riêng thư viện mẫu thì admin tự thay được: `/admin/handbook/templates` có khối "Các tầng" để điền `imageUrl` từng tầng, bỏ trống thì `PlanDrawing` vẽ theo preset.
4. **Video hướng dẫn** — trang `/guide` mới có khung; cần file video + ảnh bìa thật.
5. **Gửi email thật** — `sendDossierEmail` đang là mock, backend cần gửi kèm link chia sẻ.
6. **Link chia sẻ dùng được liên phiên** — mock giữ dữ liệu trong bộ nhớ tab nên link chỉ mở được ở chính tab đã tạo; backend cấp token thật sẽ hết vấn đề.
7. **Hạn mức Cẩm nang theo ngày** — `useHandbookQuota` chờ backend trả `{lookupRemaining, lookupTotal, detailRemaining, detailTotal}` reset mỗi ngày; chưa định nghĩa cách đếm cho khách chưa đăng nhập (xem MO_TA_CAM_NANG.md, phần III).
8. **Tư vấn 1:1 — phần backend** (màn hình đã dựng xong theo mục VIII của bản mô tả giao diện v2.0, Hình 14–16):
   - `GET /consultants`, `GET /consultants/{id}`, `GET /consultants/{id}/availability`, `POST /consultations` đang chạy mock; lịch trống 7 ngày và slot "Kín" do mock sinh theo băm cố định.
   - **SMS xác nhận sau khi đặt lịch (mục VIII.4)** là việc của backend: gửi SMS cho khách + báo lịch mới cho KTS / quản trị; Bên B còn phải đề xuất nhà cung cấp SMS brandname (mục XII.5).
   - Hồ sơ KTS, danh mục chuyên môn và danh sách lịch đã đặt admin sửa được ở `/admin/consultants` và `/admin/bookings` (mục X, #5); ảnh chân dung mặc định vẫn là ảnh seed trong `shared/lib/imagery.ts` (`PORTRAIT_IMAGE`). **Chưa có** màn khóa / mở slot theo lịch làm việc của KTS — lịch trống 7 ngày do mock sinh.
9. **Kho nội dung chỉ nằm ở máy người xem** — `shared/cms` ghi vào `localStorage`, nên admin sửa xong chỉ mình máy đó thấy. Đây là bản mock cho khách duyệt giao diện; khi có API .NET thì thay phần thân `cmsDb` bằng lời gọi HTTP, chữ ký hàm và mọi nơi gọi giữ nguyên. Kèm theo đó backend cần: phân quyền admin thật (hiện `AdminGuard` chỉ là UX), tải ảnh lên thay vì dán URL, và nhật ký ai sửa gì.
10. **Cookie phiên vẫn tên `bmt.auth`** — tên cũ từ repo BMT, `src/proxy.ts` và `auth.mock.ts` dùng chung hằng `AUTH_COOKIE_NAME`. Đổi tên là một dòng, nhưng phải khớp với tên cookie backend .NET đặt nên chờ thống nhất với Bên B.

## Quyết định kiến trúc đáng lưu ý

- **`shared/cms/` — một kho, admin GHI, site công khai ĐỌC.** `features/admin` không được import `features/handbook` hay `features/plans` (luật không import chéo feature), nên nội dung chung phải nằm ở `shared/`. Trang công khai đọc qua `useCmsCollection` / `useCmsDocument` (`useSyncExternalStore`: máy chủ render bằng seed, hydrate xong đổi sang bản admin đã sửa — không lệch HTML, không nhấp nháy); mock của các feature đọc thẳng `cmsDb.list(...)`.
- **Chữ CMS chỉ GHI ĐÈ bản dịch, không thay thế.** `cmsText(admin, t('...'))` — admin bỏ trống ô nào thì ô đó dùng `messages/*.json`. Nhờ vậy admin dịch dần cũng không làm trống site tiếng Anh, và next-intl vẫn là nguồn chữ mặc định.
- **Nội dung có bản riêng cho mỗi ngôn ngữ, dữ liệu vận hành thì không.** Bài viết, mẫu, gói cước… lưu theo ngăn `vi` / `en` với chuỗi dự phòng `ngôn ngữ đang xem → vi → seed`; còn lịch hẹn, khách hàng, dự án là dữ liệu backend sinh nên nằm chung ngăn `shared`. Thanh "ngôn ngữ nội dung" ở đầu khu admin (`cms-locale.store`) quyết định đang sửa bản nào.
- **Danh mục Bước 1 lấy từ CMS nhưng id vẫn là union cố định.** `catalogBuildingTypes` / `catalogStyles` (`features/design/services/design-catalog.service.ts`) chỉ nhận id đã khai trong `design.constants` — vì id còn kéo theo trường điều kiện, ảnh minh họa và khóa dịch. Admin bật / tắt / đổi thứ tự / đổi nhãn thì Bước 1 đổi theo; admin bịa id lạ thì bỏ qua; tắt hết thì rơi về bảng mặc định của Phụ lục A.
- **Khu admin là một route group riêng, Ant Design chỉ nạp ở đó.** `(admin)/layout.tsx` bọc `AntdProvider` → `ProtectedRoute` → `AdminGuard`; site công khai vẫn thuần Tailwind + shadcn nên không dính bundle Ant Design. Các bảng CRUD dùng chung `ResourceManager` (bảng + ô tìm + ngăn kéo form) và `DocumentEditor` (tài liệu đơn), nên thêm một mảng nội dung mới chỉ là khai báo cột + form.
- **`shared/favorite/`** — cơ chế ♥ là cross-cutting (mục VI: dùng chung ở màn chờ Bước 2, Bước 3, trang Cẩm nang, và là nguồn của "Dự án yêu thích"). Vì `features/*` không được import lẫn nhau nên nó nằm ở `shared/`, giống `shared/auth`.
- **`shared/chat-context/`** — cùng lý do: `features/design` biết dữ liệu dự án, `features/chatbot` cần nó để tự trò chuyện (mục III.3a). Lớp app dịch nhãn rồi `usePublishChatContext` đẩy vào store; chatbox đọc ra. Store cũng giữ trạng thái đóng/mở của khung chat nổi để màn chờ mở được nó.
- **Hội thoại chatbot nằm ở store, không phải state cục bộ** — cùng một cuộc trò chuyện hiện ở hai chỗ: khung nổi góc phải dưới và dòng "AI tự trò chuyện" dưới vòng tiến độ. Kịch bản chủ động chỉ chạy ở `ChatDock` (luôn mounted) để không nói lặp.
- **Panel cẩm nang và dòng chat được inject qua prop** — `features/design` không import `features/handbook` hay `features/chatbot`; màn chờ nhận `sidePanel` và `chatStream` là `ReactNode` do lớp app truyền vào.
- **Bước 2 và Bước 3 mỗi bước một route** — màn chờ và màn kết quả dùng chung route, chuyển trạng thái tại chỗ (spec coi chúng là màn hình riêng nhưng cùng một bước).
- **Bản vẽ 2D vẽ bằng SVG, không phải ảnh** — `PlanDrawing` nhận `variant` (trệt / lầu / tum / mái) nên một component phục vụ cả khung minh họa trang chủ, thẻ xem trước hồ sơ và thư viện mẫu. `TemplateFigure` tự chọn: có `imageUrl` thì hiện ảnh, không thì vẽ.
- **`selectPersonalizedTemplates` là hàm thuần** — thuật toán nới lỏng tag (mục VI) nằm ở `features/handbook/services/`, nhận hàm `pick` từ ngoài để test được mà không phụ thuộc `Math.random`.
- **Thành tiền luôn cộng dồn từ hạng mục con** — `rollUpSections` tính hạng mục lớn và tổng từng phần từ `children`, nên bảng trên màn hình không bao giờ lệch file Excel.
- **File Excel / PDF sinh ở client chỉ là đường lùi của bản mock** — nếu backend trả `xlsxUrl` / `pdfUrl` thật thì tải thẳng file đó; `write-excel-file` và `@react-pdf/renderer` đều được dynamic-import nên không nằm trong bundle của route.
