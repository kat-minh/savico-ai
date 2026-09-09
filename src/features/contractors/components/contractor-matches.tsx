'use client'

import { ArrowLeftRight, CircleCheck, Clock, Info, MapPin, Scale, Sparkles, Star, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { CONTRACTOR_PREVIEW_ID, contractorCompareRoute, contractorInvitationsRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import {
  CONTRACTOR_SORTS,
  DEFAULT_RADIUS,
  MAX_INVITATIONS,
  MIN_COMPARE,
  SEARCH_RADII,
  SERVICE_REGIONS
} from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { filterContractors, isInvited, remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import { useProjectPickerStore } from '../store/project-picker.store'
import type { ContractorSort, SearchRadiusKm, ServiceRegion } from '../types/contractor.types'
import { ContractorCard } from './contractor-card'
import { ContractorLogo } from './contractor-logo'
import { ProjectContextBar } from './project-context-bar'
import { ProjectPickerDialog } from './project-picker-dialog'

interface ContractorMatchesProps {
  projectId: string
}

const SORT_ICON = { match: Sparkles, distance: MapPin, rating: Scale, survey: Clock } as const

/**
 * Nhà thầu được đề xuất (S12).
 *
 * Bố cục theo bản thiết kế S12: TIÊU ĐỀ trang trước, rồi thẻ dự án, rồi hàng
 * tab vùng "Khu vực", rồi hàng chip sắp xếp + bán kính, cuối cùng là danh sách
 * bên trái và panel "Đã chọn so sánh" bên phải.
 *
 * Bản trước bỏ tab vùng và gộp bán kính vào cùng hàng sắp xếp; nay dựng lại đủ
 * theo thiết kế khách chốt: vùng là một hàng riêng vì nó lọc mạnh nhất, còn bán
 * kính đứng cuối hàng chip vì nó chỉ tinh chỉnh trong vùng đã chọn.
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
  const openPicker = useProjectPickerStore((s) => s.openPicker)

  /**
   * Chế độ XEM THỬ: vào từ nút "Xem nhà thầu" ở landing khi chưa có hồ sơ nào.
   * Xem, lọc và so sánh thì mở; MỜI thì phải gắn vào một dự án (R1 đếm lời mời
   * theo dự án), nên nút mời khóa lại và dải nhắc ở đầu trang dẫn sang hộp thoại
   * chọn dự án.
   */
  const preview = projectId === CONTRACTOR_PREVIEW_ID

  const [radiusKm, setRadiusKm] = useState<SearchRadiusKm>(DEFAULT_RADIUS)
  const [sort, setSort] = useState<ContractorSort>('match')
  /**
   * Vùng đang chọn. Mặc định lấy vùng có NHIỀU nhà thầu nhất trong danh bạ chứ
   * không cứng "Bắc" như ảnh mẫu — ảnh dùng dữ liệu demo miền Nam, còn danh bạ
   * thật thì để trống tab đang chọn là màn hình trắng trơn ngay khi mở.
   */
  const [region, setRegion] = useState<ServiceRegion | null>(null)

  const defaultRegion = useMemo<ServiceRegion>(() => {
    const tally = new Map<ServiceRegion, number>()
    for (const contractor of contractors ?? []) tally.set(contractor.region, (tally.get(contractor.region) ?? 0) + 1)
    let best: ServiceRegion = 'central'
    let bestCount = -1
    for (const candidate of SERVICE_REGIONS) {
      const count = tally.get(candidate) ?? 0
      if (count > bestCount) {
        best = candidate
        bestCount = count
      }
    }
    return best
  }, [contractors])

  const activeRegion = region ?? defaultRegion

  const visible = useMemo(
    () => filterContractors(contractors ?? [], { radiusKm, sort, region: activeRegion }),
    [contractors, radiusKm, sort, activeRegion]
  )

  const sent = invitations ?? []
  const used = sent.length
  const inviteLocked = remainingInvites(sent) === 0
  const selected = (contractors ?? []).filter((c) => compareIds.includes(c.id))

  return (
    // Bản thiết kế S12 rộng ~1500px: bó `max-w-6xl` (1152px) thì cột giữa chỉ
    // còn ~370px cho BỐN ô chỉ số, chữ bị cắt ("18 dự …", "TP. Buôn Ma Thuộ…").
    <div className='mx-auto w-[94%] max-w-[88rem] space-y-6 py-8'>
      {/* Thiết kế S12: tiêu đề đứng TRÊN thẻ dự án. */}
      <header className='space-y-1 text-center'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      {preview ? (
        // Dải nhắc thay cho thẻ dự án: chưa có hồ sơ thì không có gì để hiện ở
        // đó, mà bỏ trống thì khách không hiểu vì sao nút mời lại mờ.
        <section className='border-warning/40 bg-warning/10 flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3.5 sm:px-5'>
          <span className='text-warning-strong flex size-11 shrink-0 items-center justify-center'>
            <Info className='size-6' />
          </span>
          <div className='min-w-0 flex-1'>
            <p className='font-semibold text-pretty'>{t('previewTitle')}</p>
            <p className='text-muted-foreground text-sm text-pretty'>{t('previewDescription')}</p>
          </div>
          <Button className='shrink-0' onClick={openPicker}>
            {t('previewAction')}
          </Button>
        </section>
      ) : (
        <ProjectContextBar
          brief={brief}
          label={t('projectLabel')}
          aside={
            <div className='flex flex-wrap items-center gap-3'>
              <span className='bg-accent text-primary-strong rounded-full px-3 py-1.5 text-xs font-medium'>
                {t('invitedPill', { used, max: MAX_INVITATIONS, left: MAX_INVITATIONS - used })}
              </span>
              <Link
                href={contractorInvitationsRoute(projectId)}
                className='text-primary-strong text-sm font-medium underline underline-offset-4'
              >
                {t('viewInvites')}
              </Link>
              {/* "Đổi dự án" mở hộp thoại chọn dự án ngay tại chỗ; trước đây nó
                  ném khách về trang Tài khoản rồi bắt tự tìm đường quay lại. */}
              <Button variant='outline' size='sm' onClick={openPicker}>
                <ArrowLeftRight className='size-4' />
                {t('switchProject')}
              </Button>
            </div>
          }
        />
      )}

      {/* Hàng tab vùng: nhãn bên trái, ba tab chia đều phần còn lại. */}
      <section className='flex flex-wrap items-center gap-3'>
        <span className='text-muted-foreground text-sm font-medium'>{t('regionLabel')}</span>
        <div className='grid min-w-0 flex-1 grid-cols-3 overflow-hidden rounded-xl border'>
          {SERVICE_REGIONS.map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setRegion(value)}
              aria-pressed={value === activeRegion}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors',
                value === activeRegion
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {t(`regions.${value}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Hàng chip sắp xếp bên trái, bán kính dồn về bên phải. */}
      <section className='flex flex-wrap items-center gap-x-4 gap-y-3'>
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
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                  key === sort
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
                )}
              >
                <Icon className='size-4' />
                {tSort(key)}
              </button>
            )
          })}
        </div>

        <div className='ml-auto flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground text-sm font-medium'>{t('radiusShort')}</span>
          {SEARCH_RADII.map((km) => (
            <button
              key={km}
              type='button'
              onClick={() => setRadiusKm(km)}
              aria-pressed={km === radiusKm}
              className={cn(
                'rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                km === radiusKm
                  ? 'border-primary text-primary-strong'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
              )}
            >
              {t('radiusOption', { km })}
            </button>
          ))}
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
                inviteLocked={inviteLocked || preview}
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
                // Thiết kế S12: mỗi nhà thầu đã chọn là một hàng CÓ VIỀN, kèm
                // điểm đánh giá bên phải — chính là con số khách dựa vào khi
                // quyết định giữ ai lại để so sánh.
                <li key={contractor.id} className='flex items-center gap-2.5 rounded-xl border p-2.5'>
                  <ContractorLogo contractor={contractor} className='size-10 rounded-lg text-[11px]' />
                  <span className='min-w-0 flex-1 truncate text-sm font-medium'>{contractor.name}</span>
                  <span className='inline-flex shrink-0 items-center gap-1 text-sm font-semibold'>
                    <Star className='text-warning size-3.5 fill-current' />
                    {contractor.rating}/5
                  </span>
                  <button
                    type='button'
                    aria-label={`${t('compareCheckbox')} — ${contractor.name}`}
                    onClick={() => toggleCompare(contractor.id)}
                    className='text-muted-foreground hover:text-foreground shrink-0 transition-colors'
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

          {/* Thiết kế S12: nền TRẮNG như mọi thẻ khác, ba dòng dấu tick xanh, và
              hai dòng sau nói số liệu CỦA CHÍNH nhà thầu đứng đầu chứ không phải
              câu chung chung — đó là lý do khách tin vào thứ tự đề xuất. */}
          <section className='bg-card rounded-2xl border p-4'>
            <h2 className='font-semibold'>{t('whyTitle')}</h2>
            <ul className='mt-3 space-y-2.5 text-sm'>
              {[
                t('why1'),
                t('why2', { count: visible[0]?.similarProjects ?? 0 }),
                t('why3', { hours: visible[0]?.surveyWithinHours ?? 24 })
              ].map((reason) => (
                <li key={reason} className='flex items-start gap-2'>
                  <CircleCheck className='text-primary mt-0.5 size-4 shrink-0' />
                  <span className='text-pretty'>{reason}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ProjectPickerDialog currentProjectId={preview ? undefined : projectId} />
    </div>
  )
}
