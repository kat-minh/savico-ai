'use client'

import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ChatPanel, useProactiveChat } from '@/features/chatbot'
import { useChatContextStore } from '@/shared/chat-context'
import { AssistantDrawer } from '@/shared/components/assistant-drawer'
import { cn } from '@/shared/lib/utils'

/**
 * Chatbox AI nổi ở góc phải dưới trên mọi màn hình (quy ước xuyên suốt, mục I).
 * App-layer glue: `shared/` may not import `features/chatbot`, so the drawer
 * shell lives in shared and the chat content is injected here.
 *
 * Cũng là nơi DUY NHẤT chạy kịch bản "AI tự trò chuyện lúc chờ" (mục III.3a) —
 * component này luôn mounted trong layout nên kịch bản không bị chạy lặp.
 */
export function ChatDock() {
  const t = useTranslations('assistant')
  const open = useChatContextStore((s) => s.panelOpen)
  const setOpen = useChatContextStore((s) => s.setPanelOpen)

  useProactiveChat()

  return (
    <>
      {/* Khi drawer mở, nút nổi phải rút đi: nó nằm đúng chỗ ô nhập và nút Gửi
          của khung chat. Đóng drawer bằng nút X trên đầu drawer. */}
      <button
        type='button'
        aria-label={t('title')}
        aria-expanded={open}
        tabIndex={open ? -1 : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          'fixed right-6 bottom-6 z-40 flex cursor-pointer flex-col items-center drop-shadow-lg transition-transform duration-300 hover:scale-105',
          open && 'pointer-events-none scale-90 opacity-0'
        )}
      >
        {/* Một khối liền: tròn robot phía trên, nhãn cùng màu dính bên dưới (đè lên nhau). */}
        <span className='brand-gradient text-primary-foreground relative z-10 flex size-14 items-center justify-center rounded-full'>
          <Bot className='size-7' />
        </span>
        <span className='brand-gradient text-primary-foreground -mt-3 rounded-full px-3 pt-3.5 pb-1 text-[0.7rem] font-semibold'>
          {t('fab')}
        </span>
      </button>

      <AssistantDrawer open={open} onClose={() => setOpen(false)}>
        <ChatPanel />
      </AssistantDrawer>
    </>
  )
}
