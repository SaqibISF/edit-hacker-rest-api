import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import {
  adPackages,
  adPaymentStatuses,
  adPlacements,
  adStatuses,
} from './advertisement.schema';
import { objectIdSchema } from '../zod-schemas/objectId.schema';
import { scopeSchema } from '../zod-schemas/scope.schema';
import { zfd } from 'zod-form-data';
import { imageFileSchema } from '../zod-schemas/file.schema';

export const advertisementsQuerySchema = baseQuerySchema.extend({
  placement: z.literal(adPlacements).optional(),
  status: z.literal(adStatuses).optional(),
  package: z.literal(adPackages).optional(),
  paymentStatus: z.literal(adPaymentStatuses).optional(),
  advertiser: objectIdSchema.optional(),
  tool: objectIdSchema.optional(),
  targetCategory: objectIdSchema.optional(),
  scope: scopeSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z
    .literal([
      'createdAt',
      'updatedAt',
      'startDate',
      'endDate',
      'impressions',
      'clicks',
      'priceUSD',
      'title',
    ])
    .default('createdAt'),
});
export type AdvertisementsQueryDto = z.infer<typeof advertisementsQuerySchema>;

// export const activeAdsQuerySchema = z.object({
//   placement: z.literal(adPlacements).optional(),
//   category: objectIdSchema.optional(),
//   limit: z.coerce.number().int().min(1).max(20).default(5),
// });
// export type ActiveAdsQueryDto = z.infer<typeof activeAdsQuerySchema>;

export const createAdvertisementSchema = z
  .object({
    tool: objectIdSchema.optional(),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title max 200 chars'),
    description: z
      .string()
      .trim()
      .max(500, 'Description max 500 chars')
      .optional(),
    logoUrl: z.string().trim().optional(),
    ctaText: z.string().trim().min(1).max(50).optional(),
    ctaUrl: z.url('Invalid CTA URL').trim(),
    placement: z.literal(adPlacements),
    targetCategories: z.array(objectIdSchema).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    package: z.literal(adPackages).optional(),
    priceUSD: z.coerce.number().min(0, 'Price must be non-negative'),
    paymentStatus: z.literal(adPaymentStatuses).optional(),
    paymentId: z.string().trim().optional(),
    status: z.literal(adStatuses).optional(),
  })
  .strict();
export type CreateAdvertisementDto = z.infer<typeof createAdvertisementSchema>;

export const updateAdvertisementSchema = createAdvertisementSchema
  .partial()
  .strict();
export type UpdateAdvertisementDto = z.infer<typeof updateAdvertisementSchema>;

export const updateAdLogoSchema = zfd.formData({ logo: imageFileSchema });
export type UpdateAdLogoDto = z.infer<typeof updateAdLogoSchema>;

export const trackAdActionSchema = z
  .object({ action: z.literal(['impression', 'click']) })
  .strict();
export type TrackAdActionDto = z.infer<typeof trackAdActionSchema>;
