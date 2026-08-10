'use client'

import { useState } from 'react'
import { BookOpen, Info, LayoutGrid, Minimize2, Newspaper } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useChatContextStore } from '@/shared/chat-context'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { usePersonalizedTemplates, useHandbookArticles } from '../hooks/use-handbook'
import { useHandbookPanelStore } from '../store/handbook-panel.store'
import type { HandbookArticle, HandbookFilter, HandbookPanelTab, HandbookTemplate } from '../types/handbook.types'
import { ArticleCard } from './article-card'
import { ArticleDetailDialog } from './article-detail-dialog'
import { TemplateCard } from './template-card'
import { TemplateQuickView } from './template-quick-view'

interface PersonalizedPanelProps {
  /** Tag filter dựng từ các trường Bước 1 bởi lớp app. */
  filter: HandbookFilter
  /** `2d` (mẫu bản vẽ) cho màn chờ Bước 2, `3d` (mẫu nội thất) cho màn chờ Bước 3. */
  kind: HandbookTemplate['kind']
  /**
   * Dòng ghi rõ căn cứ lọc, ví dụ "Mẫu bản vẽ 2D phù hợp với Nhà phố Trệt + 1
   * lầu của bạn" (Phần 1.1). Nhãn đã dịch do lớp app dựng, vì `features/handbook`
   * không biết vocabulary của Bước 1.
   */
  filterLabel?: string
  /** Chủ đề bài viết: kiến trúc (Bước 2) hoặc nội thất (Bước 3). */
  topic: 'architecture' | 'interior'
}

/**
 * Bảng "Cẩm nang cá nhân hóa" (mục III.3a, tái dùng ở mục III.4b).
 *
 * Thanh công cụ dọc bên trái panel với 2 mục, vùng nội dung bên phải hiển thị
 * theo mục đang chọn. Bấm thu nhỏ → panel co thành nút nổi ở góc màn hình;
 * bấm nút nổi để mở lại bất cứ lúc nào.
 */
