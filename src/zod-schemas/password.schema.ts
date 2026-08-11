import z from 'zod';
import { emailSchema } from './email.schema';

const commonPasswords: string[] = [];

const choosePasswordSchema = z
  .string({
    error: (issue) =>
      issue.input == null
        ? 'Password is required'
        : 'Password must be a string',
  })
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password cannot exceed 128 characters' })
  .refine((val) => val === val.trim(), {
    message: 'Password cannot start or end with whitespace',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Password must include at least one lowercase letter',
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must include at least one uppercase letter',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Password must include at least one digit',
  })
  .refine((val) => /[^a-zA-Z0-9]/.test(val), {
    message: 'Password must include at least one special character',
  })
  .refine((val) => !commonPasswords.includes(val.toLowerCase()), {
    message: 'Password is too common. Choose something more secure.',
  });

const passwordSchema = z
  .string({
    error: (issue) =>
      issue.input == null
        ? 'Password is required'
        : 'Password must be a string',
  })
  .min(1, 'Password is required');

const confirmPasswordSchema = z
  .string({
    error: (issue) =>
      issue.input == null
        ? 'Confirm password is required'
        : 'Confirm password must be a string',
  })
  .min(1, 'Confirm password is required');

const createPasswordSchema = z
  .object({
    password: choosePasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .strict();

const updatePasswordSchema = z
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

const resetPasswordSchema = z
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

type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export {
  choosePasswordSchema,
  passwordSchema,
  confirmPasswordSchema,
  createPasswordSchema,
  updatePasswordSchema,
  resetPasswordSchema,
  type UpdatePasswordDto,
  type ResetPasswordDto,
};
