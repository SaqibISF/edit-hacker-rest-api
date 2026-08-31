import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import {
  reviewStatuses,
  reviewUsagePeriods,
  reviewVotes,
} from './review.schema';
import { objectIdSchema } from '../zod-schemas/objectId.schema';
import { scopeSchema } from '../zod-schemas/scope.schema';

export const reviewsQuerySchema = baseQuerySchema.extend({
  tool: objectIdSchema.optional(),
  user: objectIdSchema.optional(),
  status: z.literal(reviewStatuses).optional(),
  usagePeriod: z.literal(reviewUsagePeriods).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  isVerifiedPurchase: z.stringbool().optional(),
  scope: scopeSchema,
  sortBy: z
    .literal([
      'createdAt',
      'updatedAt',
      'helpfulVotes',
      'unhelpfulVotes',
      'rating.overall',
    ])
    .default('createdAt'),
});
export type ReviewsQueryDto = z.infer<typeof reviewsQuerySchema>;

export const ratingSchema = z.object({
  overall: z
    .number()
    .min(1, 'Overall rating must be at least 1')
    .max(5, 'Overall rating cannot exceed 5'),
  easeOfUse: z.number().min(1).max(5).nullable().optional(),
  valueForMoney: z.number().min(1).max(5).nullable().optional(),
  features: z.number().min(1).max(5).nullable().optional(),
  support: z.number().min(1).max(5).nullable().optional(),
});
export type RatingDto = z.infer<typeof ratingSchema>;

export const createReviewSchema = z
  .object({
    tool: objectIdSchema,
    rating: ratingSchema.optional(),
    title: z
      .string()
      .trim()
      .min(1, 'Review title is required')
      .max(120, 'Review title max 120 chars'),
    description: z
      .string()
      .trim()
      .min(1, 'Review description is required')
      .min(20, 'Review must be at least 20 characters')
      .max(2000, 'Review max 2000 chars'),
    pros: z.array(z.string().trim()).optional(),
    cons: z.array(z.string().trim()).optional(),
    usagePeriod: z.literal(reviewUsagePeriods),
    useCase: z.string().trim().max(200, 'Use case max 200 chars').optional(),
  })
  .strict();
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema
  .omit({ tool: true })
  .partial()
  .extend({
    status: z.literal(reviewStatuses).optional(),
    isVerifiedPurchase: z.boolean().optional(),
  })
  .strict();
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;

export const voteReviewSchema = z
  .object({ vote: z.literal(reviewVotes) })
  .strict();
export type VoteReviewDto = z.infer<typeof voteReviewSchema>;
