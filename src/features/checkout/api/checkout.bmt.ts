import { http, isApiError } from '@/shared/lib/api'
import { isApiOrderId } from '../constants/checkout.constants'
import type { CreateOrderPayload, Order } from '../types/checkout.types'
import { mockCheckoutApi } from './checkout.mock'
import { mapOrder, type BmtPaymentOrderDetail } from './checkout.map'

/**
 * Nối luồng MUA GÓI vào BMT API (TDD-PAY-001) — GIỮ MOCK LÀM NỀN.
 *
 * Checkout chọn nhánh THEO DẠNG ID: gói đến từ API (planId là UUID) đi qua
 * `POST /payment-orders`, gói mock (id không phải UUID) chạy mock. Nhờ vậy demo không
 * bao giờ gãy khi chưa có gói thật.
 *
 * Khác biệt luồng API so với mock (user đã chốt, docs xác nhận):
 * - Không có mã giảm giá, không hóa đơn, không thông tin người mua ở đơn.
 * - Không có nút "Tôi đã chuyển khoản": QR tự đối soát qua webhook SePay, màn QR
 *   poll `getOrder` tới khi `Paid` (→ Hoàn tất) hoặc `Expired`/`Canceled` (→ Thất bại).
 * - Ảnh QR lấy thẳng `qrUrl` của đơn; không có endpoint tạo lại QR riêng.
 * - Chỉ tài khoản KHÁCH mua được (nhân viên, kể cả admin, bị 403 `AccessForbidden`).
 *
 * Ánh xạ DTO nằm ở `checkout.map.ts`.
 */

/** Response của `POST /payment-orders/{id}/cancel` — gọn, không đủ dựng `Order`. */
interface BmtPaymentOrderCanceled {
  orderId: string
  state: BmtPaymentOrderDetail['state']
  version: number
  canceledAtUtc?: string | null
  wasAlreadyApplied: boolean
}

const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })

async function readOrder(orderId: string): Promise<BmtPaymentOrderDetail> {
  return http.get<BmtPaymentOrderDetail>(`/payment-orders/${orderId}`)
}

export const bmtCheckoutApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    // Gói mock (id không phải UUID) → tạo đơn mock như cũ.
    if (!isApiOrderId(payload.productId)) return mockCheckoutApi.createOrder(payload)

    // Mỗi lần bấm là một khoá mới. Body chỉ có planId + offerKey: BE tự lấy giá, quyền
    // lợi và kết nối nhận tiền — client không được gửi, cũng không gửi được.
    const detail = await http.post<BmtPaymentOrderDetail>(
      '/payment-orders',
      { planId: payload.productId, ...(payload.offerKey ? { offerKey: payload.offerKey } : {}) },
      idempotent()
    )
    return mapOrder(detail)
  },

  getOrder: async (orderId: string): Promise<Order> => {
    if (!isApiOrderId(orderId)) return mockCheckoutApi.getOrder(orderId)
    return mapOrder(await readOrder(orderId))
  },

  regenerateQr: async (orderId: string): Promise<Order> => {
    // API không có endpoint tạo lại QR: đọc lại đơn để lấy `qrUrl` hiện hành.
    if (!isApiOrderId(orderId)) return mockCheckoutApi.regenerateQr(orderId)
    return mapOrder(await readOrder(orderId))
  },

  cancelOrder: async (orderId: string): Promise<Order> => {
    if (!isApiOrderId(orderId)) return mockCheckoutApi.cancelOrder(orderId)

    // Cần `expectedVersion` (khoá lạc quan) nên phải đọc phiên bản hiện hành trước. Nếu
    // trong lúc đó webhook vừa đổi đơn, BE trả 409 `PaymentOrderVersionConflict` → đọc
    // lại và thử đúng một lần nữa. Đơn đã nhận tiền thì BE từ chối
    // (`PaymentOrderCannotCancel`) — lỗi đó để nổi lên cho người dùng, không thử lại.
    const cancelAt = (version: number) =>
      http.post<BmtPaymentOrderCanceled>(
        `/payment-orders/${orderId}/cancel`,
        { expectedVersion: version },
        idempotent()
      )

    const current = await readOrder(orderId)
    try {
      await cancelAt(current.version)
    } catch (error) {
      if (!isApiError(error) || error.messageCode !== 'PaymentOrderVersionConflict') throw error
      await cancelAt((await readOrder(orderId)).version)
    }
    // `cancel` không trả đủ field dựng `Order` → đọc lại đơn đầy đủ.
    return mapOrder(await readOrder(orderId))
  }
}
