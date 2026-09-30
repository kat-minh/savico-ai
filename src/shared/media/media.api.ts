import { http } from '@/shared/lib/api'

import {
  ACCEPTED_IMAGE_TYPES,
  type MediaPurpose,
  type UploadResult,
  type UploadTicket,
  type UploadedImage
} from './media.types'

/**
 * Ba bước upload ảnh theo TDD-MEDIA-001. Gọi `uploadImage(file)` là xong cả ba.
 *
 * Hai bước gọi BMT đi qua `http` (axios) để dùng chung cookie và cơ chế tự làm
 * mới token khi 401. Bước PUT lên kho thì PHẢI dùng `fetch` trần với
 * `credentials: 'omit'` — gửi cookie BMT sang máy chủ khác là vừa thừa vừa hở.
 */

/** Lỗi có mã để phần giao diện dịch sang câu tiếng Việt dễ hiểu. */
export class MediaUploadError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'MediaUploadError'
  }
}

const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Số lần đọc lại trạng thái khi backend còn đang xác minh (mỗi lần cách 2 giây). */
const POLL_LIMIT = 8

export function isAcceptedImage(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)
}

export async function uploadImage(file: File, purpose?: MediaPurpose): Promise<UploadedImage> {
  if (!isAcceptedImage(file)) throw new MediaUploadError('UnsupportedType')

  // 1) Xin chỗ. `sizeBytes` phải đúng số byte thật — backend đối chiếu lại ở
  //    bước xác minh, khai sai là bị từ chối.
  const ticket = await http.post<UploadTicket>(
    '/media/uploads',
    { fileName: file.name, contentType: file.type, sizeBytes: file.size, ...(purpose ? { purpose } : {}) },
    idempotent()
  )
  if (!ticket.uploadUrl) throw new MediaUploadError('MediaUploadExpired')
  if (file.size > ticket.maxSizeBytes) throw new MediaUploadError('TooLarge')

  // 2) Đẩy bytes thẳng lên kho. Gửi nguyên tệp, KHÔNG bọc multipart/FormData, và
  //    đúng bộ header đã ký — sai một header là chữ ký không khớp.
  const stored = await fetch(ticket.uploadUrl, {
    method: 'PUT',
    headers: ticket.requiredHeaders,
    body: file,
    credentials: 'omit'
  })
  if (!stored.ok) throw new MediaUploadError('StoragePutFailed')

  // 3) Báo hoàn tất để backend tải lại và xác minh bytes thật. Có thể trả
  //    `Validating` — khi đó đọc lại trạng thái tới lúc chốt.
  let result = await http.post<UploadResult>(`/media/uploads/${ticket.uploadId}/complete`, {}, idempotent())
  for (let i = 0; i < POLL_LIMIT && result.state === 'Validating'; i += 1) {
    await sleep(2000)
    result = await http.get<UploadResult>(`/media/uploads/${ticket.uploadId}`)
  }

  if (result.state !== 'Completed' || !result.fileUrl) {
    throw new MediaUploadError(result.failureCode ?? (result.state === 'Validating' ? 'StillValidating' : result.state))
  }

  return {
    url: result.fileUrl,
    contentType: result.contentType ?? file.type,
    sizeBytes: result.sizeBytes ?? file.size
  }
}
