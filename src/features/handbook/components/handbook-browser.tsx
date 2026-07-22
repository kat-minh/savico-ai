'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { X } from 'lucide-react'

import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useDebouncedValue } from '@/shared/hooks'
import { useHandbookArticles, useHandbookTemplates } from '../hooks/use-handbook'
import type { HandbookArticle, HandbookTemplate } from '../types/handbook.types'
import { ArticleCard } from './article-card'
import { ArticleDetailDialog } from './article-detail-dialog'
import { TemplateCard } from './template-card'
import { TemplateDetailDialog } from './template-detail-dialog'

/** Giá trị "tất cả" của bộ lọc — Select không nhận value rỗng. */
const ALL = 'all'

type PanelTab = 'templates' | 'articles'

/**
 * Trang Cẩm nang (màn hình 2, mục II.3 + mục V).
 *
 * 2 tab: Mẫu tham khảo (thẻ có ♥) / Bài viết tư vấn, kèm bộ lọc và ô tìm kiếm.
 * Bấm thẻ mở xem chi tiết mẫu.
 */
export function HandbookBrowser() {
  const t = useTranslations('handbook.page')
  const tInput = useTranslations('design.input')

  const [tab, setTab] = useState<PanelTab>('templates')
  const [term, setTerm] = useState('')
  const [buildingType, setBuildingType] = useState(ALL)
  const [interiorStyle, setInteriorStyle] = useState(ALL)
  const [selected, setSelected] = useState<HandbookTemplate | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HandbookArticle | null>(null)

  const hasFilters = buildingType !== ALL || interiorStyle !== ALL
  function clearFilters() {
    setBuildingType(ALL)
    setInteriorStyle(ALL)
  }

  const query = useDebouncedValue(term, 250).trim().toLowerCase()

  const { data: templates, isPending: templatesPending } = useHandbookTemplates()
  const { data: articles, isPending: articlesPending } = useHandbookArticles()

  const visibleTemplates = (templates ?? []).filter((item) => {
    const matchesQuery =
      !query || item.name.toLowerCase().includes(query) || item.styleLabel.toLowerCase().includes(query)
    const matchesBuilding = buildingType === ALL || item.tags.buildingType === buildingType
    const matchesInterior = interiorStyle === ALL || item.tags.interiorStyle === interiorStyle
    return matchesQuery && matchesBuilding && matchesInterior
  })

  const visibleArticles = (articles ?? []).filter(
    (item) => !query || item.title.toLowerCase().includes(query) || item.excerpt.toLowerCase().includes(query)
  )

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-10 lg:px-8'>
      <header className='mb-8 space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as PanelTab)}>
        {/* Thanh công cụ gom lại một khối: tab, ô tìm và bộ lọc đứng rời rạc
            trên nền trang khiến người dùng không biết chúng liên quan nhau. */}
        <div className='bg-card space-y-4 rounded-2xl border p-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <TabsList>
              <TabsTrigger value='templates'>{t('tabs.templates')}</TabsTrigger>
              <TabsTrigger value='articles'>{t('tabs.articles')}</TabsTrigger>
            </TabsList>

            <p className='text-muted-foreground text-sm'>
              {t('resultCount', { count: tab === 'templates' ? visibleTemplates.length : visibleArticles.length })}
            </p>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row'>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className='sm:max-w-xs'
            />

            {/* Hai bộ lọc chỉ áp cho mẫu tham khảo — ở tab bài viết chúng không
                có tác dụng nên đừng bày ra. */}
            {tab === 'templates' ? (
              <>
                <Select value={buildingType} onValueChange={setBuildingType}>
                  <SelectTrigger className='sm:w-48' aria-label={tInput('buildingType.label')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('filters.allBuildingTypes')}</SelectItem>
                    {(['house', 'townhouse', 'apartment'] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {tInput(`buildingType.options.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={interiorStyle} onValueChange={setInteriorStyle}>
                  <SelectTrigger className='sm:w-48' aria-label={tInput('interiorStyle.label')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('filters.allInteriorStyles')}</SelectItem>
                    {(['modern', 'minimal', 'neoclassical', 'indochine'] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {tInput(`interiorStyle.options.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasFilters ? (
                  <Button variant='ghost' onClick={clearFilters} className='sm:ml-auto'>
                    <X className='size-4' />
                    {t('filters.clear')}
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <TabsContent value='templates' className='mt-6'>
          {templatesPending ? (
            <CardGridSkeleton />
          ) : visibleTemplates.length === 0 ? (
            <EmptyState title={t('empty.title')} description={t('empty.description')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {visibleTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} onOpen={setSelected} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='articles' className='mt-6'>
          {articlesPending ? (
            <CardGridSkeleton />
          ) : visibleArticles.length === 0 ? (
            <EmptyState title={t('empty.title')} description={t('empty.description')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2'>
              {visibleArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onOpen={setSelectedArticle} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TemplateDetailDialog template={selected} onClose={() => setSelected(null)} />
      <ArticleDetailDialog article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  )
}

function CardGridSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className='h-56 w-full rounded-xl' />
      ))}
    </div>
  )
}
