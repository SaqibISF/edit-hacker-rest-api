import z from 'zod';

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

export {
  choosePasswordSchema,
  passwordSchema,
  confirmPasswordSchema,
  createPasswordSchema,
};
