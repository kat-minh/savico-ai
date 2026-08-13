'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { EmptyState } from '@/shared/components/common'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDebouncedValue } from '@/shared/hooks'
import { useConsultants } from '../hooks/use-consultation'
import { filterConsultants, sortConsultants, specialtyOptions } from '../services/consultation.service'
import { ConsultantCard } from './consultant-card'

/** Giá trị "tất cả" của dropdown — Select không nhận value rỗng. */
const ALL = 'all'

interface ConsultantDirectoryProps {
  /**
   * Chuyên môn được ưu tiên đưa lên đầu — lớp app truyền vào theo loại công
   * trình của dự án gần nhất (mục VIII.1, phần đề xuất). Bỏ trống thì danh sách
   * chỉ nhóm theo chuyên môn.
   */
  preferredSpecialtyId?: string
}

/**
 * Trang danh sách kiến trúc sư (mục VIII.1, Hình 14).
 *
 * Tiêu đề canh giữa, hàng công cụ tìm + lọc chuyên môn + dòng đếm, rồi lưới 3
 * cột. Danh sách mặc định sắp xếp nhóm theo chuyên môn nên khách lướt theo cụm
 * chứ không phải theo thứ tự ngẫu nhiên của backend.
 */
export function ConsultantDirectory({ preferredSpecialtyId }: ConsultantDirectoryProps) {
  const t = useTranslations('consult.directory')

  const [term, setTerm] = useState('')
  const [specialtyId, setSpecialtyId] = useState(ALL)
  const query = useDebouncedValue(term, 250)

  const { data: consultants, isPending } = useConsultants()
  const pool = useMemo(() => consultants ?? [], [consultants])

  const options = useMemo(() => specialtyOptions(pool), [pool])

  const results = useMemo(
    () =>
      sortConsultants(
        filterConsultants(pool, {
          query,
          ...(specialtyId === ALL ? {} : { specialtyId })
        }),
        preferredSpecialtyId
      ),
    [pool, query, specialtyId, preferredSpecialtyId]
  )

  return (
    <div className='mx-auto w-full max-w-[80rem] space-y-6 px-4 py-10 lg:px-8'>
      <header className='space-y-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </header>

      <div className='bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3'>
        <div className='relative min-w-56 flex-1'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className='pl-9'
          />
        </div>

        <Select value={specialtyId} onValueChange={setSpecialtyId}>
          <SelectTrigger className='w-48' aria-label={t('specialty')}>
            <SelectValue placeholder={t('specialty')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allSpecialties')}</SelectItem>
            {options.map((specialty) => (
              <SelectItem key={specialty.id} value={specialty.id}>
                {specialty.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className='text-muted-foreground text-sm'>{t('count', { count: results.length })}</p>
      </div>

      <p className='text-center text-sm font-medium'>{t('lead')}</p>

      {isPending ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className='h-52 w-full rounded-xl' />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {results.map((consultant) => (
            <ConsultantCard key={consultant.id} consultant={consultant} />
          ))}
        </div>
      )}
    </div>
  )
}
