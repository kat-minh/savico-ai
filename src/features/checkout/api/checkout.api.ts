import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { CreateOrderPayload, Order } from '../types/checkout.types'
import { mockCheckoutApi } from './checkout.mock'

/**
 * Checkout API surface (S03–S08). Endpoint là placeholder tới khi controller
 * .NET có thật.
 *
 * Không có hàm nào cho cổng thanh toán / thẻ: chỉ QR chuyển khoản (R10).
 */
const CheckoutApi = {
  createOrder: (payload: CreateOrderPayload) => http.post<Order>('/orders', payload),
  getOrder: (orderId: string) => http.get<Order>(`/orders/${orderId}`),
  /** "Tôi đã chuyển khoản" ở S04 → đơn sang trạng thái đang xác nhận (S06). */
  markTransferred: (orderId: string) => http.post<Order>(`/orders/${orderId}/transferred`, {}),
  /** "Thử lại thanh toán" ở S07 → sinh mã QR mới, quay lại S04. */
  regenerateQr: (orderId: string) => http.post<Order>(`/orders/${orderId}/qr`, {})
}

export const checkoutApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockCheckoutApi : CheckoutApi
