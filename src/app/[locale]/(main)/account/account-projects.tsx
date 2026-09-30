'use client'

import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { MyProjects, useProjects } from '@/features/design'
import { SupervisionProjectStrip } from '@/features/supervision'

/**
 * Nối "Dự án của tôi" với khối giám sát gắn ở đáy thẻ (S24).
 *
 * Phải là client component: `renderSupervision` là một HÀM, mà hàm thì không
 * truyền qua ranh giới server → client được. Trang `page.tsx` chạy trên server
 * nên chỗ nối hai feature nằm ở đây — `features/design` và
 * `features/supervision` không import lẫn nhau.
 *
 * Chỉ dự án MỚI NHẤT hiện khối giám sát, khớp với thẻ "GIÁM SÁT CỦA TÔI" ở cột
 * trái. Bản mock trả về gói giám sát cho BẤT KỲ mã dự án nào, nên nếu không
 * chặn ở đây thì mọi thẻ đều mọc ra một khối giám sát giống hệt nhau. Khi
 * backend trả đúng danh sách dự án có gói, bỏ điều kiện này đi.
 */
export function AccountProjects() {
  const t = useTranslations('account.projects.pendingNotice')
  const { data: projects } = useProjects()
  const supervisedId = projects?.[0]?.id

  return (
    <div className='space-y-4'>
      {/* Danh sách đọc dự toán thật (`GET /estimates`); luồng TẠO 3 bước chưa nối
          BE nên báo rõ để khỏi tưởng còn mock. */}
      <div className='border-warning/40 bg-warning/10 flex gap-3 rounded-xl border p-4'>
        <Info className='text-warning-strong mt-0.5 size-4 shrink-0' />
        <div className='min-w-0'>
          <p className='text-sm font-semibold'>{t('title')}</p>
          <p className='text-muted-foreground mt-0.5 text-sm text-pretty'>{t('description')}</p>
        </div>
      </div>
      <MyProjects
        renderSupervision={(projectId) =>
          projectId === supervisedId ? <SupervisionProjectStrip projectId={projectId} /> : null
        }
      />
    </div>
  )
}
