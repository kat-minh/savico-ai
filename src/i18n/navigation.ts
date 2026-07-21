import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware navigation primitives. Use these EVERYWHERE instead of the
 * `next/link` and `next/navigation` equivalents so the active locale prefix
 * is applied automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