export function PersonalizedPanel({ filter, kind, topic, filterLabel }: PersonalizedPanelProps) {
  const t = useTranslations('handbook.panel')
  const tab = useHandbookPanelStore((s) => s.tab)
  const setTab = useHandbookPanelStore((s) => s.setTab)
  const minimized = useHandbookPanelStore((s) => s.minimized)
  const setMinimized = useHandbookPanelStore((s) => s.setMinimized)
  const chatOpen = useChatContextStore((s) => s.panelOpen)

  // Popup xem chi tiết là state cục bộ: nó chỉ sống trong lúc panel đang mở,
  // không cần giữ qua các bước như trạng thái thu nhỏ / mục đang chọn.
  const [selectedTemplate, setSelectedTemplate] = useState<HandbookTemplate | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HandbookArticle | null>(null)

  const { templates, isPending: templatesPending } = usePersonalizedTemplates(filter, kind)
  const { data: articles, isPending: articlesPending } = useHandbookArticles(topic)

  if (minimized) {
    return (
      <Button
        size='lg'
        onClick={() => setMinimized(false)}
        aria-label={t('restore')}
        tabIndex={chatOpen ? -1 : undefined}
        className={cn(
          // Xếp ngay trên nút chatbot ở cùng góc phải dưới.
          'fixed right-6 bottom-24 z-40 rounded-full shadow-lg transition-all duration-300',
          // Khung chat mở thì rút nút đi hẳn, y như nút chatbot. Trước đây nút
          // được dịch sang trái đúng 380px cho khớp bề rộng drawer, nhưng con số
          // đó nằm ở file khác nên không có gì giữ cho hai bên bằng nhau — chỉ
          // cần drawer đổi bề rộng, hoặc màn hẹp lại, là nút văng khỏi chỗ.
          chatOpen && 'pointer-events-none translate-y-2 opacity-0'
        )}
      >
        <BookOpen className='size-5' />
        <span className='hidden sm:inline'>{t('restore')}</span>
      </Button>
    )
  }

  const tabs: { id: HandbookPanelTab; icon: typeof LayoutGrid }[] = [
    { id: 'templates', icon: LayoutGrid },
    { id: 'articles', icon: Newspaper }
  ]

  // Hình 1 (Bước 2) không có thanh công cụ dọc, Hình 4 (Bước 3) có. Khi ẩn
  // thanh này thì panel luôn hiện lưới mẫu, bất kể `tab` đang lưu là gì.
  const showTabs = kind === '3d'
  const activeTab: HandbookPanelTab = showTabs ? tab : 'templates'

  return (
    <>
      <section
        aria-label={t('title')}
        // Panel không bao giờ cao hơn khung nhìn (trừ thanh công cụ + stepper) và
        // tự cuộn bên trong. Để nó dài tự do thì cột phải kéo dài gấp mấy lần cột
        // trái, `sticky` mất tác dụng và người dùng phải cuộn cả trang mới xem hết
        // mẫu. Áp cho mọi bề rộng, không chỉ desktop.
        className='bg-card flex max-h-[calc(100svh-11rem)] overflow-hidden rounded-2xl border'
      >
        {/* Thanh công cụ dọc bên trái panel — chỉ có ở Bước 3 (Hình 4) */}
        {showTabs ? (
          <nav className='bg-muted/40 flex w-44 shrink-0 flex-col gap-1 border-r p-2'>
            {tabs.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type='button'
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'true' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  tab === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-foreground/[0.06]'
                )}
              >
                <Icon className='size-4 shrink-0' />
                <span className='truncate'>{t(`tabs.${id}`)}</span>
              </button>
            ))}
          </nav>
        ) : null}

        {/* Vùng nội dung bên phải panel */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <header className='flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3'>
            <div className='min-w-0'>
              {/* Hình 1: dòng nhãn nhỏ màu thương hiệu nằm trên tiêu đề panel. */}
              <p className='text-primary truncate text-[0.7rem] font-semibold tracking-wide uppercase'>
                {t('eyebrow')}
              </p>
              <h2 className='truncate text-base font-semibold'>{t('title')}</h2>
              <p className='text-muted-foreground truncate text-xs'>
                {activeTab === 'articles'
                  ? t('tabs.articles')
                  : (filterLabel ?? t(kind === '2d' ? 'fallback2d' : 'fallback3d'))}
              </p>
            </div>
            <Button variant='ghost' size='icon' aria-label={t('minimize')} onClick={() => setMinimized(true)}>
              <Minimize2 className='size-4' />
            </Button>
          </header>

          <div className='min-h-0 flex-1 overflow-y-auto p-4'>
            {activeTab === 'templates' ? (
              templatesPending ? (
                <PanelSkeleton />
              ) : (
                /* Lưới 3×2 đúng Hình 1 / Hình 4 — sáu mẫu, không phải danh sách dọc. */
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {templates.map((template) => (
                    <TemplateCard key={template.id} template={template} variant='panel' onOpen={setSelectedTemplate} />
                  ))}
                </div>
              )
            ) : articlesPending ? (
              <PanelSkeleton />
            ) : (
              <div className='space-y-3'>
                {articles?.map((article) => (
                  <ArticleCard key={article.id} article={article} onOpen={setSelectedArticle} />
                ))}
              </div>
            )}
          </div>

          {/* Dòng gợi ý dưới lưới mẫu — chỉ Bước 3 (Hình 4) */}
          {activeTab === 'templates' && kind === '3d' ? (
            <p className='text-muted-foreground flex shrink-0 items-center gap-1.5 border-t px-4 py-2.5 text-xs'>
              <Info className='size-3.5 shrink-0' />
              {t('cardHint')}
            </p>
          ) : null}
        </div>
      </section>

      <TemplateQuickView template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
      <ArticleDetailDialog article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </>
  )
}

function PanelSkeleton() {
  return (
    <div className='space-y-3'>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className='h-28 w-full rounded-xl' />
      ))}
    </div>
  )
}
