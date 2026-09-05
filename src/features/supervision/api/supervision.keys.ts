/** Query-key factory cho feature `supervision` (S19–S24). */
export const supervisionKeys = {
  all: ['supervision'] as const,
  projects: () => [...supervisionKeys.all, 'project'] as const,
  /** Toàn bộ dữ liệu giám sát của một dự án — mọi màn S20–S24 đọc key này. */
  project: (projectId: string) => [...supervisionKeys.projects(), projectId] as const
} as const
