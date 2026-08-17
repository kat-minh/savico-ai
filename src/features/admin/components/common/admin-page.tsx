'use client'

import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'

const { Title, Paragraph } = Typography

/**
 * Đầu trang dùng chung cho mọi màn quản trị: tiêu đề, một dòng giải thích màn
 * này sửa cái gì trên site, và chỗ đặt nút hành động.
 *
 * Dòng mô tả không phải trang trí — người vận hành cần biết sửa ở đây thì KHÁCH
 * thấy đổi ở đâu, nên mỗi màn đều nói rõ điều đó.
 */
export function AdminPage({
  title,
  description,
  actions,
  children
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Space orientation='vertical' size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {description ? (
            <Paragraph type='secondary' style={{ margin: '4px 0 0', maxWidth: 780 }}>
              {description}
            </Paragraph>
          ) : null}
        </div>
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
      {children}
    </Space>
  )
}
