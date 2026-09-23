'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const HANDBOOK_QUOTA_LEDGER_KEY = 'savico.handbook.quota-ledger'

interface HandbookQuotaLedger {
  dayKey: string
  lookupUsed: number
  detailViewedIds: Record<string, true>
  resetForToday: () => void
  consumeLookup: (available: number) => boolean
  consumeDetail: (templateId: string, available: number) => 'consumed' | 'seen' | 'blocked'
}

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Mock-only daily usage ledger for the handbook library.
 *
 * The real API remains the authority once quota consumption is implemented on
 * the backend. In mock mode the GET endpoint always returns the configured
 * allowance, so this tiny persisted ledger gives the frontend realistic daily
 * decrement/reset behaviour without changing the public API contract.
 */
export const useHandbookQuotaLedger = create<HandbookQuotaLedger>()(
  persist(
    (set, get) => ({
      dayKey: localDayKey(),
      lookupUsed: 0,
      detailViewedIds: {},

      resetForToday: () => {
        const today = localDayKey()
        if (get().dayKey === today) return
        set({ dayKey: today, lookupUsed: 0, detailViewedIds: {} })
      },

      consumeLookup: (available) => {
        const today = localDayKey()
        const current = get()
        const used = current.dayKey === today ? current.lookupUsed : 0
        if (used >= Math.max(available, 0)) {
          if (current.dayKey !== today) set({ dayKey: today, lookupUsed: 0 })
          return false
        }

        set({ dayKey: today, lookupUsed: used + 1 })
        return true
      },

      consumeDetail: (templateId, available) => {
        const today = localDayKey()
        const current = get()
        const viewed = current.dayKey === today ? current.detailViewedIds : {}
        if (viewed[templateId]) {
          if (current.dayKey !== today) set({ dayKey: today, lookupUsed: 0, detailViewedIds: {} })
          return 'seen'
        }

        const used = Object.keys(viewed).length
        if (used >= Math.max(available, 0)) {
          if (current.dayKey !== today) set({ dayKey: today, lookupUsed: 0, detailViewedIds: {} })
          return 'blocked'
        }

        set({
          dayKey: today,
          ...(current.dayKey === today ? {} : { lookupUsed: 0 }),
          detailViewedIds: { ...viewed, [templateId]: true }
        })
        return 'consumed'
      }
    }),
    {
      name: HANDBOOK_QUOTA_LEDGER_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
)
