import { z } from 'zod'

export const passwordLoginSchema = z.object({
  account: z.string().trim().min(1, 'Account is required'),
  password: z.string().min(1, 'Password is required'),
})

export const otpPhoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number'),
})

export const loginSchema = passwordLoginSchema
