import { notFound } from 'next/navigation'

/**
 * Catch-all for unmatched localized paths. Delegates to the localized
 * `not-found.tsx` so 404s stay within the active locale + layout.
 */
export default function CatchAllPage() {
  notFound()
}
