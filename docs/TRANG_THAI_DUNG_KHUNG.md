# Trạng thái dựng khung — SAVICO AI

Đối chiếu 11 màn hình ở [MO_TA_GIAO_DIEN.md](./MO_TA_GIAO_DIEN.md) mục V với code hiện có.
Cập nhật file này mỗi khi hoàn thiện một màn hình.

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
| — | Xem hồ sơ qua link | `/share/[token]` | `SharedDossierView` | Đọc-chỉ: thông tin dự án + bảng dự toán 3 phần; token sai → trạng thái hết hạn |

## Việc còn lại (theo thứ tự ưu tiên)

1. **Nối API .NET** — hiện chạy bằng mock (`NEXT_PUBLIC_USE_MOCK_API=true`). Các endpoint placeholder nằm ở `features/*/api/*.api.ts`.
2. **Đối chiếu Phụ lục 02** — ba thứ dưới đây đang dùng nội dung TỰ SOẠN vì Phụ lục 02 không có trong repo, cần khớp lại khi có tài liệu:
   - danh mục hạng mục con + đơn giá trong `design.mock.ts` (`SECTION_SEEDS`);
   - văn mẫu đoạn tư vấn ở `messages/*.json` → `design.estimate.advisory.*`;
   - cấu trúc bộ hồ sơ PDF ở `services/pdf/dossier-pdf.tsx`.
3. **Ảnh render thật** — bản vẽ mặt bằng 2D và phối cảnh ngoại thất hiện dựng bằng SVG/ảnh mẫu; hồ sơ PDF bỏ trống hai trang này cho tới khi API trả ảnh. Thư viện mẫu cũng vậy: mẫu 2D vẽ bằng `PlanDrawing`, mẫu 3D dùng ảnh stock — chỉ cần điền `imageUrl` cho từng tầng là thay được, không phải sửa component.
4. **Video hướng dẫn** — trang `/guide` mới có khung; cần file video + ảnh bìa thật.
5. **Gửi email thật** — `sendDossierEmail` đang là mock, backend cần gửi kèm link chia sẻ.
6. **Link chia sẻ dùng được liên phiên** — mock giữ dữ liệu trong bộ nhớ tab nên link chỉ mở được ở chính tab đã tạo; backend cấp token thật sẽ hết vấn đề.
7. **Hạn mức Cẩm nang theo ngày** — `useHandbookQuota` chờ backend trả `{lookupRemaining, lookupTotal, detailRemaining, detailTotal}` reset mỗi ngày; chưa định nghĩa cách đếm cho khách chưa đăng nhập (xem MO_TA_CAM_NANG.md, phần III).
8. **Đặt lịch tư vấn 1:1** — `POST /handbook/consultations` đang là mock; cần chốt nơi nhận yêu cầu.
9. **Trang quản trị (admin)** — spec mục VI nói dữ liệu cẩm nang do admin biên soạn nhưng không có màn hình admin trong danh mục. Code admin cũ vẫn còn nguyên ở `../bmt/src/app/[locale]/(admin)/` nếu cần bê sang.

## Quyết định kiến trúc đáng lưu ý

- **`shared/favorite/`** — cơ chế ♥ là cross-cutting (mục VI: dùng chung ở màn chờ Bước 2, Bước 3, trang Cẩm nang, và là nguồn của "Dự án yêu thích"). Vì `features/*` không được import lẫn nhau nên nó nằm ở `shared/`, giống `shared/auth`.
- **`shared/chat-context/`** — cùng lý do: `features/design` biết dữ liệu dự án, `features/chatbot` cần nó để tự trò chuyện (mục III.3a). Lớp app dịch nhãn rồi `usePublishChatContext` đẩy vào store; chatbox đọc ra. Store cũng giữ trạng thái đóng/mở của khung chat nổi để màn chờ mở được nó.
- **Hội thoại chatbot nằm ở store, không phải state cục bộ** — cùng một cuộc trò chuyện hiện ở hai chỗ: khung nổi góc phải dưới và dòng "AI tự trò chuyện" dưới vòng tiến độ. Kịch bản chủ động chỉ chạy ở `ChatDock` (luôn mounted) để không nói lặp.
- **Panel cẩm nang và dòng chat được inject qua prop** — `features/design` không import `features/handbook` hay `features/chatbot`; màn chờ nhận `sidePanel` và `chatStream` là `ReactNode` do lớp app truyền vào.
- **Bước 2 và Bước 3 mỗi bước một route** — màn chờ và màn kết quả dùng chung route, chuyển trạng thái tại chỗ (spec coi chúng là màn hình riêng nhưng cùng một bước).
- **Bản vẽ 2D vẽ bằng SVG, không phải ảnh** — `PlanDrawing` nhận `variant` (trệt / lầu / tum / mái) nên một component phục vụ cả khung minh họa trang chủ, thẻ xem trước hồ sơ và thư viện mẫu. `TemplateFigure` tự chọn: có `imageUrl` thì hiện ảnh, không thì vẽ.
- **`selectPersonalizedTemplates` là hàm thuần** — thuật toán nới lỏng tag (mục VI) nằm ở `features/handbook/services/`, nhận hàm `pick` từ ngoài để test được mà không phụ thuộc `Math.random`.
- **Thành tiền luôn cộng dồn từ hạng mục con** — `rollUpSections` tính hạng mục lớn và tổng từng phần từ `children`, nên bảng trên màn hình không bao giờ lệch file Excel.
- **File Excel / PDF sinh ở client chỉ là đường lùi của bản mock** — nếu backend trả `xlsxUrl` / `pdfUrl` thật thì tải thẳng file đó; `write-excel-file` và `@react-pdf/renderer` đều được dynamic-import nên không nằm trong bundle của route.
