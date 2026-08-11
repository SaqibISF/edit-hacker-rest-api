import z from 'zod';
import { emailSchema } from './email.schema';
import { passwordSchema } from './password.schema';

export const loginSchema = z
  .object({ email: emailSchema, password: passwordSchema })
  .strict();

export type LoginDto = z.infer<typeof loginSchema>;
