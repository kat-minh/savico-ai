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

/** Bước 2 — nhập mã quên mật khẩu (BE nhận số nguyên). */
export interface ResetCodeSchemaMessages {
  required: string
  code: string
}

export function createResetCodeSchema(m: ResetCodeSchemaMessages) {
  return z.object({
    code: z.string().min(1, { message: m.required }).regex(/^\d+$/, { message: m.code })
  })
}

export type ResetCodeFormValues = z.infer<ReturnType<typeof createResetCodeSchema>>

/** Bước 3 — đặt mật khẩu mới (không cần mật khẩu hiện tại). */
export interface ResetPasswordSchemaMessages {
  required: string
  passwordMin: string
  passwordMismatch: string
}

export function createResetPasswordSchema(m: ResetPasswordSchemaMessages) {
  return z
    .object({
      newPassword: z.string().min(8, { message: m.passwordMin }),
      confirmPassword: z.string().min(1, { message: m.required })
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: m.passwordMismatch,
      path: ['confirmPassword']
    })
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>
