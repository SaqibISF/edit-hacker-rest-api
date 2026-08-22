import { z } from 'zod';
import { userRoles } from './user.schema';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import { nameSchema } from '../zod-schemas/name.schema';
import { mobileSchema } from '../zod-schemas/mobile.schema';
import { imageFileSchema } from '../zod-schemas/file.schema';
import { zfd } from 'zod-form-data';
import { objectIdSchema } from '../zod-schemas/objectId.schema';

export const usersQuerySchema = baseQuerySchema.extend({
  role: z.literal(userRoles).optional(),
  status: z.literal(['active', 'banned']).optional(),
  verified: z.literal(['yes', 'no']).optional(),
  deleted: z.literal(['with', 'only']).optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
  sortBy: z
    .literal([
      'name',
      'email',
      'role',
      'lastLoginAt',
      'bannedAt',
      'deletedAt',
      'createdAt',
      'updatedAt',
    ])
    .default('createdAt'),
});
export type UsersQueryDto = z.infer<typeof usersQuerySchema>;

export const avatarSchema = zfd.formData({ avatar: imageFileSchema });
export type AvatarDto = z.infer<typeof avatarSchema>;

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    mobile: mobileSchema.optional(),
    newsletter: z.boolean({ error: 'newsletter expected boolean' }).optional(),
  })
  .strict();
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const savedToolsSchema = z
  .object({ savedTools: z.array(objectIdSchema) })
  .strict();
export type SavedToolsDto = z.infer<typeof savedToolsSchema>;

export const updateUserByAdminSchema = z
  .object({
    name: nameSchema.optional(),

    mobile: mobileSchema.optional(),

    role: z
      .literal(userRoles, { error: 'role expected only user or admin' })
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
