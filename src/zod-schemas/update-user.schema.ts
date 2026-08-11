import z from 'zod';
import { nameSchema } from './name.schema';
import { mobileSchema } from './mobile.schema';

export const updateUserSchema = z
  .object({ name: nameSchema.optional(), mobile: mobileSchema.optional() })
  .strict();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
