'use client'

import { House, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorBriefRoute } from '@/shared/constants/routes'
import { shortAddress } from '../services/brief.service'
import type { ProjectBrief } from '../types/contractor.types'

interface ProjectContextBarProps {
  brief?: ProjectBrief
  /** Ẩn nhãn phía trên tên dự án ở những màn đã có tiêu đề riêng. */
  compact?: boolean
  /** Đè nhãn mặc định — S12 gọi khối này là "Dự án đang chọn". */
  label?: string
  /**
   * Khối hành động dồn về mép phải (S12: viên nhãn số lượt mời, link "Xem lời
   * mời", nút "Đổi dự án"). Bỏ trống thì chỉ có link "Chỉnh sửa hồ sơ" như cũ.
   */
  aside?: React.ReactNode
}

/**
 * Thanh ngữ cảnh dự án — khối đầu trang DÙNG CHUNG cho S12, S13, S14, S15, S16
 * và S18.
 *
 * Bản mô tả tả lại khối này ở từng màn với chữ hơi khác nhau (và các hình AI vẽ
 * mỗi hình một kiểu). Dựng MỘT component để mọi màn trong luồng có cùng một mốc
 * neo: đang làm việc trên dự án nào, hồ sơ loại gì, sửa hồ sơ ở đâu.
 */
export function ProjectContextBar({ brief, compact = false, label, aside }: ProjectContextBarProps) {
  const t = useTranslations('contractors.common')
  const tScale = useTranslations('contractors.scale')

  if (!brief) {
    return <Skeleton className='h-20 w-full rounded-2xl' />
  }

  return (
    <section className='bg-card flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border px-4 py-3.5 sm:px-5'>
      <span className='bg-accent text-primary-strong flex size-11 shrink-0 items-center justify-center rounded-xl'>
        <House className='size-5' />
      </span>

      <div className='min-w-0 flex-1'>
        {compact ? null : (
          <p className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
            {label ?? t('seekingContractor')}
          </p>
        )}

        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='truncate text-lg font-semibold'>{brief.name}</h2>
          {brief.selfCreated ? (
            <span className='border-primary/40 text-primary-strong rounded-md border px-2 py-0.5 text-[11px] font-medium'>
              {t('selfCreated')}
            </span>
          ) : null}
        </div>

        {/* Bản mô tả: "Nhà phố · Trệt + 1 lầu · 120 m² · P. Tân Lợi, Đắk Lắk" —
            quy mô đứng ngay sau loại công trình. */}
        <p className='text-muted-foreground truncate text-xs'>
          {[brief.buildingType, tScale(brief.scale), `${brief.landArea} m²`, shortAddress(brief)]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {aside ?? (
        <Link
          href={contractorBriefRoute(brief.id)}
          className='text-primary hover:text-primary/80 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium underline-offset-4 transition-colors hover:underline'
        >
          <Pencil className='size-3.5' />
          {t('editBrief')}
        </Link>
      )}
    </section>
  )
}
