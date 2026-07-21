'use client'

import { useAdvisory } from '../hooks/use-advisory'
import type { DesignInput, EstimateResult } from '../types/design.types'

interface AdvisoryNoteProps {
  result: EstimateResult
  /** Xưng hô theo tên khách hàng (mục III.3b, khối 3). */
  customerName: string
  /** Dữ liệu Bước 1 — nguồn của các biến loại công trình / gói / phong cách. */
  input?: DesignInput
}

/**
 * Đoạn văn tư vấn cá nhân hóa — văn mẫu soạn sẵn điền biến theo dự án
 * (mục III.3b, khối 3). Câu cuối là ghi chú bắt buộc nên in nhỏ và mờ hơn.
 */
export function AdvisoryNote({ result, customerName, input }: AdvisoryNoteProps) {
  const paragraphs = useAdvisory(result, customerName, input)

  return (
    <div className='space-y-3 text-sm leading-relaxed'>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={index === paragraphs.length - 1 ? 'text-muted-foreground text-xs' : undefined}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}
