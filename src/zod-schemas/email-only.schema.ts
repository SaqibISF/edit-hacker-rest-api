import z from 'zod';
import { emailSchema } from './email.schema';

export const emailOnlySchema = z.object({ email: emailSchema }).strict();

export type EmailOnlyDto = z.infer<typeof emailOnlySchema>;
