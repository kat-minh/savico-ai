'use client'

import { CalendarClock, Check, HardHat, Search, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'

interface StartOptionsProps {
  /** Đích của lựa chọn 1 — trang nhà thầu đề xuất của dự án vừa tạo (S12). */
  findHref: string
}

/**
 * Ba lựa chọn "Bạn muốn bắt đầu như thế nào?" — khối chung của S08 và S11 (R7).
 *
 * Nằm ở `shared/` vì HAI feature dùng nó: `checkout` hiển thị sau khi thanh toán
 * xong (S08) và `contractors` mở nó sau khi chốt hồ sơ ở Bước 2 (S11) — mà hai
 * feature thì không được import lẫn nhau.
 *
 * Bản mô tả gọi đây là "popup" nhưng ở S08 nó là một phần của trang Hoàn tất.
 * Nên component tách làm hai: {@link StartOptions} là ba thẻ (dùng inline ở S08)
 * và {@link StartOptionsDialog} bọc chúng trong hộp thoại (dùng ở S11). Cùng một
 * nội dung, hai bối cảnh, không phải hai bản dựng.
 */
export function StartOptions({ findHref }: StartOptionsProps) {
  const t = useTranslations('contractors.start')

  return (
    <ul className='grid items-stretch gap-4 pt-3 md:grid-cols-3'>
      <OptionCard
        index={1}
        icon={Search}
        title={t('find.title')}
        subtitle={t('find.subtitle')}
        points={[t('find.p1'), t('find.p2'), t('find.p3'), t('find.p4'), t('find.p5')]}
        action={
          <Button asChild className='w-full'>
            <Link href={findHref}>{t('find.action')}</Link>
          </Button>
        }
      />

      <OptionCard
        index={2}
        icon={HardHat}
        highlighted
        title={t('turnkey.title')}
        subtitle={t('turnkey.subtitle')}
        points={[t('turnkey.p1'), t('turnkey.p2'), t('turnkey.p3'), t('turnkey.p4'), t('turnkey.p5')]}
        action={
          <Button className='w-full' onClick={() => toast.success(t('turnkeyRegistered'))}>
            {t('turnkey.action')}
          </Button>
        }
      />

      <OptionCard
        index={3}
        icon={CalendarClock}
        title={t('expert.title')}
        subtitle={t('expert.subtitle')}
        points={[t('expert.p1'), t('expert.p2'), t('expert.p3')]}
        action={
          <Button asChild variant='outline' className='w-full'>
            <Link href={ROUTES.CONSULT}>{t('expert.action')}</Link>
          </Button>
        }
      />
    </ul>
  )
}

interface StartOptionsDialogProps extends StartOptionsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Bản hộp thoại — dùng sau khi khách chốt hồ sơ ở Bước 2 (S11, R7). */
export function StartOptionsDialog({ open, onOpenChange, findHref }: StartOptionsDialogProps) {
  const t = useTranslations('contractors.start')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `sm:` là bắt buộc: DialogContent của shadcn đã có `sm:max-w-lg`, một
          class `max-w-4xl` trần sẽ thua nó từ breakpoint sm trở lên và hộp thoại
          bị bóp lại thành ba cột hẹp. */}
      <DialogContent className='sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>
        <StartOptions findHref={findHref} />
      </DialogContent>
    </Dialog>
  )
}

function OptionCard({
  index,
  icon: Icon,
  title,
  subtitle,
  points,
  action,
  highlighted = false
}: {
  index: number
  icon: typeof Search
  title: string
  subtitle: string
  points: string[]
  action: React.ReactNode
  highlighted?: boolean
}) {
  const t = useTranslations('contractors.start')

  return (
    <li className='relative flex'>
      {highlighted ? (
        <span className='bg-brand-orange text-brand-orange-foreground absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap'>
          <Star className='size-3' />
          {t('popular')}
        </span>
      ) : null}

      <section
        className={cn(
          'bg-card flex w-full flex-col rounded-2xl border p-5',
          highlighted ? 'border-brand-orange shadow-md' : 'border-border'
        )}
      >
        <span className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
          {t('option', { index })}
        </span>

        <div className='mt-2 flex items-start gap-3'>
          <span className='bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-xl'>
            <Icon className='size-5' />
          </span>
          <div className='min-w-0'>
            <h3 className='text-base leading-tight font-semibold text-pretty'>{title}</h3>
            <p className='text-muted-foreground mt-1 text-xs text-pretty'>{subtitle}</p>
          </div>
        </div>

        <ul className='mt-4 flex-1 space-y-2'>
          {points.map((point) => (
            <li key={point} className='flex items-start gap-2 text-sm'>
              <Check className='text-primary mt-0.5 size-4 shrink-0' strokeWidth={2.5} />
              <span className='text-pretty'>{point}</span>
            </li>
          ))}
        </ul>

        <div className='mt-5'>{action}</div>
      </section>
    </li>
  )
}
