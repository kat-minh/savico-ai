'use client'

import { Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useMemo, type ReactNode } from 'react'

import { messageEntriesOf, namespaceOf, sectionOf } from '@/shared/cms/message-catalog'
import { SITE_IMAGE, type SiteImageKey } from '@/shared/lib/imagery'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import {
  ADMIN_CONTENT_PAGES,
  contentPanelsOf,
  type AdminContentPage,
  type AdminPanelId
} from '../../constants/admin-pages.config'
import { useCmsLocale } from '../../hooks/use-admin-data'
import { AdminPanelScope } from '../common/admin-page'
import { OverrideEditor, type OverrideGroup, type OverrideRow } from '../content/override-editor'
import { SiteSettingsEditor } from '../content/site-settings-editor'
import { PrivacyPageEditor, TermsPageEditor } from '../content/static-pages-editor'
import { ArticleManager } from '../handbook/article-manager'
import { TemplateManager } from '../handbook/template-manager'
import { GuideArticleManager, GuideVideoManager } from '../guide/guide-manager'
import { ConsultantManager } from '../consult/consultant-manager'

const { Paragraph, Text, Title } = Typography

/** Chuỗi dài thì cho ô nhập nhiều dòng — mô tả, ghi chú pháp lý, lời chào bot. */
const MULTILINE_THRESHOLD = 90

/** Quá số ô này thì tab chữ mới cần ô tìm kiếm. */
const SEARCHABLE_FROM = 20

/**
 * Cảnh báo lúc dev nếu có nhánh khóa dịch không trang nào nhận.
 *
 * Cả khu nội dung dựa trên một lời hứa: mọi chữ trên site đều sửa được TRONG
 * trang của nó. Thêm một nhánh mới vào `messages/*.json` mà quên khai
 * `copyNamespaces` là lặng lẽ phá lời hứa đó — không ai thấy cho tới khi khách
 * hỏi "chữ này sửa ở đâu".
 */
/** Mọi khóa đã được MỘT trang nào đó đưa lên tầng chính. */
const GLOBAL_FEATURED_KEYS = new Set(
  ADMIN_CONTENT_PAGES.flatMap((page) => page.featuredSections?.flatMap((section) => [...section.keys]) ?? [])
)

if (process.env.NODE_ENV === 'development') {
  const claimed = new Set(ADMIN_CONTENT_PAGES.flatMap((page) => page.copyNamespaces ?? []))
  const orphans = [...new Set(messageEntriesOf(DEFAULT_LOCALE).map((entry) => namespaceOf(entry.key)))].filter(
    (namespace) => !claimed.has(namespace)
  )
  if (orphans.length > 0) {
    console.warn(
      `[admin] Nhánh khóa dịch chưa thuộc trang nào: ${orphans.join(', ')}. ` +
        'Thêm vào `copyNamespaces` của một trang trong `admin-pages.config.ts`.'
    )
  }
}

/**
 * Các tab dùng lại được, tra theo mã khai trong `admin-pages.config`.
 *
 * Bản đồ nằm ở đây chứ không ở file hằng số vì giá trị là JSX. Mọi component
 * dưới đây vốn là một MÀN đứng riêng — nhúng vào tab được là nhờ
 * `AdminPanelScope` bảo `AdminPage` bỏ phần tiêu đề đi.
 */
const PANELS: Record<AdminPanelId, ReactNode> = {
  termsPage: <TermsPageEditor />,
  privacyPage: <PrivacyPageEditor />,
  siteSettings: <SiteSettingsEditor />,
  templates: <TemplateManager />,
  articles: <ArticleManager />,
  guideVideos: <GuideVideoManager />,
  guideArticles: <GuideArticleManager />,
  consultants: <ConsultantManager />
}

/**
 * Màn quản trị của MỘT trang công khai.
 *
 * Mọi thứ sửa được trên trang đó nằm chung một chỗ, chia thành tab: chữ của
 * trang, ảnh của trang, rồi tới các bảng dữ liệu mà chính trang đó hiển thị.
 * Trước đây ba nhóm này nằm ở ba mục menu khác nhau nên sửa một trang phải nhớ
 * đi những đâu.
 */
