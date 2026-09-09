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

/**
 * localStorage key of the fake session profile the mock backend keeps
 * (`NEXT_PUBLIC_USE_MOCK_AUTH=true`).
 *
 * Lives in `shared/` because two feature mocks touch the same record: the auth
 * mock WRITES it on login and READS it on `/me`, while the account mock EDITS
 * it when the profile form is saved — without that, an edit would survive only
 * until the next reload re-fetched `/me`. Delete alongside the mock layer once
 * the .NET API is wired up.
 */
export const MOCK_SESSION_USER_KEY = 'bmt.mock-user'
