'use client'

import { Space, Typography } from 'antd'
import { createContext, use, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

const { Title, Paragraph } = Typography

/**
 * Bật khi `AdminPage` đang nằm trong một tab của màn theo trang.
 *
 * Dùng context thay vì luồn prop qua mười `*Manager`: các manager không cần biết
 * chúng đang đứng riêng hay bị nhúng, và thêm màn mới cũng không phải nhớ chuyển
 * tiếp một prop nữa.
 */
const EmbeddedContext = createContext(false)

/** Đánh dấu mọi `AdminPage` bên trong là một tab, không phải một màn riêng. */
export function AdminPanelScope({ children }: { children: ReactNode }) {
  return <EmbeddedContext value={true}>{children}</EmbeddedContext>
}

/**
 * Đầu trang dùng chung cho mọi màn quản trị: tiêu đề, một dòng giải thích màn
 * này sửa cái gì trên site, và chỗ đặt nút hành động.
 *
 * Dòng mô tả không phải trang trí — người vận hành cần biết sửa ở đây thì KHÁCH
 * thấy đổi ở đâu, nên mỗi màn đều nói rõ điều đó. Khi bị nhúng vào tab thì BỎ
 * tiêu đề (màn cha và nhãn tab đã nói rồi) nhưng GIỮ dòng mô tả.
 *
 * `sticky` dành cho các màn soạn thảo dài (trang chủ, trang tĩnh, cài đặt site):
 * form dài hơn màn hình nên nút Lưu ở đầu trang sẽ trôi mất, phải cuộn ngược lên
 * mới bấm được. Bật `sticky` thì cả khối đầu trang dính dưới thanh trên.
 *
 * Bố cục ở đây là `div` thuần nên dùng THẲNG Tailwind. Chỉ những chỗ phải đè lên
 * DOM bên trong của antd mới rơi xuống `style`/`admin.css` — CSS-in-JS của antd
 * không nằm trong `@layer` nên luôn thắng utility của Tailwind.
 */
export function AdminPage({
  title,
  description,
  actions,
  sticky,
  children
}: {
  title: string
  description?: string
  actions?: ReactNode
  sticky?: boolean
  children: ReactNode
}) {
  const embedded = use(EmbeddedContext)

  return (
    // `div` thuần chứ KHÔNG phải `Space` của antd: Space bọc mỗi con trong một
    // `.ant-space-item` cao đúng bằng chính con đó, mà `position: sticky` chỉ
    // chạy được trong phạm vi thẻ cha — cha cao bằng con thì nó không nhúc nhích
    // nổi một pixel. Đó là lý do thanh Lưu "dính" mà cuộn xuống vẫn mất.
    <div className='flex w-full flex-col gap-4'>
      <div
        className={cn(
          'flex flex-wrap items-start gap-4',
          // `top-15` = 60px = chiều cao Header (xem `headerHeight` ở AntdProvider).
          // Nền phải ĐỤC, nếu không chữ bên dưới cuộn xuyên qua khối dính.
          sticky &&
            'sticky top-15 z-[5] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 shadow-sm md:px-4 md:py-3.5'
        )}
      >
        <div className='min-w-60 flex-1'>
          {embedded ? null : (
            <Title level={4} style={{ margin: 0 }}>
              {title}
            </Title>
          )}
          {description ? (
            <Paragraph type='secondary' style={{ margin: embedded ? 0 : '4px 0 0', maxWidth: 780 }}>
              {description}
            </Paragraph>
          ) : null}
        </div>
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
      {children}
    </div>
  )
}
