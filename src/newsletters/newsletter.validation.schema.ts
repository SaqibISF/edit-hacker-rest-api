import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import { newsletterStatuses, newsletterSources } from './newsletter.schema';
import { emailSchema } from '../zod-schemas/email.schema';
import { nameSchema } from '../zod-schemas/name.schema';

export const newslettersQuerySchema = baseQuerySchema.extend({
  status: z.literal(newsletterStatuses).optional(),
  source: z.literal(newsletterSources).optional(),
  sortBy: z.literal(['createdAt', 'updatedAt', 'email']).default('createdAt'),
});
export type NewslettersQueryDto = z.infer<typeof newslettersQuerySchema>;

export const subscribeNewsletterSchema = z
  .object({
    email: emailSchema,
    name: nameSchema.optional().nullable(),
    source: z.literal(newsletterSources).default('homepage'),
  })
  .strict();
export type SubscribeNewsletterDto = z.infer<typeof subscribeNewsletterSchema>;

export const updatePreferencesSchema = z
  .object({
    weeklyDigest: z.boolean().optional(),
    newTools: z.boolean().optional(),
    deals: z.boolean().optional(),
    tutorials: z.boolean().optional(),
  })
  .strict();
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;

export const updateNewsletterSchema = z
  .object({
    name: nameSchema.optional().nullable(),
    status: z.enum(newsletterStatuses).optional(),
    source: z.enum(newsletterSources).optional(),
    confirmedAt: z.coerce.date().optional().nullable(),
    unsubscribedAt: z.coerce.date().optional().nullable(),
    preferences: updatePreferencesSchema.optional(),
  })
  .strict();
export type UpdateNewsletterDto = z.infer<typeof updateNewsletterSchema>;
