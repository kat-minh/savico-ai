'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { EmptyState } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDebouncedValue } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { LIBRARY_PAGE_SIZE } from '../constants/handbook.constants'
import { useHandbookTemplates } from '../hooks/use-handbook'
import { filterTemplates, pageCount, pageSlice } from '../services/handbook.service'
import type { HandbookTemplate, HandbookTemplateKind } from '../types/handbook.types'
import { QuotaBadge } from './quota-badge'
import { TemplateCard } from './template-card'

/** Giá trị "tất cả" của bộ lọc — Select không nhận value rỗng. */
const ALL = 'all'

/**
 * Thư viện mẫu (Phần 2.1 và 2.2, Hình 5 và Hình 6).
 *
 * Hai loại nội dung dùng CHUNG một khung: công tắc 2D/3D ở góc trái, hai bộ lọc,
 * ô tìm kiếm và huy hiệu hạn mức. Chỉ bộ lọc thứ hai đổi nghĩa — 2D lọc theo quy
 * mô số tầng, 3D lọc theo phong cách — nên không tách thành hai component.
 *
 * Bấm thẻ đi THẲNG sang trang chi tiết, không mở popup xem nhanh: popup chỉ có
 * lý do tồn tại ở màn chờ ("người dùng không phải rời khỏi trang đang chờ",
 * Phần 1.2), còn ở đây rời trang chính là việc cần làm.
 */
export function TemplateLibrary() {
  const t = useTranslations('handbook.library')

  const [kind, setKind] = useState<HandbookTemplateKind>('2d')
  const [buildingType, setBuildingType] = useState(ALL)
  const [secondary, setSecondary] = useState(ALL)
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)

  const query = useDebouncedValue(term, 250)
  const { data: templates, isPending } = useHandbookTemplates()
  const pool = useMemo(() => templates ?? [], [templates])

  const buildingOptions = useMemo(
    () =>
      uniqueOptions(
        pool.filter((template) => template.kind === kind),
        (template) => template.tags.buildingType,
        (template) => template.specs.buildingTypeLabel
      ),
    [pool, kind]
  )

  const secondaryOptions = useMemo(() => {
    const scoped = pool.filter((template) => template.kind === kind)
    if (kind === '3d') {
      return uniqueOptions(
        scoped,
        (template) => template.tags.interiorStyle,
        (template) => template.styleLabel
      )
    }
    return uniqueOptions(
      scoped,
      (template) => template.tags.floorCount,
      (template) => floorCountLabel(template.tags.floorCount, (count) => t('floorOption', { count }))
    )
  }, [pool, kind, t])

  /** Bộ lọc thứ hai đổi nghĩa theo loại thư viện nên nhãn cũng đổi theo. */
  const secondaryLabel = (value: string) => (kind === '2d' ? t('scalePrefix', { value }) : t('stylePrefix', { value }))

  const results = useMemo(
    () =>
      filterTemplates(pool, {
        kind,
        buildingType: buildingType === ALL ? undefined : buildingType,
        secondary: secondary === ALL ? undefined : secondary,
        query
      }),
    [pool, kind, buildingType, secondary, query]
  )

  const totalPages = pageCount(results.length, LIBRARY_PAGE_SIZE)
  // Đổi bộ lọc có thể làm trang hiện tại vượt quá số trang mới → kẹp lại thay vì
  // hiện lưới rỗng.
  const safePage = Math.min(page, totalPages)
  const visible = pageSlice(results, safePage, LIBRARY_PAGE_SIZE)

  /** Mọi thay đổi bộ lọc đều đưa về trang 1, nếu không người dùng dễ tưởng hết mẫu. */
  function resetTo(update: () => void) {
    update()
    setPage(1)
  }

  return (
    <div className='space-y-5'>
      {/* Toàn bộ thanh lọc nằm trong một khung trắng bo tròn (Hình 5). */}
      <div className='bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3'>
        <div className='bg-muted/60 inline-flex rounded-lg border p-1'>
          {(['2d', '3d'] as const).map((option) => (
            <button
              key={option}
              type='button'
              onClick={() =>
                resetTo(() => {
                  setKind(option)
                  setBuildingType(ALL)
                  setSecondary(ALL)
                })
              }
              aria-pressed={kind === option}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                kind === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(`kind.${option}`)}
            </button>
          ))}
        </div>

        <Select value={buildingType} onValueChange={(value) => resetTo(() => setBuildingType(value))}>
          <SelectTrigger className='w-full sm:w-52'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('buildingTypePrefix', { value: t('optionAll') })}</SelectItem>
            {buildingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t('buildingTypePrefix', { value: option.label })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={secondary} onValueChange={(value) => resetTo(() => setSecondary(value))}>
          <SelectTrigger className='w-full sm:w-52'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{secondaryLabel(t('optionAll'))}</SelectItem>
            {secondaryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {secondaryLabel(option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='relative min-w-56 flex-1'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={term}
            onChange={(event) => resetTo(() => setTerm(event.target.value))}
            placeholder={kind === '2d' ? t('searchPlaceholder2d') : t('searchPlaceholder3d')}
            className='pl-9'
          />
        </div>

        <QuotaBadge scope='lookup' className='ml-auto' />
      </div>

      {isPending ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: LIBRARY_PAGE_SIZE }).map((_, index) => (
            <Skeleton key={index} className='h-64 rounded-xl' />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {visible.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          <div className='relative flex flex-wrap items-center justify-between gap-4'>
            <p className='text-muted-foreground text-sm'>
              {t('resultCount', { shown: visible.length, total: results.length })}
            </p>

            {totalPages > 1 ? (
              <nav
                className='inset-x-0 flex items-center justify-center gap-2 sm:absolute'
                aria-label={t('pagination')}
              >
                {Array.from({ length: totalPages }).map((_, index) => {
                  const target = index + 1
                  return (
                    <button
                      key={target}
                      type='button'
                      onClick={() => setPage(target)}
                      aria-current={target === safePage ? 'page' : undefined}
                      aria-label={t('goToPage', { page: target })}
                      className={cn(
                        'size-2.5 rounded-full transition-colors',
                        target === safePage ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                      )}
                    />
                  )
                })}
              </nav>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

interface Option {
  value: string
  label: string
}

/** Dựng danh sách lựa chọn từ chính dữ liệu mẫu, giữ thứ tự xuất hiện. */
function uniqueOptions(
  templates: readonly HandbookTemplate[],
  getValue: (template: HandbookTemplate) => string | undefined,
  getLabel: (template: HandbookTemplate) => string
): Option[] {
  const seen = new Map<string, string>()
  for (const template of templates) {
    const value = getValue(template)
    if (!value || seen.has(value)) continue
    seen.set(value, getLabel(template))
  }
  return [...seen].map(([value, label]) => ({ value, label }))
}

/** `ground` → 1 tầng, `ground+2` → 3 tầng. */
function floorCountLabel(tag: string | undefined, format: (count: number) => string): string {
  if (!tag) return format(1)
  const extra = Number(tag.split('+')[1] ?? 0)
  return format(extra + 1)
}
