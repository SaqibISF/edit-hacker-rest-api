import z from 'zod';
import { nameSchema } from './name.schema';
import { emailSchema } from './email.schema';
import { choosePasswordSchema } from './password.schema';

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: choosePasswordSchema,
  })
  .strict();

export type SignupDto = z.infer<typeof signupSchema>;
