import z from 'zod';
import { emailSchema } from '../zod-schemas/email.schema';
import {
  choosePasswordSchema,
  confirmPasswordSchema,
  passwordSchema,
} from '../zod-schemas/password.schema';
import { nameSchema } from '../zod-schemas/name.schema';

export const loginSchema = z
  .object({ email: emailSchema, password: passwordSchema })
  .strict();
export type LoginDto = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: choosePasswordSchema,
  })
  .strict();
export type SignupDto = z.infer<typeof signupSchema>;

export const updatePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: choosePasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Please choose different password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .strict();
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().optional(),
    otp: z.number().optional(),
    email: emailSchema,
    newPassword: choosePasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.token || data.otp, {
    message: 'Either token or otp must be provided',
    path: ['token'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .strict();
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const verificationSchema = z
  .object({
    email: emailSchema,
    token: z.string().optional(),
    otp: z.number().optional(),
  })
  .refine((data) => data.token || data.otp, {
    message: 'Either token or otp must be provided',
    path: ['token'],
  })
  .strict();
export type VerificationDto = z.infer<typeof verificationSchema>;
