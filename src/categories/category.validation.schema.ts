import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import { zfd } from 'zod-form-data';
import { imageFileSchema } from '../zod-schemas/file.schema';

export const categoriesQuerySchema = baseQuerySchema.extend({
  isFeatured: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
  isActive: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
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

export const updateCategoryIconSchema = zfd.formData({ icon: imageFileSchema });
export type UpdateCategoryIconDto = z.infer<typeof updateCategoryIconSchema>;

export const updateCategoryCoverImageSchema = zfd.formData({
  coverImage: imageFileSchema,
});
export type UpdateCategoryCoverImageDto = z.infer<
  typeof updateCategoryCoverImageSchema
>;
