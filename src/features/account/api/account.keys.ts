/** Query-key factory cho feature `account`. */
export const accountKeys = {
  all: ['account'] as const,
  plan: () => [...accountKeys.all, 'plan'] as const
} as const
