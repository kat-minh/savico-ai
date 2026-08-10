'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { ErrorState } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/shared/components/ui/breadcrumb'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, handbookTemplateRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { FavoriteButton } from '@/shared/favorite'
import { useHandbookTemplate, useHandbookTemplates } from '../hooks/use-handbook'
import { selectSimilarTemplates } from '../services/handbook.service'
import { ConsultButton } from './consult-button'
import { FloorSwitcher, resolveFloor } from './floor-switcher'
import { QuotaBadge } from './quota-badge'
import { TemplateFigure } from './template-figure'
import { TemplateInfo } from './template-info'

/**
 * Trang chi tiết mẫu — dùng chung cho mẫu bản vẽ 2D (Phần 2.3, Hình 7) và mẫu
 * nội thất 3D (Phần 2.4, Hình 8).
 *
 * Bố cục giống nhau; khác biệt nằm ở nội dung: mẫu 2D có kích thước và dấu bản
 * quyền trên bản vẽ, mẫu 3D lấy ảnh làm vai trò chính. Sự khác biệt đó đã nằm
 * trong `TemplateFigure` và `TemplateInfo` nên trang này không rẽ nhánh.
 */
export function TemplateDetail({ templateId }: { templateId: string }) {
  const t = useTranslations('handbook.detail')
  // Tầng đang xem gắn kèm id của mẫu để điều hướng sang mẫu khác tự quay về
  // tầng đầu tiên mà không cần effect đồng bộ state.
  const [selection, setSelection] = useState({ templateId: '', floorId: '' })

  const { data: template, isPending, isError } = useHandbookTemplate(templateId)
  const { data: pool } = useHandbookTemplates()

  if (isPending) return <TemplateDetailSkeleton />
  if (isError || !template) return <ErrorState title={t('notFound')} description={t('notFoundHint')} />

  const activeFloor = resolveFloor(template, selection.templateId === template.id ? selection.floorId : '')
  const similar = pool ? selectSimilarTemplates(pool, template) : []

  return (
    <div className='mx-auto w-full max-w-[88rem] space-y-8 px-4 py-10 lg:px-8'>
      <div className='space-y-3'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={ROUTES.HANDBOOK}>{t('breadcrumbRoot')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={ROUTES.HANDBOOK}>{t('breadcrumbLibrary')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{template.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href={ROUTES.HANDBOOK}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          <ArrowLeft className='size-4' />
          {t('back')}
        </Link>

        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{template.name}</h1>

        {/* Hình 7: nút "Lưu mẫu" canh mép phải của CỘT TRÁI, không phải mép
            phải trang. Bề rộng khớp cột trái của lưới bên dưới (2.1fr trên
            tổng 3.1fr, trừ nửa khoảng cách 1.5rem). */}
        <div className='flex flex-wrap items-center gap-2 lg:w-[calc(67.74%-1.02rem)]'>
          <Badge variant='secondary'>{template.specs.buildingTypeLabel}</Badge>
          {template.kind === '3d' ? <Badge variant='secondary'>{template.styleLabel}</Badge> : null}
          <Badge variant='secondary'>{template.specs.floorLabel}</Badge>
          {template.specs.lotSize ? (
            <Badge variant='outline'>
              {template.specs.lotSize}
              {template.specs.floorArea ? ` · ${template.specs.floorArea}` : ''}
            </Badge>
          ) : null}
          <FavoriteButton
            variant='full'
            item={{
              templateId: template.id,
              kind: template.kind,
              name: template.name,
              imageUrl: template.imageUrl ?? template.floors[0]?.imageUrl ?? '',
              tagLabel: template.styleLabel
            }}
            className='ml-auto'
          />
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[2.1fr_1fr]'>
        <section className='bg-card space-y-4 rounded-2xl border p-4'>
          <TemplateFigure
            template={template}
            floor={activeFloor}
            // Bản vẽ nhà phố nằm ngang nên khung 16/9 để thừa hai dải trắng
            // rất lớn; mẫu 3D vẫn dùng 16/9 vì là ảnh chụp.
            className={cn('w-full rounded-xl border', template.kind === '3d' && 'aspect-16/9')}
            autoHeight={template.kind === '2d'}
            sizes='(max-width: 1024px) 100vw, 720px'
            priority
            watermark
          />
          <FloorSwitcher
            template={template}
            activeId={activeFloor?.id ?? ''}
            onChange={(floorId) => setSelection({ templateId: template.id, floorId })}
            showThumbnails
          />
        </section>

        <aside className='bg-card h-fit space-y-5 rounded-2xl border p-5'>
          <TemplateInfo template={template} />
          <QuotaBadge scope='detail' />
          <ConsultButton />
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className='bg-card space-y-4 rounded-2xl border p-5'>
          <h2 className='text-lg font-semibold'>{t('similar')}</h2>
          <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {similar.map((item) => (
              <li key={item.id} className='relative'>
                <Link
                  href={handbookTemplateRoute(item.id)}
                  className={cn(
                    'hover:border-primary/50 block h-full overflow-hidden rounded-xl border transition-colors',
                    item.kind === '2d' && 'flex gap-3 p-2'
                  )}
                >
                  <TemplateFigure
                    template={item}
                    className={cn(item.kind === '2d' ? 'w-24 shrink-0 rounded-lg' : 'aspect-4/3 w-full')}
                    sizes={item.kind === '2d' ? '96px' : '260px'}
                  />
                  <span className={cn('block min-w-0 space-y-1.5 pr-7', item.kind === '2d' ? 'flex-1' : 'p-3')}>
                    <span className='line-clamp-2 block text-sm font-medium'>{item.name}</span>
                    <span className='text-primary block text-xs'>
                      {[item.specs.floorLabel, item.specs.lotSize, item.specs.floorArea].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </Link>
                <FavoriteButton
                  item={{
                    templateId: item.id,
                    kind: item.kind,
                    name: item.name,
                    imageUrl: item.imageUrl ?? item.floors[0]?.imageUrl ?? '',
                    tagLabel: item.styleLabel
                  }}
                  className={cn('absolute right-1.5', item.kind === '2d' ? 'top-1.5' : 'bottom-2')}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function TemplateDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-5 w-64' />
      <Skeleton className='h-9 w-96 max-w-full' />
      <div className='grid gap-6 lg:grid-cols-[2.1fr_1fr]'>
        <Skeleton className='aspect-16/9 w-full rounded-2xl' />
        <Skeleton className='h-80 rounded-2xl' />
      </div>
    </div>
  )
}