export function ContentWorkspace({ page }: { page: AdminContentPage }) {
  const t = useTranslations('admin')
  const locale = useCmsLocale()
  const searchParams = useSearchParams()

  /**
   * Chữ của trang, gom theo ĐÚNG KHỐI mà khách nhìn thấy — "Khối Cẩm nang nền
   * tảng", "Khối Tin tức mới nhất", "Đầu trang & hai tab"…
   *
   * Nhóm suy ra từ chính khóa dịch (`handbook.foundation.*` → khối "Cẩm nang nền
   * tảng"), KHÔNG phải một danh sách chọn tay. Chọn tay là đoán: bản trước tự
   * nhặt ra 21 khóa gọi là "hay dùng", kết quả thiếu hẳn khối "Tin tức mới nhất"
   * đang nằm giữa trang và xếp tab ngược thứ tự trang thật. Suy từ khóa thì thêm
   * chữ mới trong code cũng tự vào đúng khối, không ai phải nhớ cập nhật.
   */
  /**
   * Tên khối, hoặc chính mã khối nếu chưa ai đặt tên.
   *
   * `t` chỉ nhận khóa hằng, mà mã khối lại suy ra lúc chạy từ catalog — nên phải
   * ép kiểu một lần ở đây. Đổi lại có `t.has` chặn: thêm một khối mới trong
   * `messages` mà quên đặt tên thì hiện mã thô chứ không hiện chuỗi lỗi.
   */
  /** Tên ảnh, hoặc chính khóa nếu ảnh mới thêm mà chưa ai đặt tên. */
  const imageName = (key: string): string => {
    const name = `siteImages.names.${key.replace(/[.-]/g, '_')}` as Parameters<typeof t.has>[0]
    return t.has(name) ? t(name) : key
  }

  const sectionTitle = (section: string): string => {
    const key = `sections.${section.replace('.', '_')}` as Parameters<typeof t.has>[0]
    return t.has(key) ? t(key) : section
  }

  /**
   * Chữ của trang, chia HAI TẦNG:
   *
   *   · `copyGroups` — các trường ĐÁNG SỬA, chọn tay trong `featuredKeys` sau
   *     khi rà từng trang: tiêu đề, mô tả, nhãn nút, thông báo chính. Mở màn là
   *     thấy ngay, ô hiện sẵn chữ đang chạy.
   *   · `advancedCopyGroups` — mọi khóa còn lại của trang (nhãn bộ lọc, chữ phụ,
   *     thông số...), gấp vào mục "Nâng cao" đóng sẵn. Vẫn sửa được, nhưng không
   *     chen vào mặt người vận hành.
   *
   * Cả hai vẫn gom theo khối khách nhìn thấy (suy từ 2 cấp đầu của khóa).
   */
  /**
   * Chữ của trang, hai tầng:
   *
   *   · `copyGroups` — các KHỐI khai tay theo ĐÚNG THỨ TỰ CUỘN TRANG, tên khối
   *     đánh số ("1 · Đầu trang…") để màn quản trị đọc như chính trang khách
   *     đang thấy, từ trên xuống dưới.
   *   · `advancedCopyGroups` — mọi khóa còn lại của trang, gấp vào "Nâng cao"
   *     đóng sẵn, gom theo khối suy từ khóa dịch.
   */
  const { copyGroups, advancedCopyGroups } = useMemo(() => {
    const namespaces = new Set(page.copyNamespaces ?? [])
    const catalog = new Map(messageEntriesOf(locale).map((entry) => [entry.key, entry.value]))

    const rowOf = (key: string): OverrideRow | null => {
      const value = catalog.get(key)
      if (value === undefined) return null
      return { key, defaultValue: value, multiline: value.length > MULTILINE_THRESHOLD }
    }

    const imageRowOf = (key: string): OverrideRow | null => {
      if (!(key in SITE_IMAGE)) return null
      const slug = `${page.key}_${key.replace(/[.-]/g, '_')}`
      const labelKey = `imageFields.${slug}` as Parameters<typeof t.has>[0]
      return {
        key,
        kind: 'image',
        label: t.has(labelKey) ? t(labelKey) : imageName(key),
        defaultValue: SITE_IMAGE[key as SiteImageKey]
      }
    }

    const featured: OverrideGroup[] = (page.featuredSections ?? [])
      .map((section, index) => {
        const labelKey = `pageSections.${page.key}_${section.key}` as Parameters<typeof t.has>[0]
        return {
          key: section.key,
          title: `${index + 1} · ${t.has(labelKey) ? t(labelKey) : section.key}`,
          // Chữ trước, ảnh của chính khối đó ngay sau — đúng như nhìn trên trang.
          rows: [
            ...section.keys.map(rowOf).filter((row): row is OverrideRow => row !== null),
            ...(section.imageKeys ?? []).map(imageRowOf).filter((row): row is OverrideRow => row !== null)
          ]
        }
      })
      .filter((group) => group.rows.length > 0)

    const restBySection = new Map<string, OverrideRow[]>()
    for (const entry of messageEntriesOf(locale, { sourceOrder: true })) {
      // Loại khóa đã featured ở BẤT KỲ trang nào (không riêng trang này): khối
      // Hướng dẫn trên trang chủ sửa Ở TRANG CHỦ, đừng hiện bản sao trong mục
      // "Nâng cao" của trang Hướng dẫn — hai chỗ cùng sửa một thứ là mời rối.
      if (!namespaces.has(namespaceOf(entry.key)) || GLOBAL_FEATURED_KEYS.has(entry.key)) continue
      const section = sectionOf(entry.key)
      const rows = restBySection.get(section) ?? []
      rows.push({ key: entry.key, defaultValue: entry.value, multiline: entry.value.length > MULTILINE_THRESHOLD })
      restBySection.set(section, rows)
    }
    const rest = [...restBySection].map(([section, rows]) => ({ key: section, title: sectionTitle(section), rows }))

    // Trang không khai khối (Chữ dùng chung) thì toàn bộ là tầng chính.
    if (featured.length === 0) return { copyGroups: rest, advancedCopyGroups: [] }
    return { copyGroups: featured, advancedCopyGroups: rest }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sectionTitle` chỉ đọc `t`.
  }, [page.copyNamespaces, page.featuredSections, page.key, locale, t])

  const copyRowCount = [...copyGroups, ...advancedCopyGroups].reduce((total, group) => total + group.rows.length, 0)

  /**
   * Khối đang mở, lấy từ `?tab=`. Không còn thanh tab: mỗi khối đã là một mục
   * menu con bên trái, bày thanh tab nữa là hai lớp điều hướng cho cùng một thứ.
   */
  const panels = contentPanelsOf(page)
  const requested = searchParams.get('tab') ?? ''
  const active = panels.find((panel) => panel === requested) ?? panels[0]

  /**
   * Đầu màn nói rõ ĐANG SỬA CÁI GÌ.
   *
   * Trang nhiều khối: tên trang thành dòng nhỏ phía trên, tiêu đề lớn là tên
   * khối — nếu không thì đứng ở "Điều khoản sử dụng" mà tiêu đề vẫn ghi "Trang
   * tĩnh", chẳng biết mình đang sửa Điều khoản hay Bảo mật.
   *
   * Trang một khối thì trang CHÍNH LÀ khối đó: hiện tên trang kèm dòng mô tả,
   * khỏi lặp hai lần cùng một ý.
   */
  const single = panels.length <= 1

  const body =
    active === 'content' ? (
      <OverrideEditor
        title={t('workspace.panels.content')}
        description={t('workspace.copyHint')}
        groups={copyGroups}
        advancedGroups={advancedCopyGroups}
        searchable={copyRowCount > SEARCHABLE_FROM}
      />
    ) : active ? (
      PANELS[active]
    ) : null

  return (
    <div className='flex flex-col gap-2'>
      <div>
        {single ? null : (
          <Text type='secondary' style={{ fontSize: 13 }}>
            {t(`pages.${page.key}.title`)}
          </Text>
        )}
        <Title level={4} style={{ margin: 0 }}>
          {single || !active ? t(`pages.${page.key}.title`) : t(`workspace.panels.${active}`)}
        </Title>
        {single ? (
          <Paragraph type='secondary' style={{ margin: '4px 0 0', maxWidth: 780 }}>
            {t(`pages.${page.key}.description`)}
          </Paragraph>
        ) : null}
      </div>

      <AdminPanelScope>{body}</AdminPanelScope>
    </div>
  )
}
