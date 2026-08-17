'use client'

import { Layout } from 'antd'
import { useState, type ReactNode } from 'react'

import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'

const { Content } = Layout

/**
 * Khung khu quản trị: menu trái cố định + thanh trên dính + vùng nội dung.
 *
 * Tách hẳn khỏi khung site công khai (`(main)/layout.tsx`) theo đúng cách route
 * group hoạt động — khu quản trị không có header/footer/chatbox của khách, và
 * Ant Design chỉ nạp trong nhánh này.
 */
export function AdminShell({ children, userSlot }: { children: ReactNode; userSlot?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout hasSider style={{ minHeight: '100svh' }}>
      <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AdminHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} userSlot={userSlot} />
        <Content style={{ padding: 20 }}>
          <div style={{ maxWidth: 1440, margin: '0 auto' }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  )
}
