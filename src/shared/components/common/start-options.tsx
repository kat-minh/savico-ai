'use client'

import { ArrowRight, CalendarClock, CircleCheck, Gift, HardHat, Search, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLayoutEffect, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { useCmsCollection, type PlanGift } from '@/shared/cms'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { ROUTES } from '@/shared/constants/routes'
import { TurnkeyRequestDialog } from './turnkey-request-dialog'
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
  // Quà tặng lấy từ kho nội dung (gói nào có quà thì dùng gói đó) — admin sửa
  // một chỗ là cả S01, S02 lẫn thẻ này đổi theo.
  const gift = useCmsCollection('plans').find((plan) => plan.gift)?.gift
  const t = useTranslations('contractors.start')
  const [turnkeyOpen, setTurnkeyOpen] = useState(false)

  return (
    // Hình S08 đo theo pixel: khe giữa hai thẻ là 13.25px trên 529.5px bề ngang
    // cụm ba thẻ = 2.5%. Để phần trăm để tỉ lệ giữ nguyên ở mọi khổ màn.
    <ul className='grid items-stretch gap-x-[2.5%] gap-y-6 pt-4 md:grid-cols-3'>
      <OptionCard
        index={1}
        icon={Search}
        title={t('find.title')}
        subtitle={t('find.subtitle')}
        points={[t('find.p1'), t('find.p2'), t('find.p3'), t('find.p4'), t('find.p5'), t('find.p6')]}
        action={<OptionButton className='brand-green-button' href={findHref} label={t('find.action')} />}
      />

      <OptionCard
        index={2}
        icon={HardHat}
        highlighted
        title={t('turnkey.title')}
        subtitle={t('turnkey.subtitle')}
        points={[t('turnkey.p1'), t('turnkey.p2'), t('turnkey.p3'), t('turnkey.p4'), t('turnkey.p5')]}
        gift={gift}
        action={
          <>
            {/* S08: "Đăng ký triển khai → form đăng ký, Ops liên hệ" — nút mở
                form thật, không còn chỉ bắn toast. */}
            <OptionButton
              className='brand-orange-button'
              label={t('turnkey.action')}
              onClick={() => setTurnkeyOpen(true)}
            />
            <TurnkeyRequestDialog open={turnkeyOpen} onOpenChange={setTurnkeyOpen} />
          </>
        }
      />

      <OptionCard
        index={3}
        icon={CalendarClock}
        title={t('expert.title')}
        subtitle={t('expert.subtitle')}
        points={[t('expert.p1'), t('expert.p2'), t('expert.p3'), t('expert.p4')]}
        action={
          // Hình S08: nút của Lựa chọn 3 là nút VIỀN XANH, chữ xanh (không phải
          // viền xám mặc định).
          <OptionButton
            variant='outline'
            className='border-primary text-primary-strong hover:bg-accent border-[1.5px]'
            href={ROUTES.CONSULT}
            label={t('expert.action')}
          />
        }
      />
    </ul>
  )
}

/**
 * Nút đáy thẻ — Hình S08: chữ CANH GIỮA thẻ còn mũi tên DÍNH LỀ PHẢI, nên mũi
 * tên phải nằm tuyệt đối chứ không đi kèm chữ trong cùng một flexbox.
 */
