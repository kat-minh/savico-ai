'use client'

import { Clock, Info, MapPin, Scale, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorCompareRoute, contractorInvitationsRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import {
  CONTRACTOR_SORTS,
  DEFAULT_RADIUS,
  MAX_INVITATIONS,
  MIN_COMPARE,
  SEARCH_RADII
} from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { filterContractors, isInvited, remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { ContractorSort, SearchRadiusKm } from '../types/contractor.types'
import { ContractorCard } from './contractor-card'
import { ContractorLogo } from './contractor-logo'
import { ProjectContextBar } from './project-context-bar'

interface ContractorMatchesProps {
  projectId: string
}

const SORT_ICON = { match: Sparkles, distance: MapPin, rating: Scale, survey: Clock } as const

/**
 * Nhà thầu được đề xuất (S12).
 *
 * Bố cục: thanh ngữ cảnh dự án → MỘT hàng bộ lọc → danh sách bên trái, panel
 * "Đã chọn so sánh" bên phải.
 *
 * Bản mô tả xếp bán kính, tab vùng miền và chip sắp xếp thành ba hàng riêng,
 * đẩy nhà thầu đầu tiên xuống quá sâu — mà bán kính và vùng miền lại chồng vai
 * trò nhau (bán kính tính từ chính công trình đã đủ khoanh vùng). Gộp còn một
 * hàng: bán kính + sắp xếp.
 *
 * Panel phải `sticky`: danh sách cuộn dài mà ô "Đã chọn so sánh (n/3)" trôi mất
 * thì thao tác chọn 2–3 nhà thầu đứt đoạn.
 */
export function ContractorMatches({ projectId }: ContractorMatchesProps) {
  const t = useTranslations('contractors.matches')
  const tSort = useTranslations('contractors.sort')

  const { data: brief } = useBrief(projectId)
  const { data: contractors, isPending } = useContractors(projectId)
  const { data: invitations } = useInvitations(projectId)

  const compareIds = useContractorsStore((s) => s.compareIds)
  const toggleCompare = useContractorsStore((s) => s.toggleCompare)

  const [radiusKm, setRadiusKm] = useState<SearchRadiusKm>(DEFAULT_RADIUS)
  const [sort, setSort] = useState<ContractorSort>('match')

  const visible = useMemo(() => filterContractors(contractors ?? [], { radiusKm, sort }), [contractors, radiusKm, sort])

  const sent = invitations ?? []
  const used = sent.length
  const inviteLocked = remainingInvites(sent) === 0
  const selected = (contractors ?? []).filter((c) => compareIds.includes(c.id))

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-8 lg:px-8'>
      <ProjectContextBar brief={brief} />

      <header className='space-y-1 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      {/* MỘT hàng bộ lọc: bán kính bên trái, cách sắp xếp bên phải. */}
      <section className='bg-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground text-xs font-medium'>{t('radius')}</span>
          {SEARCH_RADII.map((km) => (
            <button
              key={km}
              type='button'
              onClick={() => setRadiusKm(km)}
              aria-pressed={km === radiusKm}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                km === radiusKm
                  ? 'border-primary text-primary-strong bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:border-primary/40'
              )}
            >
              {t('radiusOption', { km })}
            </button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {CONTRACTOR_SORTS.map((key) => {
            const Icon = SORT_ICON[key]
            return (
              <button
                key={key}
                type='button'
                onClick={() => setSort(key)}
                aria-pressed={key === sort}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  key === sort
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:border-primary/40'
                )}
              >
                <Icon className='size-3.5' />
                {tSort(key)}
              </button>
            )
          })}
        </div>
      </section>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <div className='min-w-0 space-y-3'>
          {isPending ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className='h-40 rounded-2xl' />)
          ) : visible.length === 0 ? (
            <EmptyState title={t('empty', { km: radiusKm })} />
          ) : (
            visible.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                projectId={projectId}
                compared={compareIds.includes(contractor.id)}
                onToggleCompare={toggleCompare}
                invited={isInvited(sent, contractor.id)}
                inviteLocked={inviteLocked}
              />
            ))
          )}
        </div>

        <aside className='space-y-4 lg:sticky lg:top-24 lg:self-start'>
          <section className='bg-card rounded-2xl border p-4'>
            <h2 className='flex items-baseline gap-2 text-sm font-semibold'>
              {t('compareTitle')}
              <span className='text-muted-foreground text-xs font-normal'>
                {t('compareCount', { selected: compareIds.length, max: MAX_INVITATIONS })}
              </span>
            </h2>

            <ul className='mt-3 space-y-2'>
              {selected.map((contractor) => (
                <li key={contractor.id} className='flex items-center gap-2.5'>
                  <ContractorLogo contractor={contractor} className='size-9 rounded-lg text-[11px]' />
                  <span className='min-w-0 flex-1 truncate text-sm'>{contractor.name}</span>
                  <button
                    type='button'
                    aria-label={`${t('compareCheckbox')} — ${contractor.name}`}
                    onClick={() => toggleCompare(contractor.id)}
                    className='text-muted-foreground hover:text-foreground transition-colors'
                  >
                    <X className='size-3.5' />
                  </button>
                </li>
              ))}
            </ul>

            <p className='text-muted-foreground mt-3 text-xs'>
              {t('compareHint', { min: MIN_COMPARE, max: MAX_INVITATIONS })}
            </p>

            {/* `asChild` biến nút thành thẻ <a> — mà thẻ <a> thì `disabled` không
                có tác dụng. Chưa đủ 2 nhà thầu thì render nút thật đã khóa. */}
            {compareIds.length < MIN_COMPARE ? (
              <Button className='mt-3 w-full' disabled>
                <Scale className='size-4' />
                {t('compareAction', { count: compareIds.length })}
              </Button>
            ) : (
              <Button asChild className='mt-3 w-full'>
                <Link href={contractorCompareRoute(projectId)}>
                  <Scale className='size-4' />
                  {t('compareAction', { count: compareIds.length })}
                </Link>
              </Button>
            )}
          </section>

          <section className='bg-accent/40 rounded-2xl border p-4'>
            <h2 className='text-sm font-semibold'>{t('whyTitle')}</h2>
            <ul className='text-muted-foreground mt-2.5 space-y-2 text-xs'>
              {[t('why1'), t('why2'), t('why3')].map((reason) => (
                <li key={reason} className='flex items-start gap-2'>
                  <Sparkles className='text-primary mt-0.5 size-3.5 shrink-0' />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className='text-muted-foreground space-y-2 rounded-2xl border border-dashed p-4 text-xs'>
            <p className='flex items-start gap-2'>
              <Info className='text-primary mt-0.5 size-3.5 shrink-0' />
              <span>{t('limitNote', { max: MAX_INVITATIONS, used })}</span>
            </p>
            {used > 0 ? (
              <Link
                href={contractorInvitationsRoute(projectId)}
                className='text-primary hover:text-primary/80 inline-block font-medium'
              >
                {t('trackInvites')} →
              </Link>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  )
}
