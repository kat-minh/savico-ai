'use client'

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
  const { data: projects } = useProjects()
  const supervisedId = projects?.[0]?.id

  return (
    <MyProjects
      renderSupervision={(projectId) =>
        projectId === supervisedId ? <SupervisionProjectStrip projectId={projectId} /> : null
      }
    />
  )
}
