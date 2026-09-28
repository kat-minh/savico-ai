import { http } from '@/shared/lib/api'
import { isApiOrderId } from '../constants/checkout.constants'
import type { CreateOrderPayload, Order, OrderStatus } from '../types/checkout.types'
import { mockCheckoutApi } from './checkout.mock'

/**
 * Nối luồng MUA GÓI vào BMT API — GIỮ MOCK LÀM NỀN.
 *
 * DB backend rỗng nên gói hiển thị ở trang Bảng giá đến từ MOCK (id không phải
 * UUID); khi đó checkout cũng chạy mock cho gói đó. Chỉ gói ĐẾN TỪ API (planId
 * là UUID) mới đi qua `POST /payment-orders`. Nhờ vậy demo không bao giờ gãy dù
 * chưa có gói thật trong DB.
 *
 * Khác biệt luồng API so với mock (user đã chốt):
 * - Không có mã giảm giá, không hóa đơn, không thông tin người mua ở đơn.
 * - Không có nút "Tôi đã chuyển khoản": QR tự đối soát, màn QR poll `getOrder`
 *   tới khi `Paid` (→ Hoàn tất) hoặc `Expired`/`Canceled` (→ Thất bại).
 * - Ảnh QR lấy thẳng `qrUrl` của đơn; không có endpoint tạo lại QR riêng.
 */

/* ===========================================================================
 * DTO — `POST /payment-orders`, `GET /payment-orders/{id}` (PaymentOrderDetail)
 * ======================================================================== */

interface BmtPaymentBeneficiary {
  gateway: string
  accountNumber: string
  bankCode: string
  transferContent: string
}

interface BmtPaymentOrderDetail {
  id: string
  planId: string
  revisionId: string
  planName: string
  kind: 'Design' | 'Supervision'
  offerKey: 'Month' | 'Year' | 'ConstructionSite'
  state: 'Pending' | 'PartiallyPaid' | 'Paid' | 'Expired' | 'Canceled'
  priceVnd: string
  currency: string
  receivedAmountVnd: string
  eligibleAmountVnd: string
  remainingAmountVnd: string
  extraReceivedAmountVnd: string
  paymentCode: string
  createdAtUtc: string
  expiresAtUtc: string
  paidAtUtc?: string | null
  canceledAtUtc?: string | null
  expiredAtUtc?: string | null
  serverNowUtc: string
  version: number
  qrUrl?: string | null
  beneficiary: BmtPaymentBeneficiary
}

/** Trạng thái đơn BMT → trạng thái màn checkout. */
function mapState(state: BmtPaymentOrderDetail['state']): OrderStatus {
  switch (state) {
    case 'Pending':
    case 'PartiallyPaid':
      return 'awaiting'
    case 'Paid':
      return 'paid'
    case 'Expired':
    case 'Canceled':
      return 'failed'
  }
}

function toNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * `PaymentOrderDetail` → `Order`. Đơn API không có người mua / hóa đơn / giảm
 * giá — để giá trị mặc định rỗng cho type còn hợp lệ; `qrUrl` là ẢNH QR (màn S04
 * render bằng `<img>` khi đơn là đơn API).
 */
function mapOrder(detail: BmtPaymentOrderDetail): Order {
  const price = toNumber(detail.priceVnd)
  return {
    id: detail.id,
    product: {
      id: detail.planId,
      kind: detail.kind === 'Supervision' ? 'supervision' : 'design',
      name: detail.planName,
      price,
      benefits: []
    },
    buyer: { name: '', phone: '', email: '' },
    invoice: { enabled: false, company: '', taxCode: '', address: '', email: '' },
    discountCode: '',
    subtotal: price,
    discountAmount: 0,
    total: price,
    status: mapState(detail.state),
    createdAt: detail.createdAtUtc,
    expiresAt: detail.expiresAtUtc,
    ...(detail.paidAtUtc ? { paidAt: detail.paidAtUtc } : {}),
    transfer: {
      // API chỉ trả mã ngân hàng (không có tên hiển thị) và số tài khoản; tên chủ
      // tài khoản chưa có trong schema → để trống.
      bankName: detail.beneficiary.bankCode,
      accountNumber: detail.beneficiary.accountNumber,
      accountName: '',
      content: detail.beneficiary.transferContent || detail.paymentCode,
      qrPayload: detail.qrUrl ?? ''
    }
  }
}

export const bmtCheckoutApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    // Gói mock (id không phải UUID) → tạo đơn mock như cũ.
    if (!isApiOrderId(payload.productId)) return mockCheckoutApi.createOrder(payload)

    const detail = await http.post<BmtPaymentOrderDetail>(
      '/payment-orders',
      { planId: payload.productId, ...(payload.offerKey ? { offerKey: payload.offerKey } : {}) },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } }
    )
    return mapOrder(detail)
  },

  getOrder: async (orderId: string): Promise<Order> => {
    if (!isApiOrderId(orderId)) return mockCheckoutApi.getOrder(orderId)
    const detail = await http.get<BmtPaymentOrderDetail>(`/payment-orders/${orderId}`)
    return mapOrder(detail)
  },

  regenerateQr: async (orderId: string): Promise<Order> => {
    // API không có endpoint tạo lại QR: đọc lại đơn để lấy `qrUrl` hiện hành.
    if (!isApiOrderId(orderId)) return mockCheckoutApi.regenerateQr(orderId)
    const detail = await http.get<BmtPaymentOrderDetail>(`/payment-orders/${orderId}`)
    return mapOrder(detail)
  },

  cancelOrder: async (orderId: string): Promise<Order> => {
    if (!isApiOrderId(orderId)) return mockCheckoutApi.cancelOrder(orderId)
    const detail = await http.post<BmtPaymentOrderDetail>(`/payment-orders/${orderId}/cancel`)
    return mapOrder(detail)
  }
}
