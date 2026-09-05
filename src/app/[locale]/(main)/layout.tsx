import type { ReactNode } from 'react'

import { SiteFooter } from '@/shared/layouts'
import { ChatDock } from '../chat-dock'
import { MainChrome } from './main-chrome'
import { FooterCreateProjectLink } from './main-footer'

/**
 * Khung chung cho mọi trang (mục I + II.1): thanh công cụ cố định trên cùng,
 * footer nền tối, chatbox AI nổi ở góc phải dưới.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-svh flex-col'>
      <MainChrome />
      <main className='flex-1'>{children}</main>
      <SiteFooter createProjectAction={<FooterCreateProjectLink />} />
      <ChatDock />
    </div>
  )
}
