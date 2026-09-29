import type { AuthUser } from '@/shared/auth'
import { AUTH_ENDPOINTS, ROLES, clearSessionMarker, hasSessionMarker, setSessionMarker } from '@/shared/auth'
import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { ApiError } from '@/shared/types'
import type { ChangePasswordPayload, LoginPayload, LoginResponse, RegisterPayload } from '../types/auth.types'
import { mockAuthApi } from './auth.mock'

/** `GET /users/me` of the BMT API (`Response.GetMeBasic`). */
interface BmtMe {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string | null
  phoneNumber?: string | null
  roles?: string[] | null
  mustChangePassword?: boolean
}

/**
 * Tên vai trò mà `GET /users/me` trả cho một tài khoản KHÁCH HÀNG thuần. Backend
 * trả `["User"]` cho khách đăng ký thường (không phải `"customer"` hay tên hệ
 * thống `"Khách hàng"`), và `["Admin"]` cho quản trị. Chuẩn hóa về chữ thường.
 */
const CUSTOMER_ROLE_TOKENS = new Set(['user', 'customer', 'khách hàng'])

/**
 * The frontend only knows customer vs admin. A pure customer account opens the
 * public site; any other role (Admin or a custom staff role) opens the admin
 * area. The backend still enforces each permission per request.
 *
 * Lưu ý: `/users/me` trả `"User"` cho khách thường — nếu coi mọi thứ khác
 * `"customer"` là staff thì khách bị đẩy nhầm vào khu admin. Vì vậy phải whitelist
 * các token vai trò khách, rồi mới coi phần còn lại là staff.
 */
function toRoles(roles: string[] | null | undefined): AuthUser['roles'] {
  const staff = (roles ?? []).some((r) => !CUSTOMER_ROLE_TOKENS.has(r.trim().toLowerCase()))
  return staff ? [ROLES.ADMIN] : [ROLES.CUSTOMER]
}

function toAuthUser(me: BmtMe): AuthUser {
  return {
    id: me.id,
    email: me.email,
    // Vietnamese order: họ (lastName) before tên (firstName).
    // A one-word name is stored as họ = tên (BE requires both), so show it once.
    name:
      (me.lastName === me.firstName ? me.firstName : [me.lastName, me.firstName].filter(Boolean).join(' ')).trim() ||
      me.email,
    phone: me.phoneNumber ?? undefined,
    avatarUrl: me.avatar ?? undefined,
    roles: toRoles(me.roles),
    mustChangePassword: me.mustChangePassword ?? false
  }
}

/**
 * The register form has a single full-name field; BMT wants họ/tên apart.
 * The last word is the given name, the rest the family name.
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const words = fullName.trim().split(/\s+/)
  const firstName = words.pop() ?? ''
  return { firstName, lastName: words.join(' ') || firstName }
}

async function getCurrentUser(): Promise<AuthUser> {
  // No marker = never logged in on this browser (or logged out): skip the
  // `/me` → 401 → refresh → 401 round trips every guest page load would pay.
  if (!hasSessionMarker()) {
    const error: ApiError = { status: 401, message: 'No active session.' }
    throw error
  }
  const user = toAuthUser(await http.get<BmtMe>(AUTH_ENDPOINTS.ME))
  setSessionMarker()
  return user
}

/**
 * Auth feature API surface over the BMT `/users/*` endpoints. Login sets the
 * httpOnly token cookies and returns no profile, so it is followed by `/me`.
 *
 * While there is no backend, set `NEXT_PUBLIC_USE_MOCK_AUTH=true` to route
 * these through an in-browser mock (see {@link mockAuthApi}).
 */
const AuthApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    await http.post(AUTH_ENDPOINTS.LOGIN, { email: payload.email, password: payload.password })
    // Login just set the token cookies, so mark the session BEFORE `/me` —
    // otherwise `getCurrentUser`'s guest short-circuit would reject it.
    setSessionMarker()
    return { user: await getCurrentUser() }
  },

  logout: async (): Promise<void> => {
    try {
      await http.post<void>(AUTH_ENDPOINTS.LOGOUT)
    } finally {
      clearSessionMarker()
    }
  },

  getCurrentUser,

  register: (payload: RegisterPayload) =>
    http.post<void>(AUTH_ENDPOINTS.REGISTER, {
      email: payload.email,
      password: payload.password,
      ...splitName(payload.name)
    }),

  /**
   * Đổi mật khẩu (dùng cho luồng bắt buộc đổi lần đầu, BR-RBAC-006). Backend thu
   * hồi phiên hiện tại sau khi đổi, nên caller phải đăng nhập lại bằng mật khẩu
   * mới (xem {@link relogin}).
   */
  changePassword: (payload: ChangePasswordPayload) =>
    http.post<string>(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword
    }),

  /**
   * Luồng QUÊN MẬT KHẨU (STORY-AUTH-001 ALT-02, BR-AUTH-002) — 3 bước:
   *
   * 1. `requestPasswordReset(email)` → BE gửi mã quên mật khẩu qua email.
   * 2. `verifyResetCode(email, code)` → mã đúng + tài khoản khách → BE cấp
   *    **phiên quên mật khẩu** qua cookie (như web). Phiên này chỉ dùng để đặt
   *    mật khẩu mới, bị từ chối ở các chức năng thường — nên KHÔNG đánh dấu
   *    session marker (tránh `getCurrentUser` gọi `/me`).
   * 3. `resetPassword(newPassword)` → `change_password` với `currentPassword=null`
   *    bằng phiên vừa cấp. BE cắt MỌI phiên (kể cả phiên quên MK), nên xóa marker
   *    và điều hướng người dùng đăng nhập lại.
   */
  requestPasswordReset: (email: string): Promise<void> => http.post<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email }),

  verifyResetCode: (email: string, code: number): Promise<void> =>
    http.post<void>(AUTH_ENDPOINTS.VERIFY_RESET_CODE, { email, code }),

  resetPassword: async (newPassword: string): Promise<void> => {
    await http.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, { currentPassword: null, newPassword })
    clearSessionMarker()
  },

  /** Đăng nhập lại ngay sau khi đổi mật khẩu, trả hồ sơ đã cập nhật. */
  relogin: async (email: string, password: string): Promise<LoginResponse> => {
    await http.post(AUTH_ENDPOINTS.LOGIN, { email, password })
    setSessionMarker()
    return { user: await getCurrentUser() }
  }
}

export const authApi = env.NEXT_PUBLIC_USE_MOCK_AUTH ? mockAuthApi : AuthApi
