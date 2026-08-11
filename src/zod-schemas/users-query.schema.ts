import { z } from 'zod';
import { UserRole } from '../users/user.schema';
import { baseQuerySchema } from './base-query.schema';

export const usersQuerySchema = baseQuerySchema.extend({
  role: z.enum(UserRole).optional(),
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
