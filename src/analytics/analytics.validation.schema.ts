import { z } from 'zod';
import { objectIdSchema } from '../zod-schemas/objectId.schema';

export const analyticsPeriods = ['7d', '30d', '90d', '365d'] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number];

export const analyticsEventTypes = [
  'views',
  'clicks',
  'saves',
  'searchImpressions',
] as const;
export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

export const deviceTypes = ['desktop', 'mobile', 'tablet'] as const;
export type DeviceType = (typeof deviceTypes)[number];

export const analyticsQuerySchema = z.object({
  tool: objectIdSchema.optional(),
  period: z.enum(analyticsPeriods).default('30d'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});
export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;

export const overviewAnalyticsQuerySchema = z.object({
  period: z.enum(analyticsPeriods).default('30d'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type OverviewAnalyticsQueryDto = z.infer<
  typeof overviewAnalyticsQuerySchema
>;

export const trackEventSchema = z
  .object({
    tool: objectIdSchema,
    event: z.enum(analyticsEventTypes),
    device: z.enum(deviceTypes).optional(),
    referrer: z.string().trim().max(200).optional(),
  })
  .strict();
export type TrackEventDto = z.infer<typeof trackEventSchema>;
