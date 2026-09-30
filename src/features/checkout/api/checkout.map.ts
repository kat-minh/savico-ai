import type { Order, OrderStatus } from '../types/checkout.types'

/**
 * Ánh xạ đơn BMT (`PaymentOrderDetail`) → `Order` của màn thanh toán — hàm thuần để
 * kiểm được không cần backend.
 *
 * Swagger không mô tả response, còn TDD-PAY-001 chỉ có MỘT ví dụ (đơn vừa tạo) và
 * nhắc các field khác bằng lời: tên gói, `offerKey`, thông tin thụ hưởng, `qrUrl`,
 * `fulfillment`. Nên mọi field ngoài ví dụ đó đều khai TUỲ CHỌN và đọc phòng thủ: một
 * field BE không trả không được phép làm sập cả màn QR.
 *
 * Tiền là CHUỖI số nguyên VND (để khỏi mất chính xác trên JavaScript) — luôn đổi sang
 * số trước khi dùng.
 */

export interface BmtPaymentBeneficiary {
  gateway?: string
  accountNumber?: string
  bankCode?: string
  transferContent?: string
}

export type BmtOrderState = 'Pending' | 'PartiallyPaid' | 'Paid' | 'Expired' | 'Canceled'

export interface BmtPaymentOrderDetail {
  id: string
  state: BmtOrderState
  priceVnd: string
  currency?: string
  receivedAmountVnd?: string
  eligibleAmountVnd?: string
  remainingAmountVnd?: string
  extraReceivedAmountVnd?: string
  paymentCode?: string
  createdAtUtc: string
  expiresAtUtc: string
  serverNowUtc?: string
  version: number
  // Ngoài ví dụ của TDD — nhắc bằng lời nên có thể thiếu.
  planId?: string
  planName?: string
  offerKey?: 'Month' | 'Year' | 'ConstructionSite'
  kind?: 'Design' | 'Supervision'
  paidAtUtc?: string | null
  qrUrl?: string | null
  beneficiary?: BmtPaymentBeneficiary | null
}

/** Trạng thái đơn BMT → trạng thái màn checkout. */
export function mapState(state: BmtOrderState): OrderStatus {
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

/** Chuỗi số nguyên VND → số; thiếu hoặc hỏng thì 0 (không ném lỗi làm sập màn). */
export function toNumber(value: string | null | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * `nowMs` là giờ máy khách lúc nhận đơn, truyền vào để kiểm được. Độ lệch với
 * `serverNowUtc` lưu lại để đếm ngược không sai khi đồng hồ máy khách chạy lệch.
 */
export function mapOrder(detail: BmtPaymentOrderDetail, nowMs: number = Date.now()): Order {
  const price = toNumber(detail.priceVnd)
  const serverNow = detail.serverNowUtc ? Date.parse(detail.serverNowUtc) : Number.NaN
  const beneficiary = detail.beneficiary ?? {}
  const paymentCode = detail.paymentCode ?? ''

  return {
    id: detail.id,
    product: {
      id: detail.planId ?? '',
      kind: detail.kind === 'Supervision' ? 'supervision' : 'design',
      name: detail.planName ?? '',
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
      // Tên chủ tài khoản không có trong PaymentConnection nên luôn để trống. Nội dung
      // chuyển khoản chính là `paymentCode` khi BE không trả riêng.
      bankName: beneficiary.bankCode ?? '',
      accountNumber: beneficiary.accountNumber ?? '',
      accountName: '',
      content: beneficiary.transferContent || paymentCode,
      qrPayload: detail.qrUrl ?? ''
    },
    api: {
      version: detail.version,
      state: detail.state,
      receivedAmount: toNumber(detail.receivedAmountVnd),
      remainingAmount: toNumber(detail.remainingAmountVnd),
      extraReceivedAmount: toNumber(detail.extraReceivedAmountVnd),
      serverOffsetMs: Number.isFinite(serverNow) ? serverNow - nowMs : 0,
      paymentCode,
      ...(detail.offerKey ? { offerKey: detail.offerKey } : {})
    }
  }
}