function OptionButton({
  label,
  href,
  onClick,
  className,
  variant
}: {
  label: string
  href?: string
  onClick?: () => void
  className?: string
  variant?: 'outline'
}) {
  const content = (
    <>
      {label}
      <ArrowRight className='absolute right-4 size-4' />
    </>
  )
  // `px-10` giữ chỗ cho mũi tên ở cả HAI bên: chữ canh giữa nên chỉ chừa lề
  // phải thì nhãn dài (bản EN "Register for full delivery") sẽ đè lên mũi tên.
  const classes = cn('relative h-12 w-full justify-center px-10 text-sm font-bold tracking-wide uppercase', className)

  if (href) {
    return (
      <Button asChild variant={variant} className={classes}>
        <Link href={href}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button variant={variant} className={classes} onClick={onClick}>
      {content}
    </Button>
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
          bị bóp lại thành ba cột hẹp.

          `max-h-[92dvh]` + bản gọn của {@link StartOptions}: cốt để hộp thoại
          nằm trọn trong màn hình, không đẻ ra thanh cuộn. `dvh` chứ không `vh`
          vì trên di động thanh địa chỉ thu vào/nhả ra làm `vh` sai. */}
      <DialogContent className='max-h-[92dvh] sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>
        <ScaleToFit>
          <StartOptions findHref={findHref} />
        </ScaleToFit>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Thu nhỏ nguyên khối con cho vừa màn hình.
 *
 * Ba lựa chọn ở S08 vốn là một phần của TRANG nên cao bao nhiêu cũng được; nhét
 * vào hộp thoại ở S11 thì cao quá màn và đẻ ra thanh cuộn — đúng thứ popup này
 * sinh ra để tránh. Cách xử lý là THU NHỎ ĐỀU bằng `transform: scale`, giữ
 * nguyên mọi tỉ lệ và cỡ chữ tương đối, thay vì đi sửa từng class (sửa từng
 * class là đổi thiết kế, không phải thu nhỏ).
 *
 * `transform` không làm co chỗ nó chiếm trong luồng bố cục, nên lớp bọc ngoài
 * phải tự đặt lại chiều cao = chiều cao thật × hệ số; thiếu bước này thì hộp
 * thoại vẫn chừa khoảng trống bằng kích thước gốc.
 */
function ScaleToFit({ children }: { children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null)
  const [{ scale, height }, setBox] = useState({ scale: 1, height: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const node = inner.current
      const dialog = node?.closest('[role="dialog"]')
      if (!node || !(dialog instanceof HTMLElement)) return

      const natural = node.offsetHeight
      if (!natural) return

      // Chỗ còn lại = trần chiều cao hộp thoại − phần đã dùng phía trên khối này
      // − lề dưới của hộp thoại.
      const ceiling = window.innerHeight * 0.92
      const used = node.getBoundingClientRect().top - dialog.getBoundingClientRect().top
      const padBottom = Number.parseFloat(getComputedStyle(dialog).paddingBottom) || 0
      // Trừ hao 4px: `max-h-[92dvh]` ra số lẻ (vd 619.712px) nên chỉ cần dôi
      // NỬA pixel là `overflow-y: auto` của hộp thoại đã bật thanh cuộn.
      const next = Math.min(1, (ceiling - used - padBottom - 4) / natural)

      setBox({ scale: next, height: Math.floor(natural * next) })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div style={{ height: height || undefined }}>
      <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        {children}
      </div>
    </div>
  )
}

function OptionCard({
  index,
  icon: Icon,
  title,
  subtitle,
  points,
  action,
  gift,
  highlighted = false
}: {
  index: number
  icon: typeof Search
  title: string
  subtitle: string
  points: string[]
  action: React.ReactNode
  /** Quà tặng in trong thẻ "Triển khai trọn gói" (Hình S08). */
  gift?: PlanGift
  highlighted?: boolean
}) {
  const t = useTranslations('contractors.start')
  const tGift = useTranslations('plans.gift')

  return (
    <li className='relative flex'>
      {/* Hình S08: thẻ giữa KHÔNG có viên nhãn "Lựa chọn 2" — thay vào đó là một
          viên nhãn cam vắt ngang mép trên. Đo trên ảnh: viên nhãn rộng 109px
          trên thẻ rộng 172px = 63%, tức nó ÔM LẤY CHỮ và canh giữa, không kéo
          dài gần hết bề ngang thẻ (ghi chú "266/279" của bản trước đo sai, nên
          hai bên thừa một mảng cam trống). Cao 14px trên ảnh = 28px khổ thật,
          nhô lên khỏi mép thẻ 4px = 8px. */}
      {highlighted ? (
        <span className='bg-brand-orange text-brand-orange-foreground absolute -top-2 left-1/2 z-10 inline-flex -translate-x-1/2 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase'>
          <Star className='size-3 fill-current' />
          {t('popular')}
        </span>
      ) : null}

      <section
        className={cn(
          'bg-card flex w-full flex-col rounded-2xl border p-4',
          highlighted ? 'border-brand-orange pt-7 shadow-md' : 'border-border pt-5'
        )}
      >
        {/* Hình S08: nhãn "LỰA CHỌN n" là viên nhãn CÓ VIỀN, canh giữa; tiêu đề
            và câu dẫn cũng canh giữa. Thẻ 1 tiêu đề màu chữ thường, thẻ 2 màu
            cam, thẻ 3 màu xanh thương hiệu. */}
        {highlighted ? null : (
          <span className='text-muted-foreground mx-auto rounded-md border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase'>
            {t('option', { index })}
          </span>
        )}

        <div className={cn('text-center', highlighted ? '' : 'mt-3')}>
          <h3
            className={cn(
              'text-lg leading-tight font-bold text-pretty',
              highlighted ? 'text-brand-orange' : index === 3 ? 'text-primary-strong' : 'text-foreground'
            )}
          >
            {title}
          </h3>
          <p className='text-muted-foreground mt-1.5 text-xs leading-relaxed text-pretty'>{subtitle}</p>
        </div>

        {/* CHỖ CHỜ ASSET: hình minh hoạ của lựa chọn — ảnh 3D nền trắng, rộng
            bằng phần trong của thẻ.

            Ba con số đo trên Hình S08 quyết định bộ class dưới đây:
            - thẻ 1: khung 139×103px trên bề ngang trong thẻ 139px → 4:3 (bản
              trước để 3:2, đó là chỗ "tỉ lệ asset khác ảnh");
            - ảnh CO GIÃN theo chỗ trống: thẻ 1 có 6 ý nên khung cao 103px, thẻ
              3 chỉ 4 ý nên khung cao 136px — đúng bằng phần dôi ra. Nên khung
              phải `grow`, và danh sách ý KHÔNG được `flex-1`, nếu không chỗ
              trống dồn xuống thành khoảng hở trước nút như bản trước;
            - nhưng chỉ giãn tới 30–41% chiều cao thẻ (103/341 và 136/333), nên
              chặn `max-h-[40%]` — bỏ chặn thì thẻ 3 phình thành khung dọc. */}
        <div className='bg-muted/30 mt-3 flex aspect-[4/3] max-h-[40%] w-full grow items-center justify-center rounded-xl border border-dashed'>
          <Icon className='text-muted-foreground/50 size-8' />
        </div>

        {/* Hình S08: các ý cách nhau ~17px trên thẻ rộng 157px = ~37px ở khổ
            thật; `space-y-3` (12px) làm danh sách bó lại so với ảnh. */}
        <ul className='mt-4 space-y-4'>
          {points.map((point) => (
            <li key={point} className='flex items-start gap-2.5 text-sm'>
              {/* Hình S08: dấu tick nằm TRONG VÒNG TRÒN — thẻ thường là vòng
                  tròn viền xanh, thẻ nổi bật là vòng tròn cam ĐẶC, tick trắng. */}
              <CircleCheck
                className={cn('mt-0.5 size-4 shrink-0', highlighted ? 'fill-brand-orange text-white' : 'text-primary')}
              />
              <span className='text-pretty'>{point}</span>
            </li>
          ))}
        </ul>

        {/* Hình S08: thẻ "Triển khai trọn gói" có khối ĐẶC QUYỀN DÀNH RIÊNG —
            hộp quà bên TRÁI, chữ canh trái bên phải, rồi dòng điều kiện in
            nghiêng chạy hết bề ngang khối. */}
        {gift ? (
          <section className='bg-brand-orange-soft/70 mt-4 rounded-xl p-3'>
            <div className='flex items-start gap-3'>
              {/* CHỖ CHỜ ASSET: hộp quà 3D của khách. */}
              <Gift className='text-brand-orange mt-0.5 size-10 shrink-0' strokeWidth={1.75} />
              <div className='min-w-0 flex-1'>
                <p className='text-brand-orange text-[11px] font-bold tracking-wide uppercase'>{t('exclusive')}</p>
                <p className='mt-0.5 text-xs leading-relaxed text-pretty'>
                  {gift.title} {tGift('valuePrefix')}{' '}
                  <span className='text-brand-orange font-extrabold uppercase'>
                    {/* `shared/` không được import từ `features/`, nên quy đổi triệu
                        tính tại chỗ thay vì gọi service của feature `plans`. */}
                    {gift.value % 1_000_000 === 0
                      ? `${gift.value / 1_000_000} ${tGift('valueMillionsUnit')}`
                      : new Intl.NumberFormat('vi-VN').format(gift.value) + 'đ'}
                  </span>
                </p>
              </div>
            </div>
            <p className='text-muted-foreground mt-2 text-[10px] leading-relaxed text-pretty italic'>
              {gift.conditions}
            </p>
          </section>
        ) : null}

        {/* `mt-auto` chứ không phải `mt-5`: danh sách ý không còn `flex-1` nên
            phải có thứ khác ghim nút xuống đáy, nếu không ba nút lệch nhau theo
            số ý của từng thẻ. Hình S08: ba nút thẳng hàng. */}
        <div className='mt-auto pt-5'>{action}</div>
      </section>
    </li>
  )
}
