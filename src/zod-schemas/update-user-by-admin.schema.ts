import z from 'zod';
import { nameSchema } from './name.schema';
import { mobileSchema } from './mobile.schema';

export const updateUserByAdminSchema = z
  .object({
    name: nameSchema.optional(),

    mobile: mobileSchema.optional(),

    role: z
      .literal(['user', 'admin'], {
        error: 'role expected only user or admin',
      })
      .optional(),

    emailVerified: z
      .literal(true, { error: 'emailVerified expected true' })
      .optional(),

    banned: z.boolean({ error: 'banned expected boolean' }).optional(),

    banReason: z
      .string({ error: 'banReason expected string' })
      .trim()
      .min(1, 'Banned reason is required')
      .nullable()
      .optional(),
  })
  .strict();

export type UpdateUserByAdminDto = z.infer<typeof updateUserByAdminSchema>;
