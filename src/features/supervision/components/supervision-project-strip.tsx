'use client'

import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useSiteImage } from '@/shared/cms'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { ROUTES, supervisionRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDayMonth } from '@/shared/utils'
import { useSupervisionProject } from '../hooks/use-supervision'
import { currentStage, daysUntil, handoverDrift, progressPercent } from '../services/supervision.service'

interface SupervisionProjectStripProps {
  projectId: string
}

/**
 * Dải "GÓI AN TÂM · GIÁM SÁT" gắn vào ĐÁY thẻ dự án ở trang Tài khoản (S24).
 *
 * Dựng ở `features/supervision` rồi truyền vào `features/design` qua slot ở lớp
 * app: hai feature không được import lẫn nhau, mà thẻ dự án thì thuộc về luồng
 * thiết kế còn số liệu giám sát thì không.
 *
 * Bố cục theo Hình S24: chữ ở cột trái, ẢNH HIỆN TRƯỜNG của giai đoạn đang chạy
 * ở cột phải — dải này là phần dưới của một thẻ dự án vốn đã có ảnh bìa bên
 * trái, nên nếu chỉ có chữ thì nửa dưới thẻ trông hụt hẳn một bên.
 *
 * Dự án chưa mua gói: R8 — nút "Chọn cách quản lý thi công" đi thẳng tới tab Gói
 * giám sát, không popup, không trang trung gian.
 */
export function SupervisionProjectStrip({ projectId }: SupervisionProjectStripProps) {
  const t = useTranslations('supervision.account')
  const tStages = useTranslations('supervision.stages')
  // Hình S24 rút gọn tên giai đoạn ("Kỹ thuật & chống thấm") để dòng "Giai đoạn
  // 4/6 · … · Còn 16 ngày" nằm gọn MỘT dòng cạnh tấm ảnh; tên đầy đủ theo R5
  // vẫn dùng ở bảng điều khiển, nơi có cả chiều ngang.
  const tStagesShort = useTranslations('supervision.stagesShort')
  const tAlias = useTranslations('supervision.tierAlias')

  const { data: project, isPending } = useSupervisionProject(projectId)
  // Hook phải chạy trước mọi nhánh return; giai đoạn chưa có thì rơi về ảnh
  // giai đoạn đầu, ảnh này chỉ hiện khi đã có dự án.
  const stagePhoto = useSiteImage(`supervision.${project ? currentStage(project).key : 'legal'}`)

  if (isPending) return null

  if (!project) {
    return (
      <div className='relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-dashed p-4'>
        <p className='text-muted-foreground text-xs text-pretty'>{t('selfManaged')}</p>
        <Button asChild size='sm' variant='outline'>
          <Link href={ROUTES.PLANS_SUPERVISION}>{t('chooseManagement')}</Link>
        </Button>
      </div>
    )
  }

  const stage = currentStage(project)
  const percent = progressPercent(project)
  const remaining = daysUntil(stage.plannedEnd)
  const drift = handoverDrift(project)

  return (
    // `relative z-10`: thẻ dự án phủ một lớp bấm được lên toàn bộ diện tích
    // (`after:inset-0`), không nâng dải này lên thì bấm nút ở đây lại mở dự án.
    <div className='relative z-10 flex flex-1 gap-3 border-t border-dashed p-3'>
      {/* `justify-between`: khi thẻ chiếm hai hàng (Hình S24) khối này giãn ra
          cho bằng một hàng, chữ phải rải đều theo chiều cao chứ không dồn cục
          lên trên rồi chừa một khoảng trắng dưới nút. */}
      <div className='flex min-w-0 flex-1 flex-col justify-between gap-2.5'>
        <p className='text-brand-orange flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase'>
          <ShieldCheck className='size-4' />
          {tAlias(project.packageTier)} · {t('stripTitle')}
        </p>

        <p className='text-xs'>
          {t('stage', { current: stage.index })} · {tStagesShort(stage.key)} · {t('daysLeft', { days: remaining })}
        </p>

        {/* Sợi chỉ 6 nút — bản rút gọn của sợi chỉ trong bảng điều khiển. */}
        <ol className='flex items-center gap-1'>
          {project.stages.map((item, index) => {
            const next = project.stages[index + 1]

            return (
              <li key={item.key} className='flex flex-1 items-center gap-1'>
                <span
                  title={tStages(item.key)}
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
                    item.status === 'confirmed' && 'bg-primary text-primary-foreground',
                    item.status === 'inProgress' && 'bg-brand-orange text-brand-orange-foreground',
                    item.status === 'upcoming' && 'border-border text-muted-foreground border'
                  )}
                >
                  {item.status === 'confirmed' ? <Check className='size-2.5' strokeWidth={3.5} /> : item.index}
                </span>
                {next ? (
                  // Đoạn nối mang màu của nút PHÍA SAU nó, không phải nút phía
                  // trước (Hình S24): đoạn dẫn vào giai đoạn đang chạy tô cam,
                  // nên mắt đi theo sợi chỉ là dừng đúng chỗ đang làm.
                  <span
                    aria-hidden
                    className={cn(
                      'h-0.5 flex-1 rounded-full',
                      next.status === 'confirmed' && 'bg-primary',
                      next.status === 'inProgress' && 'bg-brand-orange',
                      next.status === 'upcoming' && 'bg-border'
                    )}
                  />
                ) : null}
              </li>
            )
          })}
        </ol>

        <p className='text-muted-foreground text-xs'>
          {t('progress', { percent })} ·{' '}
          <span className={cn(drift.early ? 'text-primary-strong' : 'text-destructive')}>
            {t(drift.early ? 'aheadOfPlan' : 'behindPlan')}
          </span>{' '}
          · {t('handoverInline', { date: formatDayMonth(project.handoverDate, { year: true }) })}
        </p>

        <Button
          asChild
          size='sm'
          // `self-start`: cột chữ là flex-col nên nút mặc định giãn hết bề
          // ngang; Hình S24 để nút ôm sát chữ.
          className='bg-brand-orange text-brand-orange-foreground hover:bg-brand-orange/90 mt-1 self-start bg-none shadow-none'
        >
          <Link href={supervisionRoute(project.id)}>
            {t('open')}
            <ArrowRight className='size-3.5' />
          </Link>
        </Button>
      </div>

      {/* Ảnh giai đoạn đang chạy, cùng bề rộng với ảnh bìa ở nửa trên thẻ nên
          hai tấm thẳng hàng nhau theo mép phải. */}
      <Photo
        className='w-[31%] shrink-0 self-stretch rounded-lg'
        src={stagePhoto}
        alt={tStages(stage.key)}
        sizes='200px'
      />
    </div>
  )
}
