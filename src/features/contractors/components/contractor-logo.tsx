'use client'

import { Building2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import type { Contractor } from '../types/contractor.types'

interface ContractorLogoProps {
  contractor: Pick<Contractor, 'name' | 'logoUrl'>
  className?: string
}

/**
 * Ô logo nhà thầu. Danh bạ thật hiếm khi có đủ logo, nên khi thiếu thì dựng chữ
 * viết tắt trên nền thương hiệu thay vì để một ô trống — thẻ ở S12/S15 vẫn giữ
 * đúng nhịp bố cục.
 */
export function ContractorLogo({ contractor, className }: ContractorLogoProps) {
  const initials = contractor.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className={cn(
        'bg-accent text-primary-strong flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-sm font-bold tracking-tight',
        className
      )}
    >
      {contractor.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo đối tác là URL ngoài, không qua next/image loader
        <img src={contractor.logoUrl} alt='' className='size-full object-contain' />
      ) : initials ? (
        initials
      ) : (
        <Building2 className='size-5' />
      )}
    </span>
  )
}
