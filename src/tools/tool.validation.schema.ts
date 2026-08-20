import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import {
  toolPlateForms,
  toolPricingModels,
  toolStatuses,
} from '../tools/tool.schema';
import { objectIdSchema } from '../zod-schemas/objectId.schema';
import { zfd } from 'zod-form-data';
import { imageFileSchema } from '../zod-schemas/file.schema';

export const toolsQuerySchema = baseQuerySchema.extend({
  status: z.literal(toolStatuses).optional(),
  pricingModel: z.literal(toolPricingModels).optional(),
  sortBy: z
    .literal(['name', 'createdAt', 'updatedAt', 'viewCount', 'saveCount'])
    .default('createdAt'),
});
export type ToolsQueryDto = z.infer<typeof toolsQuerySchema>;

export const createToolSchema = z
  .object({
    name: z.string().trim().max(100),
    slug: z.string().trim().toLowerCase(),
    tagline: z.string().trim().max(160),
    description: z.string().trim(),
    category: objectIdSchema,
    tags: z.array(z.string().toLowerCase().trim()).optional(),
    pricingModel: z.literal(toolPricingModels),
    startingPrice: z.number().min(0).optional(),
    platforms: z.array(z.literal(toolPlateForms)).optional(),
    links: z
      .object({
        website: z.url().trim().optional(),
        twitter: z.url().trim().optional(),
        instagram: z.url().trim().optional(),
        linkedIn: z.url().trim().optional(),
        youtube: z.url().trim().optional(),
        discord: z.url().trim().optional(),
        github: z.url().trim().optional(),
        appStore: z.url().trim().optional(),
        playStore: z.url().trim().optional(),
        apiDocs: z.url().trim().optional(),
      })
      .optional(),
    affiliateUrl: z.url().trim().optional(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    launchDate: z.iso.datetime().optional(),
  })
  .strict();
export type CreateToolDto = z.infer<typeof createToolSchema>;

export const updateToolLogoSchema = zfd.formData({ logo: imageFileSchema });
export type UpdateToolLogoDto = z.infer<typeof updateToolLogoSchema>;

export const updateToolCoverImageSchema = zfd.formData({
  coverImage: imageFileSchema,
});
export type UpdateToolCoverImageDto = z.infer<
  typeof updateToolCoverImageSchema
>;

export const updateToolScreenshotsSchema = zfd.formData({
  screenshots: z.array(imageFileSchema),
});
export type UpdateToolScreenshotsDto = z.infer<
  typeof updateToolScreenshotsSchema
>;

export const removeToolScreenshotsSchema = z.object({
  screenshots: z.array(z.url().trim()),
});
export type RemoveToolScreenshotsDto = z.infer<
  typeof removeToolScreenshotsSchema
>;

export const updateToolSchema = createToolSchema.partial();
export type UpdateToolDto = z.infer<typeof updateToolSchema>;
