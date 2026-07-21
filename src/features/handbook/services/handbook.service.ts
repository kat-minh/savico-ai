import { PERSONALIZED_TEMPLATE_COUNT, TAG_RELAXATION_ORDER } from '../constants/handbook.constants'
import type { HandbookFilter, HandbookTags, HandbookTemplate } from '../types/handbook.types'

/** A template matches when every tag the filter specifies is equal on the template. */
export function matchesTags(tags: HandbookTags, filter: HandbookFilter): boolean {
  return (Object.keys(filter) as (keyof HandbookTags)[]).every((key) => {
    const wanted = filter[key]
    if (wanted === undefined || wanted === null) return true
    return tags[key] === wanted
  })
}

/**
 * Chọn mẫu cho panel cẩm nang cá nhân hóa (mục III.3a + mục VI).
 *
 * Lọc theo tag khớp các trường Bước 1 rồi lấy ngẫu nhiên 3 mẫu. Nếu không đủ 3
 * mẫu khớp hết tag thì nới lỏng dần tiêu chí theo {@link TAG_RELAXATION_ORDER}
 * để LUÔN đủ 3 mẫu — panel không bao giờ được hiện ít hơn số này.
 *
 * `pick` is injected so the caller controls randomness (and tests stay
 * deterministic); it receives the eligible pool and returns the chosen slice.
 */
export function selectPersonalizedTemplates(
  pool: readonly HandbookTemplate[],
  filter: HandbookFilter,
  pick: (candidates: readonly HandbookTemplate[], count: number) => HandbookTemplate[] = takeRandom,
  count = PERSONALIZED_TEMPLATE_COUNT
): HandbookTemplate[] {
  let active: HandbookFilter = { ...filter }

  for (let relaxed = 0; relaxed <= TAG_RELAXATION_ORDER.length; relaxed++) {
    const matches = pool.filter((template) => matchesTags(template.tags, active))
    if (matches.length >= count) return pick(matches, count)

    const next = TAG_RELAXATION_ORDER[relaxed]
    if (!next) break
    const { [next]: _dropped, ...rest } = active
    active = rest
  }

  // Every criterion relaxed and the pool is still short — show what exists.
  return pick(pool, count)
}

/** Fisher–Yates over a copy, then take the first `count`. */
function takeRandom<T>(items: readonly T[], count: number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = copy[i]
    const b = copy[j]
    if (a !== undefined && b !== undefined) {
      copy[i] = b
      copy[j] = a
    }
  }
  return copy.slice(0, count)
}
