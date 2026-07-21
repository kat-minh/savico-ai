/** Auth roles understood by the frontend. Mirror the backend's role names. */
export const ROLES = {
  GUEST: 'guest',
  CUSTOMER: 'customer',
  ADMIN: 'admin'
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: readonly Role[] = Object.values(ROLES)

/**
 * Name of the cookie the .NET backend sets to mark an authenticated session.
 * The middleware checks for its presence to guard routes. (The actual token
 * is httpOnly and never read by client JS.)
 */
export const AUTH_COOKIE_NAME = 'bmt.auth'

/** localStorage key under which the (non-sensitive) auth profile is persisted. */
export const AUTH_STORAGE_KEY = 'bmt.auth-state'
