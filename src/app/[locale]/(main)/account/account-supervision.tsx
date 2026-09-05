'use client'

import { useProjects } from '@/features/design'
import { SupervisionSummary } from '@/features/supervision'

/**
 * Khối "GIÁM SÁT CỦA TÔI" trên trang Tài khoản (S24).
 *
 * Nằm ở lớp app vì nó ghép hai feature không được import lẫn nhau: danh sách dự
 * án thuộc `features/design`, còn dữ liệu giám sát thuộc `features/supervision`.
 *
 * Hiện khối của dự án MỚI NHẤT. Bản mô tả vẽ khối này cho một dự án cụ thể; khi
 * backend trả về danh sách dự án có gói giám sát thì chỗ này lặp qua danh sách
 * đó thay vì lấy dự án đầu tiên.
 */
export function AccountSupervision() {
  const { data: projects } = useProjects()
  const latest = projects?.[0]

  if (!latest) return null

  return <SupervisionSummary projectId={latest.id} />
}
