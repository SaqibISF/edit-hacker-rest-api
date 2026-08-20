import { z } from 'zod';

export const sortOrders = ['ASC', 'DESC'] as const;
export type SortOrder = (typeof sortOrders)[number];

export const baseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortOrder: z.literal(sortOrders).default('ASC'),
});

export type BaseQuery = z.infer<typeof baseQuerySchema>;
