import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import { comparisonTypes } from './comparison.schema';
import { objectIdSchema } from '../zod-schemas/objectId.schema';
import { scopeSchema } from '../zod-schemas/scope.schema';

export const comparisonsQuerySchema = baseQuerySchema.extend({
  type: z.literal(comparisonTypes).optional(),
  isPublished: z.stringbool().optional(),
  tools: z.array(objectIdSchema).optional(),
  winner: objectIdSchema.optional(),
  scope: scopeSchema,
  sortBy: z
    .literal(['createdAt', 'updatedAt', 'title', 'viewCount'])
    .default('viewCount'),
});
export type ComparisonsQueryDto = z.infer<typeof comparisonsQuerySchema>;

export const createComparisonSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    slug: z.string().trim().min(1),
    tools: z
      .array(objectIdSchema)
      .min(2, 'A comparison must have at least 2 tools')
      .max(5, 'A comparison can have at most 5 tools'),
    winner: objectIdSchema.optional().nullable(),
    summary: z.string().trim().max(500).optional(),
  })
  .strict();
export type CreateComparisonDto = z.infer<typeof createComparisonSchema>;

export const updateComparisonSchema = createComparisonSchema
  .partial()
  .extend({ isPublished: z.boolean().optional() })
  .strict();
export type UpdateComparisonDto = z.infer<typeof updateComparisonSchema>;
