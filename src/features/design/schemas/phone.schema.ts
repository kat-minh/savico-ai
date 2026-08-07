/**
 * Số điện thoại liên lạc (mục IV.3.d): 10 chữ số bắt đầu bằng 0, hoặc dạng
 * +84 bỏ số 0 đầu. Chấp nhận khoảng trắng / dấu chấm / gạch nối khi người dùng
 * gõ, nhưng chuẩn hóa về dạng liền trước khi lưu.
 */
const VN_PHONE = /^(0\d{9}|\+84\d{9})$/

/** Bỏ mọi ký tự phân cách người dùng gõ cho dễ nhìn. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.-]/g, '')
}

export function isValidPhone(raw: string): boolean {
  return VN_PHONE.test(normalizePhone(raw))
}
