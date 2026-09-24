'use client'

import { CircleCheck, Clock, Info, MapPin, Scale, Sparkles, Star, X } from 'lucide-react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { useCmsDocument } from '@/shared/cms'
import { EmptyState, revealContainerVariants, revealEase, revealItemVariants } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { CONTRACTOR_PREVIEW_ID, contractorCompareRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import {
  CONTRACTOR_SORTS,
  MATCHES_INVITE_RETURN_KEY,
  MATCHES_PINNED_CONTRACTOR_KEY,
  MATCHES_PROJECT_CHANGED_KEY,
  MAX_INVITATIONS,
  MIN_COMPARE,
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

/** Suy vùng từ tỉnh trong hồ sơ thay vì đoán theo cụm nhà thầu hiện có. */
function serviceRegionFromProvince(provinceCode?: number | null, provinceName = ''): ServiceRegion {
  const centralCodes = new Set([38, 40, 42, 44, 45, 46, 48, 49, 51, 52, 54, 56, 58, 60, 62, 64, 66, 67, 68])
  const southCodes = new Set([70, 72, 74, 75, 77, 79, 80, 82, 83, 84, 86, 87, 89, 91, 92, 93, 94, 95, 96])
  if (provinceCode && centralCodes.has(provinceCode)) return 'central'
  if (provinceCode && southCodes.has(provinceCode)) return 'south'

  const normalized = provinceName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (
    /da nang|hue|quang|nghe an|ha tinh|thanh hoa|binh dinh|phu yen|khanh hoa|ninh thuan|binh thuan|dak|gia lai|kon tum|lam dong/.test(
      normalized
    )
  )
    return 'central'
  if (
    /ho chi minh|dong nai|binh duong|tay ninh|ba ria|vung tau|long an|tien giang|ben tre|tra vinh|vinh long|dong thap|an giang|kien giang|can tho|hau giang|soc trang|bac lieu|ca mau/.test(
      normalized
    )
  )
    return 'south'
  return 'north'
}

/**
 * Cờ một-lần: vừa từ M04 ("Tìm nhà thầu") sang trang này — thẻ đầu viền loé
 * một lần, tick "Vì sao SAVICO đề xuất?" chạy chậm hơn để đọc kịp (mục 6/10).
 * `brief-review.tsx` đặt cờ này trước khi điều hướng sang.
 */
export const MATCHES_JUST_ARRIVED_KEY = 'savico.matches-just-arrived'

/**
 * Id nhà thầu vừa xem hồ sơ (M06) rồi bấm "← Quay lại danh sách" — thẻ đó loé
 * viền một lần khi quay về đây (mục 2 của M06).
 */
export const MATCHES_LAST_VIEWED_KEY = 'savico.matches-last-viewed'

/** Đổi giá trị số/chữ bằng cách lật (mờ+trượt dọc) thay vì đổi tức thì — gần đúng "lật số". */
function FlipValue({ value }: { value: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <span className='inline-grid overflow-hidden align-bottom leading-[inherit]'>
      <AnimatePresence mode='wait' initial={false}>
        <motion.span
          key={value}
          initial={reduceMotion ? false : { opacity: 0, y: '-55%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '55%' }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: revealEase }}
          className='col-start-1 row-start-1 inline-block whitespace-nowrap leading-[inherit]'
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Nội dung thẻ rich của next-intl (`<n>1</n>`) → chuỗi, làm khoá lật cho `FlipValue`. */
function chunksText(chunks: ReactNode): string {
  return Array.isArray(chunks) ? chunks.join('') : String(chunks)
}

/** Vẽ thật stroke của icon thay vì phóng hoặc mở mặt nạ cả biểu tượng. */
function DrawnCheck({ delay, duration }: { delay: number; duration: number }) {
  const iconRef = useRef<SVGSVGElement>(null)
  const inView = useInView(iconRef, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()

  return (
    <CircleCheck
      ref={iconRef}
      aria-hidden
      className='text-primary mt-0.5 size-4 shrink-0'
      style={{
        strokeDasharray: '100 100',
        strokeDashoffset: reduceMotion || inView ? 0 : 100,
        transition: reduceMotion ? 'none' : `stroke-dashoffset ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
      }}
    />
  )
}

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
  const reduceMotion = useReducedMotion()

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

  // Nấc bán kính, mặc định và khu vực được hỗ trợ do admin cấu hình (Quy tắc đề xuất nhà thầu).
  const rules = useCmsDocument('contractorMatching')
  const regions = useMemo(
    () => SERVICE_REGIONS.filter((value) => rules.supportedRegions.includes(value)),
    [rules.supportedRegions]
  )
  const [radiusChoice, setRadiusKm] = useState<SearchRadiusKm | null>(null)
  const radiusKm =
    radiusChoice !== null && rules.radiusOptions.includes(radiusChoice) ? radiusChoice : rules.defaultRadiusKm
  const [sort, setSort] = useState<ContractorSort>('match')
  /**
   * Vùng đang chọn. Mặc định lấy vùng có NHIỀU nhà thầu nhất trong danh bạ chứ
   * không cứng "Bắc" như ảnh mẫu — ảnh dùng dữ liệu demo miền Nam, còn danh bạ
   * thật thì để trống tab đang chọn là màn hình trắng trơn ngay khi mở.
   */
  const [region, setRegion] = useState<ServiceRegion | null>(null)

  const defaultRegion = useMemo<ServiceRegion>(() => {
    if (brief?.address.provinceCode || brief?.address.provinceName) {
      return serviceRegionFromProvince(brief.address.provinceCode, brief.address.provinceName)
    }

    const tally = new Map<ServiceRegion, number>()
    for (const contractor of contractors ?? []) tally.set(contractor.region, (tally.get(contractor.region) ?? 0) + 1)
    return (regions.length ? regions : SERVICE_REGIONS).reduce((best, candidate) =>
      (tally.get(candidate) ?? 0) > (tally.get(best) ?? 0) ? candidate : best
    )
  }, [brief, contractors, regions])

  const activeRegion = region ?? defaultRegion

  const visible = useMemo(
    () => filterContractors(contractors ?? [], { radiusKm, sort, region: activeRegion }),
    [contractors, radiusKm, sort, activeRegion]
  )

  const sent = invitations ?? []
  const used = sent.length
  const inviteLocked = remainingInvites(sent) === 0
  const selected = (contractors ?? []).filter((c) => compareIds.includes(c.id))

  /** Vừa từ M04 sang (mục 6/10) — đọc một lần rồi xoá cờ ngay. */
  const [justArrived, setJustArrived] = useState(false)
  /** Vừa "← Quay lại danh sách" từ M06 — thẻ đó loé viền một lần (mục 2 của M06). */
  const [lastViewedId, setLastViewedId] = useState<string | null>(null)
  const [pinnedContractorId, setPinnedContractorId] = useState<string | null>(null)
  const [inviteReturned, setInviteReturned] = useState(false)
  /**
   * Vừa quay lại từ M09 — nhãn "Đã mời" đi hai nhịp: 'old' đứng ở số CŨ rồi lật sang số
   * mới; 'lock' giữ màu cũ thêm đúng quãng số cũ lật ra (0.22s của `FlipValue`), để màu
   * cam hết lượt đổi cùng lúc số mới lật vào chứ không đổi trước.
   */
  const [inviteFlipStage, setInviteFlipStage] = useState<'old' | 'lock' | null>(null)
  const [newlyInvitedIds, setNewlyInvitedIds] = useState<Set<string>>(() => new Set())
  const [projectChangeRevision, setProjectChangeRevision] = useState(0)
  const projectBarRef = useRef<HTMLDivElement>(null)
  const projectBarTriggerRef = useRef<number | null>(null)
  const [projectBarStuck, setProjectBarStuck] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const trigger = projectBarTriggerRef.current
      if (trigger === null) return
      setProjectBarStuck((current) => {
        // So sánh với một mốc scroll tuyệt đối, không đo lại chính thanh sticky
        // đang co giãn. Khoảng trễ 12px chỉ áp dụng khi cuộn ngược để mỗi chiều
        // đi qua vùng chuyển tiếp đúng một lần.
        const next = current ? window.scrollY >= trigger - 12 : window.scrollY >= trigger
        return current === next ? current : next
      })
    }
    const measure = () => {
      let node: HTMLElement | null = projectBarRef.current
      if (!node) return
      let naturalTop = 0
      while (node) {
        naturalTop += node.offsetTop
        node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null
      }
      // Khi bắt đầu cuộn, site header thu từ 64px xuống 48px. Trừ trước
      // phần chênh 16px để mốc này trùng lúc thanh chạm `top-14`.
      projectBarTriggerRef.current = Math.max(8, naturalTop - 72)
      update()
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    const scheduleMeasure = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [])

  useEffect(() => {
    if (window.sessionStorage.getItem(MATCHES_PROJECT_CHANGED_KEY) === projectId) {
      window.sessionStorage.removeItem(MATCHES_PROJECT_CHANGED_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cờ chuyển route dùng đúng một lần
      setProjectChangeRevision((revision) => revision + 1)
    }
    const inviteReturn = window.sessionStorage.getItem(MATCHES_INVITE_RETURN_KEY)
    let inviteReturnProject: string | undefined
    let inviteReturnContractors: string[] = []
    if (inviteReturn) {
      try {
        const parsed = JSON.parse(inviteReturn) as { projectId?: string; contractorIds?: string[] }
        inviteReturnProject = parsed.projectId
        inviteReturnContractors = parsed.contractorIds ?? []
      } catch {
        inviteReturnProject = inviteReturn
      }
    }
    if (inviteReturnProject === projectId) {
      window.sessionStorage.removeItem(MATCHES_INVITE_RETURN_KEY)
      setInviteReturned(true)
      setInviteFlipStage('old')
      setNewlyInvitedIds(new Set(inviteReturnContractors))
    }
    const pinned = window.sessionStorage.getItem(MATCHES_PINNED_CONTRACTOR_KEY)
    if (pinned) {
      window.sessionStorage.removeItem(MATCHES_PINNED_CONTRACTOR_KEY)
      setPinnedContractorId(pinned)
    }
    const viewed = window.sessionStorage.getItem(MATCHES_LAST_VIEWED_KEY)
    if (viewed) {
      window.sessionStorage.removeItem(MATCHES_LAST_VIEWED_KEY)
      setLastViewedId(viewed)
    }
    if (window.sessionStorage.getItem(MATCHES_JUST_ARRIVED_KEY) === projectId) {
      window.sessionStorage.removeItem(MATCHES_JUST_ARRIVED_KEY)
      setJustArrived(true)
    }
  }, [projectId])

  useEffect(() => {
    if (!inviteFlipStage) return
    const timer = window.setTimeout(
      () => setInviteFlipStage(inviteFlipStage === 'old' ? 'lock' : null),
      inviteFlipStage === 'old' ? 550 : 220
    )
    return () => window.clearTimeout(timer)
  }, [inviteFlipStage])

  /** Số đang hiện trên nhãn "Đã mời x/3" — lúc chờ lật thì chưa tính các lời mời vừa gửi. */
  const usedBeforeReturn = Math.max(0, used - (reduceMotion ? 0 : newlyInvitedIds.size))
  const shownUsed = inviteFlipStage === 'old' ? usedBeforeReturn : used
  const pillLocked = (inviteFlipStage ? usedBeforeReturn : used) >= MAX_INVITATIONS

  const orderedVisible = useMemo(() => {
    if (!pinnedContractorId) return visible
    return [...visible].sort((a, b) => Number(b.id === pinnedContractorId) - Number(a.id === pinnedContractorId))
  }, [pinnedContractorId, visible])

  /** Đổi dự án ngay trong cùng cây component vẫn tăng revision để thanh chạy lại đúng một lần. */
  const knownBriefId = useRef<string | null>(null)
  useEffect(() => {
    if (!brief) return
    if (knownBriefId.current && knownBriefId.current !== brief.id) {
      setProjectChangeRevision((revision) => revision + 1)
    }
    knownBriefId.current = brief.id
  }, [brief])

  /** Đổi chip sắp xếp → tiêu chí đang xếp nổi trong thẻ một giây (mục 4). */
  const [justSorted, setJustSorted] = useState<ContractorSort | null>(null)
  const handleSort = (next: ContractorSort) => {
    setSort(next)
    setJustSorted(next)
    window.setTimeout(() => setJustSorted(null), 1000)
  }

  /**
   * Vừa hết lượt mời → mọi nút mờ đồng loạt + nhãn cam rung một lần (mục 8). Rung khi
   * nhãn CHUYỂN sang hết lượt lúc đang xem — điển hình là quay lại từ M09 sau lời mời
   * thứ 3, rung đúng lúc số lật tới 3/3. Lần gắn đầu không rung: khi đó chưa kịp đọc cờ
   * quay lại, nhãn còn phải lật từ số cũ. Ref `null` = chưa ghi nhận lần nào, nên lần
   * chạy effect thứ hai của StrictMode cũng không rung nhầm.
   */
  const wasLockedRef = useRef<boolean | null>(null)
  const [lockShake, setLockShake] = useState(false)
  useEffect(() => {
    const was = wasLockedRef.current
    wasLockedRef.current = pillLocked
    if (pillLocked && was === false) setLockShake(true)
  }, [pillLocked])
  useEffect(() => {
    if (!lockShake) return
    const timer = window.setTimeout(() => setLockShake(false), 450)
    return () => window.clearTimeout(timer)
  }, [lockShake])

  return (
    // Bản thiết kế S12 rộng ~1500px: bó `max-w-6xl` (1152px) thì cột giữa chỉ
    // còn ~370px cho BỐN ô chỉ số, chữ bị cắt ("18 dự …", "TP. Buôn Ma Thuộ…").
    <div className='mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-4 py-8 lg:px-8'>
      {/* Thiết kế S12: tiêu đề đứng TRÊN thẻ dự án. */}
      <motion.header
        initial='hidden'
        animate='show'
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } }
        }}
        className='order-2 space-y-1 text-center'
      >
        <motion.h1
          variants={{
            hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.35 } }
          }}
          className='text-3xl font-bold tracking-tight sm:text-4xl'
        >
          {t('title')}
        </motion.h1>
        <motion.p
          variants={{
            hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.35 } }
          }}
          className='text-muted-foreground text-pretty'
        >
          {t('subtitle')}
        </motion.p>
      </motion.header>

      {preview ? (
        // Dải nhắc thay cho thẻ dự án: chưa có hồ sơ thì không có gì để hiện ở
        // đó, mà bỏ trống thì khách không hiểu vì sao nút mời lại mờ.
        <section className='border-warning/40 bg-warning/10 order-1 flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3.5 sm:px-5'>
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
        <>
          <motion.div
            ref={projectBarRef}
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: revealEase }}
            className={cn(
              'sticky top-14 z-30 order-1 transition-shadow duration-300',
              projectBarStuck && 'shadow-[0_10px_30px_-20px_rgba(42,117,63,0.5)]'
            )}
          >
            <AnimatePresence mode='wait'>
              <motion.div
                key={`${projectId}-${projectChangeRevision}`}
                initial={projectChangeRevision > 0 && !reduceMotion ? { opacity: 0, x: 14, y: -8, skewX: -2 } : false}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: revealEase }}
              >
                <ProjectContextBar
                  brief={brief}
                  condensed={projectBarStuck}
                  invitedPill={
                    <motion.span
                      title={pillLocked ? t('inviteLimitReached', { max: MAX_INVITATIONS }) : undefined}
                      initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                      animate={{
                        scale: reduceMotion ? 1 : lockShake ? [1, 1.06, 1] : 1,
                        opacity: 1,
                        x: reduceMotion ? 0 : lockShake ? [0, -6, 6, -4, 4, 0] : 0
                      }}
                      transition={{
                        // Rung dùng ba keyframe — spring chỉ nhận hai, đưa vào là motion ném
                        // lỗi và vòng lặp khung hình chết cho cả trang (quay lại sau lời mời thứ 3).
                        scale:
                          lockShake && !reduceMotion
                            ? { duration: 0.45 }
                            : { type: 'spring', bounce: reduceMotion ? 0 : 0.5, duration: reduceMotion ? 0 : 0.4 },
                        opacity: { duration: reduceMotion ? 0 : 0.4 },
                        x: { duration: reduceMotion ? 0 : 0.45 }
                      }}
                      className={cn(
                        'overflow-hidden rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        pillLocked ? 'bg-brand-orange-soft text-brand-orange' : 'bg-accent text-primary-strong'
                      )}
                    >
                      {/* Vừa mời xong quay lại → chỉ CON SỐ lật, từ số cũ sang số
                            mới (mục 2; mục 5 của M09) — bản dịch bọc số trong thẻ
                            <n>. Đổi key khi vừa quay lại để nhãn gắn lại ngay ở số
                            cũ, không lật ngược 1→0 trước. Hết lượt 3/3 → đổi cam +
                            rung một lần (mục 8). */}
                      <span className='whitespace-nowrap'>
                        <Fragment key={inviteReturned ? 'invite-return' : 'steady'}>
                          {t.rich('invitedPill', {
                            used: shownUsed,
                            max: MAX_INVITATIONS,
                            left: MAX_INVITATIONS - shownUsed,
                            n: (chunks) => <FlipValue value={chunksText(chunks)} />
                          })}
                        </Fragment>
                      </span>
                    </motion.span>
                  }
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Hàng tab vùng: nhãn bên trái, ba tab chia đều phần còn lại. */}
      <section className='order-3 flex flex-wrap items-center gap-3'>
        <span className='text-muted-foreground text-sm font-medium'>{t('regionLabel')}</span>
        <div
          className='grid min-w-0 flex-1 overflow-hidden rounded-xl border'
          style={{ gridTemplateColumns: `repeat(${Math.max(1, regions.length)}, minmax(0, 1fr))` }}
        >
          {regions.map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => setRegion(value)}
              aria-pressed={value === activeRegion}
              className={cn(
                'relative isolate px-4 py-2.5 text-sm font-medium transition-colors',
                value === activeRegion
                  ? 'text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Khối xanh trượt sang ô mới khi đổi vùng (mục 3) — overlay
                  dùng chung `layoutId`, giữ nguyên đúng nền/màu chữ gốc của
                  ô đang chọn thay vì đổi trực tiếp trên nút. */}
              {value === activeRegion ? (
                <motion.span
                  layoutId='region-pill'
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  className='bg-primary absolute inset-0 -z-10'
                />
              ) : null}
              {t(`regions.${value}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Hàng chip sắp xếp bên trái, bán kính dồn về bên phải. */}
      <motion.section
        variants={revealContainerVariants}
        initial='hidden'
        animate='show'
        className='order-4 flex flex-wrap items-center gap-x-4 gap-y-3'
      >
        <div className='flex flex-wrap items-center gap-2'>
          {CONTRACTOR_SORTS.map((key) => {
            const Icon = SORT_ICON[key]
            return (
              <motion.button
                key={key}
                variants={revealItemVariants}
                type='button'
                onClick={() => handleSort(key)}
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
              </motion.button>
            )
          })}
        </div>

        <div className='ml-auto flex w-full flex-col items-start gap-1.5 sm:items-end lg:w-auto'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground text-sm font-medium'>{t('radiusShort')}</span>
            {rules.radiusOptions.map((km) => (
              <motion.button
                key={km}
                variants={revealItemVariants}
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
              </motion.button>
            ))}
          </div>
          {/* "3 nhà thầu trong 10 km" lật số khi đổi bán kính (mục 5). */}
          <span className='text-muted-foreground overflow-hidden text-xs whitespace-nowrap'>
            <FlipValue value={t('resultsInRadius', { count: visible.length, km: radiusKm })} />
          </span>
        </div>
      </motion.section>

      <div className='order-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <div className='min-w-0 space-y-3'>
          {isPending ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className='h-40 rounded-2xl' />)
          ) : visible.length === 0 ? (
            <EmptyState title={t('empty', { km: radiusKm })} />
          ) : (
            <AnimatePresence mode='popLayout'>
              {orderedVisible.map((contractor, index) => (
                <motion.div
                  key={`${projectId}-${projectChangeRevision}-${contractor.id}`}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.82, scaleX: 0.985 }}
                  style={{ transformOrigin: 'top center' }}
                  transition={{
                    layout: { duration: reduceMotion ? 0 : 0.35, ease: revealEase },
                    opacity: { duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.06 },
                    y: { duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.06 },
                    scale: { duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.06 }
                  }}
                >
                  <ContractorCard
                    contractor={contractor}
                    projectId={projectId}
                    compared={compareIds.includes(contractor.id)}
                    onToggleCompare={toggleCompare}
                    invited={isInvited(sent, contractor.id)}
                    invitedJustNow={newlyInvitedIds.has(contractor.id)}
                    inviteLocked={inviteLocked || preview}
                    compareLocked={!compareIds.includes(contractor.id) && compareIds.length >= MAX_INVITATIONS}
                    highlightField={justSorted}
                    ringFlash={
                      (justArrived && index === 0) ||
                      lastViewedId === contractor.id ||
                      pinnedContractorId === contractor.id
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Hiện sau danh sách (mục 9). */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className='space-y-4 lg:sticky lg:top-24 lg:self-start'
        >
          <section id='matches-compare-panel-target' className='bg-card rounded-2xl border p-4'>
            <h2 className='flex items-baseline gap-2 text-sm font-semibold'>
              {t('compareTitle')}
              <span className='text-muted-foreground overflow-hidden text-xs font-normal'>
                <FlipValue value={t('compareCount', { selected: compareIds.length, max: MAX_INVITATIONS })} />
              </span>
            </h2>

            <ul id='matches-compare-list-target' className='mt-3 min-h-1 space-y-2'>
              <AnimatePresence initial={false}>
                {selected.map((contractor) => (
                  // Thiết kế S12: mỗi nhà thầu đã chọn là một hàng CÓ VIỀN, kèm
                  // điểm đánh giá bên phải — chính là con số khách dựa vào khi
                  // quyết định giữ ai lại để so sánh.
                  <motion.li
                    key={contractor.id}
                    layout
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, delay: reduceMotion ? 0 : 0.68 }}
                    className='flex items-center gap-2.5 rounded-xl border p-2.5'
                  >
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
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <p className='text-muted-foreground mt-3 text-xs'>
              {t('compareHint', { min: MIN_COMPARE, max: MAX_INVITATIONS })}
            </p>

            {/* `asChild` biến nút thành thẻ <a> — mà thẻ <a> thì `disabled` không
                có tác dụng. Chưa đủ 2 nhà thầu thì render nút thật đã khóa. Đủ
                2 → màu đầy đủ + một nhịp thở (mục 9). */}
            {compareIds.length < MIN_COMPARE ? (
              <Button className='mt-3 w-full' disabled>
                <Scale className='size-4' />
                {t('compareAction', { count: compareIds.length })}
              </Button>
            ) : (
              <motion.span
                key={compareIds.length}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.5 }}
                className='mt-3 block'
              >
                <Button asChild className='w-full'>
                  <Link href={contractorCompareRoute(projectId)}>
                    <Scale className='size-4' />
                    {t('compareAction', { count: compareIds.length })}
                  </Link>
                </Button>
              </motion.span>
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
              ].map((reason, index) => (
                // 3 dòng tick vẽ nét lần lượt; vừa tạo hồ sơ → chậm hơn để đọc
                // kịp (mục 10).
                <motion.li
                  key={reason}
                  initial={reduceMotion ? false : { opacity: 0.28, y: 4 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduceMotion ? 0 : justArrived ? 0.72 : 0.38,
                    delay: reduceMotion ? 0 : index * (justArrived ? 0.58 : 0.22),
                    ease: revealEase
                  }}
                  className='flex items-start gap-2'
                >
                  <DrawnCheck
                    delay={reduceMotion ? 0 : index * (justArrived ? 0.58 : 0.22)}
                    duration={reduceMotion ? 0 : justArrived ? 0.72 : 0.38}
                  />
                  <span className='text-pretty'>{reason}</span>
                </motion.li>
              ))}
            </ul>
          </section>
        </motion.aside>
      </div>

      {/* Có dự án thì hộp thoại đi kèm thanh dự án; xem thử (chưa có thanh) mới gắn ở đây. */}
      {preview ? <ProjectPickerDialog /> : null}
    </div>
  )
}
