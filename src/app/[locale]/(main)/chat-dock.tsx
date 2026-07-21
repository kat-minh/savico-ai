'use client'

import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ChatPanel, useProactiveChat } from '@/features/chatbot'
import { useChatContextStore } from '@/shared/chat-context'
import { AssistantDrawer } from '@/shared/components/assistant-drawer'
import { Button } from '@/shared/components/ui/button'
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
      <Button
        size='icon'
        aria-label={t('title')}
        aria-expanded={open}
        tabIndex={open ? -1 : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          'fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg transition-all duration-300',
          open && 'pointer-events-none scale-90 opacity-0'
        )}
      >
        <Bot className='size-6' />
      </Button>

      <AssistantDrawer open={open} onClose={() => setOpen(false)}>
        <ChatPanel />
      </AssistantDrawer>
    </>
  )
}
