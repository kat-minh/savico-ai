/**
 * Hằng số luồng mua gói (S03–S08).
 */

/** Stepper 4 bước dùng chung cho cả mua gói thiết kế và gói giám sát. */
export const CHECKOUT_STEPS = ['plan', 'confirm', 'payment', 'done'] as const
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

/** Mã QR sống 15 phút; hết hạn thì tạo lại (S04). */
export const QR_TTL_MINUTES = 15

/** Cam kết hoàn tiền in dưới nút thanh toán (S03). */
export const REFUND_WINDOW_HOURS = 24

/** Đơn hàng chưa thanh toán được giữ lại bao lâu (S07). */
export const ORDER_HOLD_HOURS = 24

/**
 * Phân biệt gói / đơn của BMT API với gói / đơn MOCK bằng dạng ID: gói và đơn
 * mock có mã ngắn (`basic`, `pro`, `SVC-26001`), còn BMT API dùng UUID. Nhờ vậy
 * checkout tự chọn nhánh: ID là UUID → gọi API; còn lại → chạy mock.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** ID này có phải của BMT API (UUID) không? Không phải → gói / đơn mock. */
export function isApiOrderId(id: string): boolean {
  return UUID_RE.test(id.trim())
}
