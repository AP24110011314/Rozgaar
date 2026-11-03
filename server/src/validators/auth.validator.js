import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  role: z.enum(['applicant', 'recruiter']).default('applicant'),
  companyName: z.string().trim().min(2).max(120).optional(),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to privacy terms to register' }),
  }),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
}).strict();

