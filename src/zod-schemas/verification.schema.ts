import z from 'zod';
import { emailSchema } from './email.schema';

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
