import { z } from 'zod'

/** Resolved, localized validation messages for the forgot-password form. */
export interface ForgotPasswordSchemaMessages {
  required: string
  email: string
}

/** Builds the forgot-password schema with localized messages. */
export function createForgotPasswordSchema(m: ForgotPasswordSchemaMessages) {
  return z.object({
    email: z.string().min(1, { message: m.required }).email({ message: m.email })
  })
}

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>
