import { z } from 'zod'

/** Resolved, localized validation messages injected into the schema. */
export interface CreateProjectSchemaMessages {
  required: string
  maxLength: string
}

export const PROJECT_NAME_MAX_LENGTH = 120
export const PROJECT_DESCRIPTION_MAX_LENGTH = 300

/**
 * Modal Tạo dự án (mục III.1): Tên dự án bắt buộc, Mô tả tùy chọn.
 * Messages are resolved at the call site so no UI copy is hardcoded here.
 */
export function createProjectSchema(m: CreateProjectSchemaMessages) {
  return z.object({
    name: z.string().trim().min(1, { message: m.required }).max(PROJECT_NAME_MAX_LENGTH, { message: m.maxLength }),
    description: z.string().trim().max(PROJECT_DESCRIPTION_MAX_LENGTH, { message: m.maxLength })
  })
}

export type CreateProjectFormValues = z.infer<ReturnType<typeof createProjectSchema>>
