'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { consultantRoute } from '@/shared/constants/routes'
import { useDebouncedValue } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { filterConsultants, sortConsultants } from '../services/consultation.service'
import type { Consultant } from '../types/consultation.types'

interface ConsultantRailProps {
  consultants: readonly Consultant[]
  activeId: string
  isPending?: boolean
}

/**
 * Cột trái trang hồ sơ KTS (mục VIII.2, Hình 15): ô tìm + danh sách thu gọn.
 * Người đang xem được highlight viền xanh; bấm một người khác là đổi hồ sơ bên
 * phải nên mỗi hàng là một liên kết thật, quay lại được bằng nút Back.
 */
export function ConsultantRail({ consultants, activeId, isPending }: ConsultantRailProps) {
  const t = useTranslations('consult.rail')

  const [term, setTerm] = useState('')
  const query = useDebouncedValue(term, 250)

  const results = useMemo(() => sortConsultants(filterConsultants(consultants, { query })), [consultants, query])

  return (
    <aside className='bg-card space-y-3 rounded-xl border p-3'>
      <div className='relative'>
        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className='pl-9'
        />
      </div>

      {isPending ? (
        <div className='space-y-2'>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-lg' />
          ))}
        </div>
      ) : (
        <ul className='space-y-1'>
          {results.map((consultant) => {
            const active = consultant.id === activeId

            return (
              <li key={consultant.id}>
                <Link
                  href={consultantRoute(consultant.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors',
                    active ? 'border-primary bg-accent' : 'hover:bg-muted/60'
                  )}
                >
                  <Photo
                    className='size-11 shrink-0 rounded-full'
                    src={consultant.avatarUrl}
                    alt={consultant.name}
                    sizes='44px'
                  />
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-medium'>{consultant.name}</span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      {consultant.specialties.map((specialty) => specialty.label).join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
