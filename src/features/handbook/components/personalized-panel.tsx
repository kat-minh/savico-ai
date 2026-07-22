'use client'

import { useState } from 'react'
import { BookOpen, LayoutGrid, Minimize2, Newspaper } from 'lucide-react'
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
import { TemplateDetailDialog } from './template-detail-dialog'

interface PersonalizedPanelProps {
  /** Tag filter dựng từ các trường Bước 1 bởi lớp app. */
  filter: HandbookFilter
  /** `layout` cho màn chờ Bước 2, `interior` cho màn chờ render Bước 3. */
  kind: HandbookTemplate['kind']
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
export function PersonalizedPanel({ filter, kind, topic }: PersonalizedPanelProps) {
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
        {/* Thanh công cụ dọc bên trái panel */}
        <nav className='bg-muted/40 flex shrink-0 flex-col items-center gap-1 border-r p-2'>
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type='button'
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'true' : undefined}
              title={t(`tabs.${id}`)}
              className={cn(
                'flex size-10 items-center justify-center rounded-lg transition-colors',
                tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-foreground/[0.06]'
              )}
            >
              <Icon className='size-5' />
            </button>
          ))}
        </nav>

        {/* Vùng nội dung bên phải panel */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <header className='flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3'>
            <div className='min-w-0'>
              <h2 className='truncate text-sm font-semibold'>{t('title')}</h2>
              <p className='text-muted-foreground truncate text-xs'>{t(`tabs.${tab}`)}</p>
            </div>
            <Button variant='ghost' size='icon' aria-label={t('minimize')} onClick={() => setMinimized(true)}>
              <Minimize2 className='size-4' />
            </Button>
          </header>

          <div className='min-h-0 flex-1 space-y-3 overflow-y-auto p-4'>
            {tab === 'templates' ? (
              templatesPending ? (
                <PanelSkeleton />
              ) : (
                templates.map((template) => (
                  <TemplateCard key={template.id} template={template} onOpen={setSelectedTemplate} />
                ))
              )
            ) : articlesPending ? (
              <PanelSkeleton />
            ) : (
              articles?.map((article) => <ArticleCard key={article.id} article={article} onOpen={setSelectedArticle} />)
            )}
          </div>
        </div>
      </section>

      <TemplateDetailDialog template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
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
