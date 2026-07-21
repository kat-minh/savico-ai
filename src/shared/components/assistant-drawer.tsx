'use client'

import type { ReactNode } from 'react'
import { Bot, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface AssistantDrawerProps {
  open: boolean
  onClose: () => void
  /** The chat content, injected by the app layer (`features/chatbot`). */
  children: ReactNode
}

/**
 * Right-side AI chatbot drawer shell (Trello-style). Owns the slide-in chrome —
 * title bar and close button — and hosts whatever chat UI the app layer injects.
 * Kept feature-agnostic so `shared/` never imports `features/`.
 */
export function AssistantDrawer({ open, onClose, children }: AssistantDrawerProps) {
  const t = useTranslations('assistant')

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'bg-background/85 fixed top-16 right-0 bottom-0 z-30 flex w-full max-w-[380px] flex-col border-l shadow-xl backdrop-blur-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      )}
    >
      <header className='flex items-center gap-3 border-b px-4 py-3'>
        <div className='bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full'>
          <Bot className='size-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold'>{t('title')}</p>
          <p className='text-muted-foreground truncate text-xs'>{t('subtitle')}</p>
        </div>
        <Button variant='ghost' size='icon' onClick={onClose} aria-label={t('close')}>
          <X className='size-4' />
        </Button>
      </header>
      <div className='min-h-0 flex-1 p-3'>{children}</div>
    </aside>
  )
}
