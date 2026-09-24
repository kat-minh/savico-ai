'use client'

import { X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Logo } from '@/shared/components/common'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/shared/components/ui/dialog'

interface JourneyDialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function JourneyDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}: JourneyDialogShellProps) {
  const t = useTranslations('common.journey')
  const reduceMotion = useReducedMotion()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='max-h-[calc(100dvh-20px)] w-[min(1080px,calc(100vw-24px))] max-w-[1080px] gap-0 overflow-x-hidden overflow-y-auto rounded-[24px] border-0 bg-background p-0 shadow-2xl sm:max-w-[1080px] max-[899px]:inset-x-0 max-[899px]:bottom-0 max-[899px]:top-auto max-[899px]:flex max-[899px]:h-[90dvh] max-[899px]:max-h-[90dvh] max-[899px]:w-full max-[899px]:max-w-full max-[899px]:translate-x-0 max-[899px]:translate-y-0 max-[899px]:flex-col max-[899px]:overflow-hidden max-[899px]:rounded-b-none max-[899px]:rounded-t-[24px]'
      >
        <div className='relative shrink-0 bg-background px-5 pt-5 sm:px-6 sm:pt-5 max-[899px]:pb-3'>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            className='absolute top-5 left-6 hidden origin-top-left min-[900px]:block'
          >
            <Logo className='origin-top-left scale-[0.92]' tagline={t('brandTagline')} />
          </motion.div>

          <DialogClose
            aria-label={t('close')}
            className='bg-muted/80 hover:bg-muted absolute top-4 right-5 flex size-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none max-[899px]:top-3 max-[899px]:right-3 max-[899px]:size-9'
          >
            <X className='size-5' strokeWidth={2.2} />
          </DialogClose>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
            className='mx-auto max-w-[760px] pt-1 text-center min-[900px]:pt-2 max-[899px]:px-14'
          >
            <DialogTitle className='text-foreground text-[clamp(1.45rem,2.1vw,2rem)] leading-[1.15] font-extrabold tracking-[-0.025em]'>
              {title}
            </DialogTitle>
            <DialogDescription className='text-muted-foreground mt-2 text-[clamp(0.9rem,1.2vw,1rem)] leading-relaxed'>
              {description}
            </DialogDescription>
          </motion.div>
        </div>

        <div className='px-4 pt-5 sm:px-6 sm:pt-5 max-[899px]:min-h-0 max-[899px]:flex-1 max-[899px]:overflow-y-auto max-[899px]:overscroll-contain max-[899px]:px-4 max-[899px]:pt-2 max-[899px]:pb-4'>
          {children}
        </div>
        <div className='shrink-0 bg-background px-5 pt-4 pb-4 sm:px-6 max-[899px]:border-t max-[899px]:border-border/70 max-[899px]:pt-3'>
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  )
}
