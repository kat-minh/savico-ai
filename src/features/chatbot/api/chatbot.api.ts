import type { ProjectChatContext } from '@/shared/chat-context'
import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import { mockChatbotApi } from './chatbot.mock'

const realChatbotApi = {
  /** Ngữ cảnh dự án gửi kèm để AI trả lời theo dữ liệu thật (mục III.3a). */
  sendMessage: (message: string, context: ProjectChatContext | null) =>
    http.post<string>('/chatbot/messages', { message, context })
}

export const chatbotApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockChatbotApi : realChatbotApi
