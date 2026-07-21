'use client'

import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useChatContextStore } from '@/shared/chat-context'
import { Button } from '@/shared/components/ui/button'
import { useChatbotStore } from '../store/chatbot.store'

/**
 * Dòng "AI tự trò chuyện" trên màn chờ Bước 2 / Bước 3 (mục III.3a).
 *
 * Hiển thị vài câu gần nhất của cùng cuộc trò chuyện đang có trong khung chat
 * nổi — người dùng thấy AI nói ngay tại chỗ đang nhìn, mở khung nổi để trả lời.
 */
export function ProactiveChatStream() {
  const t = useTranslations('chatbot')
  const messages = useChatbotStore((s) => s.messages)
  const scriptStartIndex = useChatbotStore((s) => s.scriptStartIndex)
  const setPanelOpen = useChatContextStore((s) => s.setPanelOpen)

  // Chỉ lấy câu AI nói TRONG lượt chờ này — câu của bước trước không còn đúng
  // ngữ cảnh. 3 câu gần nhất là vừa đủ cho khu vực dưới vòng tiến độ.
  const recent = messages
    .slice(scriptStartIndex)
    .filter((message) => message.role === 'assistant')
    .slice(-3)
  if (recent.length === 0) return null

  return (
    <div className='mt-8 w-full max-w-md space-y-2 text-left'>
      <p className='text-muted-foreground flex items-center gap-2 text-xs'>
        <Bot className='size-3.5' />
        {t('waitingHint')}
      </p>

      {recent.map((message, index) => (
        <p
          key={message.id}
          className='bg-card/70 animate-in fade-in slide-in-from-bottom-1 rounded-2xl rounded-bl-sm border px-4 py-3 text-sm leading-relaxed duration-500'
          // Câu cũ mờ dần để mắt bám vào câu mới nhất.
          style={{ opacity: 1 - (recent.length - 1 - index) * 0.25 }}
        >
          {message.content}
        </p>
      ))}

      <Button variant='link' size='sm' className='h-auto px-0 text-xs' onClick={() => setPanelOpen(true)}>
        {t('openPanel')}
      </Button>
    </div>
  )
}
