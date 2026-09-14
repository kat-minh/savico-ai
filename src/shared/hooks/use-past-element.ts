'use client'

import { useEffect, useState } from 'react'

/**
 * `true` once the page has scrolled past the bottom of the element with this
 * `id` (e.g. the hero) — `false` while it's still on screen. A route with no
 * such element reads as "already past" so callers land on their settled look
 * (opaque header, visible chat FAB…) instead of staying in the "before" state
 * forever.
 */
export function usePastElement(id: string): boolean {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no element to observe, so there's nothing to subscribe to; the sentinel default is "past"
      setPast(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [id])

  return past
}
