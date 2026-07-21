'use client'

import { create } from 'zustand'

import type { ChatMessage } from '../types/chatbot.types'

interface ChatbotStore {
  messages: ChatMessage[]
  /** Kịch bản chủ động đã chạy cho lượt chờ nào — tránh nói lại khi remount. */
  playedScript: string | null
  /**
   * Mốc bắt đầu lượt chờ hiện tại: chỉ những câu SAU mốc này mới thuộc kịch bản
   * đang chạy, nên màn chờ Bước 3 không hiện lại câu AI đã nói ở Bước 2.
   */
  scriptStartIndex: number
  append: (message: Omit<ChatMessage, 'id' | 'at'>) => void
  markScriptPlayed: (key: string) => void
  reset: () => void
}

let sequence = 0

/**
 * Hội thoại của chatbox AI. Nằm ở store (không phải state cục bộ) vì cùng một
 * cuộc trò chuyện xuất hiện ở hai chỗ: khung nổi góc phải dưới và dòng "AI tự
 * trò chuyện" trên màn chờ Bước 2 / Bước 3 (mục III.3a).
 *
 * Không persist — spec không lưu lịch sử chat.
 */
export const useChatbotStore = create<ChatbotStore>()((set) => ({
  messages: [],
  playedScript: null,
  scriptStartIndex: 0,

  append: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: `msg-${++sequence}`, at: new Date().toISOString() }]
    })),

  markScriptPlayed: (key) => set((state) => ({ playedScript: key, scriptStartIndex: state.messages.length })),

  reset: () => set({ messages: [], playedScript: null, scriptStartIndex: 0 })
}))
