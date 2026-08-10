'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/i18n/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import type { HandbookPageTab } from '../types/handbook.types'
import { ArticleList } from './article-list'
import { FoundationBlock } from './foundation-block'
import { LatestNews } from './latest-news'
import { NewsletterBlock } from './newsletter-block'
import { TemplateLibrary } from './template-library'

/**
 * Trang Cẩm nang — hai tab lớn (Hình 5 và Hình 9).
 *
 * "Tin tức" gom cẩm nang nền tảng (kiến thức có cấu trúc cố định) và dòng bài
 * cập nhật theo thời điểm; "Thư viện mẫu" gom mẫu bản vẽ 2D và mẫu nội thất 3D.
 * Cả hai mở cho mọi người xem, không cần tạo dự án.
 *
 * Thứ tự tab và tab mặc định theo Hình 9. Hình 5/6/11 vẽ ngược lại — bộ ảnh tự
 * mâu thuẫn, chọn theo Hình 9 vì đó là hình mô tả chính trang Cẩm nang.
 *
 * Tab đang mở nằm ở `?tab=` chứ không phải state cục bộ: người dùng gửi link
 * cho nhau phải mở đúng tab, và nút Back của trình duyệt phải quay lại được.
 */
export function HandbookBrowser() {
  const t = useTranslations('handbook.page')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tab: HandbookPageTab = searchParams.get('tab') === 'library' ? 'library' : 'news'

  function selectTab(value: string) {
    // `news` là tab mặc định (Hình 9) nên không cần nằm trong URL.
    const query = value === 'library' ? '?tab=library' : ''
    router.replace(`${pathname}${query}`, { scroll: false })
  }

  return (
    <div className='mx-auto w-full max-w-[88rem] space-y-4 px-4 py-8 lg:px-8'>
      <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>

      <Tabs value={tab} onValueChange={selectTab}>
        {/* Tab gạch chân theo Hình 5 / Hình 11, không dùng kiểu viên thuốc mặc
            định của shadcn: đây là điều hướng cấp trang, không phải bộ lọc. */}
        <TabsList className='h-auto w-full justify-start gap-7 rounded-none border-b bg-transparent p-0'>
          {(['news', 'library'] as const).map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              // `flex-none`: TabsTrigger mặc định `flex-1` nên hai tab sẽ chia
              // đôi bề ngang; ở đây chúng phải bám sát mép trái như Hình 5.
              // Viền chỉ còn cạnh dưới để thành gạch chân.
              className='data-[state=active]:border-b-primary data-[state=active]:text-primary text-muted-foreground h-auto flex-none rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-1 pb-2.5 text-base font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none'
            >
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value='library' className='mt-6'>
          <TemplateLibrary />
        </TabsContent>

        <TabsContent value='news' className='mt-6 space-y-6'>
          <FoundationBlock />
          <LatestNews />
          <NewsletterBlock />
          <ArticleList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
