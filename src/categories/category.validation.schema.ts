import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import { imageFileSchema } from '../zod-schemas/file.schema';

export const categoriesQuerySchema = baseQuerySchema.extend({
  isFeatured: z.stringbool().optional(),
  isActive: z.stringbool().optional(),
  sortBy: z
    .literal(['name', 'toolCount', 'order', 'createdAt', 'updatedAt'])
    .default('createdAt'),
});
export type CategoriesQueryDto = z.infer<typeof categoriesQuerySchema>;

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Category name is required'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'The category slug is required'),
    description: z
      .string()
      .trim()
      .max(300, 'Description max 300 chars')
      .optional(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    isFeatured: z.boolean().optional(),
    order: z.number().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export const updateCategoryIconSchema = z.object({ icon: imageFileSchema });
export type UpdateCategoryIconDto = z.infer<typeof updateCategoryIconSchema>;

export const updateCategoryCoverImageSchema = z.object({
  coverImage: imageFileSchema,
});
export type UpdateCategoryCoverImageDto = z.infer<
  typeof updateCategoryCoverImageSchema
>;
