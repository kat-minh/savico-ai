/**
 * Root namespaces for TanStack Query keys.
 *
 * Each feature composes its own keys under its namespace (see
 * `features/<feature>/api/<feature>.keys.ts`). Keeping the roots here prevents
 * collisions and makes cross-feature cache invalidation discoverable.
 */
export const QUERY_KEY_ROOTS = {
  auth: 'auth',
  projects: 'projects',
  estimates: 'estimates',
  library: 'library',
  gallery: 'gallery',
  portfolio: 'portfolio',
  chatbot: 'chatbot',
  cms: 'cms',
  users: 'users',
  leads: 'leads',
  dashboard: 'dashboard',
  profile: 'profile',
  settings: 'settings',
  location: 'location'
} as const

export type QueryKeyRoot = (typeof QUERY_KEY_ROOTS)[keyof typeof QUERY_KEY_ROOTS]
