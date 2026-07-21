/**
 * Daily chat message limits (stakeholder Q&A §2.3.5):
 * 30 messages/day for a logged-in customer, 10/day for an anonymous guest.
 */
export const CHAT_DAILY_LIMIT = {
  customer: 30,
  guest: 10
} as const

/** localStorage key holding `{ date, count }` for the per-day quota. */
export const CHAT_USAGE_STORAGE_KEY = 'bmt.chat-usage'
