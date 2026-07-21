'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/shared/auth'
import { useChatContextStore } from '@/shared/chat-context'
import { chatbotApi } from '../api/chatbot.api'
import { CHAT_DAILY_LIMIT } from '../constants/chatbot.constants'
import { getServerCount, getTodayCount, incrementTodayCount, subscribeUsage } from '../services/chat-quota'
import { useChatbotStore } from '../store/chatbot.store'

/**
 * Conversation state for the assistant. Messages live in `useChatbotStore` so
 * the floating panel and the waiting-screen stream show the same conversation
 * (mục III.3a); no history is persisted, per spec.
 *
 * Enforces a per-day message quota (UX guard): 30/day for customers, 10/day for
 * guests. Câu AI tự nói trong lúc chờ không tính vào hạn mức.
 */
export function useChat() {
  const t = useTranslations('chatbot')
  const { isAuthenticated } = useAuth()
  const messages = useChatbotStore((s) => s.messages)
  const append = useChatbotStore((s) => s.append)
  const used = useSyncExternalStore(subscribeUsage, getTodayCount, getServerCount)

  const dailyLimit = isAuthenticated ? CHAT_DAILY_LIMIT.customer : CHAT_DAILY_LIMIT.guest
  const remaining = Math.max(0, dailyLimit - used)
  const limitReached = remaining <= 0

  // Lời chào mở đầu — thêm một lần khi hội thoại còn trống.
  useEffect(() => {
    if (useChatbotStore.getState().messages.length === 0) {
      append({ role: 'assistant', content: t('greeting'), proactive: true })
    }
  }, [append, t])

  const mutation = useMutation({
    mutationFn: (text: string) => chatbotApi.sendMessage(text, useChatContextStore.getState().context),
    onSuccess: (reply) => append({ role: 'assistant', content: reply })
  })

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || mutation.isPending) return
      if (getTodayCount() >= dailyLimit) return
      incrementTodayCount()
      append({ role: 'user', content: trimmed })
      mutation.mutate(trimmed)
    },
    [mutation, dailyLimit, append]
  )

  return {
    messages,
    send,
    isReplying: mutation.isPending,
    remaining,
    dailyLimit,
    limitReached
  }
}
