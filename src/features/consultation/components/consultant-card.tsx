'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { consultantRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import type { Consultant } from '../types/consultation.types'

interface ConsultantCardProps {
  consultant: Consultant
  className?: string
}

/**
 * Thẻ kiến trúc sư trong lưới 3 cột (mục VIII.1, Hình 14) và ở section Tư vấn
 * 1:1 trang chủ (mục III.2).
 *
 * Ảnh chân dung dọc bên trái, thông tin bên phải; dòng "12 năm kinh nghiệm ·
 * 85+ công trình" là thứ khách so sánh giữa các KTS nên để màu thương hiệu.
 */
export function ConsultantCard({ consultant, className }: ConsultantCardProps) {
  const t = useTranslations('consult.card')

  return (
    <article
      className={cn('group bg-card hover:border-primary/50 h-full rounded-xl border p-3 transition-colors', className)}
    >
      <div className='flex h-full items-stretch gap-3'>
        <Photo
          className='min-h-36 w-24 shrink-0 self-stretch rounded-lg sm:w-28'
          src={consultant.avatarUrl}
          alt={consultant.name}
          sizes='112px'
        />

        <div className='min-w-0 flex-1 space-y-2'>
          <div className='space-y-0.5'>
            <h3 className='truncate font-semibold'>{consultant.name}</h3>
            <p className='text-muted-foreground text-xs'>{consultant.title}</p>
          </div>

          <div className='flex flex-wrap gap-1.5'>
            {consultant.specialties.map((specialty) => (
              <Badge key={specialty.id} variant='secondary'>
                {specialty.label}
              </Badge>
            ))}
          </div>

          <p className='text-primary text-xs'>
            {t('experience', { years: consultant.yearsExperience })}
            <span aria-hidden> · </span>
            {t('projects', { count: consultant.projectCount })}
          </p>

          <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{consultant.headline}</p>

          <Button asChild variant='outline' size='sm' className='w-full'>
            <Link href={consultantRoute(consultant.id)}>{t('viewProfile')}</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
