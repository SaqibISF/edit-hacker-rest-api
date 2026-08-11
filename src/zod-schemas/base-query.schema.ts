import { z } from 'zod';

export const baseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortOrder: z.literal(['ASC', 'DESC']).optional(),
});
