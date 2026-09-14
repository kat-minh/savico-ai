'use client'

import { ArrowRight, House } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'

export interface HomeCtaResumeProject {
  id: string
  name: string
  href: string
  /** Chỉ 3 trạng thái dở — dự án hoàn tất thì không còn là "dự án dở" nữa. */
  status: 'input' | 'designing' | 'review'
}

interface HomeCtaProps {
  onCreateProject?: () => void
  resumeProject?: HomeCtaResumeProject | null
  /** Đã bấm "Tạo dự án" ở một section khác của trang thì không lặp vệt sáng nữa. */
  skipShine?: boolean
}

/**
 * Dải chuyển đổi cuối trang chủ — "Sẵn sàng bắt đầu dự án của bạn?".
 *
 * Nền xanh RẤT nhạt chứ không phải dải xanh đặc như hai khối trên: đây là lời
 * mời cuối cùng, đứng ngay trên chân trang tối màu, nên phải nhẹ hơn để không
 * đấu màu với footer.
 *
 * ★ Khung hiện dần, icon ngôi nhà nhún 1 lần, nút hiện sau cùng kèm vệt sáng
 * lướt qua đúng 1 lần — trừ khi đã bấm "Tạo dự án" ở chỗ khác của trang rồi.
 * Có dự án dở → đổi hẳn nội dung + nút sang "Mở tiếp dự án".
 */
export function HomeCta({ onCreateProject, resumeProject, skipShine }: HomeCtaProps) {
  const t = useTranslations('landing.cta')

  return (
    <section id='home-cta' className='mx-auto w-full max-w-[90rem] px-4 pb-14 lg:px-8 lg:pb-16'>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
        className='bg-primary/8 border-primary/15 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border px-6 py-5'
      >
        <motion.span
          initial={{ scale: 1 }}
          whileInView={{ scale: [1, 1.15, 1] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className='bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl'
        >
          <House className='size-6' strokeWidth={1.75} />
        </motion.span>

        <div className='min-w-0 flex-1'>
          <p className='font-bold'>{resumeProject ? t('resumeTitle', { name: resumeProject.name }) : t('title')}</p>
          <p className='text-muted-foreground text-sm text-pretty'>
            {resumeProject ? t(`byStatus.${resumeProject.status}`) : t('subtitle')}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className='relative shrink-0 overflow-hidden rounded-full'
        >
          {resumeProject ? (
            <Button asChild className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'>
              <Link href={resumeProject.href}>
                {t('resumeAction')}
                <ArrowRight className='size-4' />
              </Link>
            </Button>
          ) : (
            <Button
              className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'
              onClick={onCreateProject}
            >
              {t('action')}
              <ArrowRight className='size-4' />
            </Button>
          )}

          {skipShine ? null : (
            <motion.span
              aria-hidden
              initial={{ x: '-130%' }}
              whileInView={{ x: '230%' }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.85, delay: 0.55, ease: 'easeInOut' }}
              className='pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-white/30'
            />
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}
