import { z } from 'zod';
import { baseQuerySchema } from '../zod-schemas/base-query.schema';
import { blogCategories, blogStatuses } from './blog.schema';
import { objectIdSchema } from '../zod-schemas/objectId.schema';
import { zfd } from 'zod-form-data';
import { imageFileSchema } from '../zod-schemas/file.schema';

export const blogsQuerySchema = baseQuerySchema.extend({
  category: z.literal(blogCategories).optional(),
  tag: z.string().trim().toLowerCase().optional(),
  author: objectIdSchema.optional(),
  relatedTool: objectIdSchema.optional(),
  status: z.literal(blogStatuses).optional(),
  isFeatured: z.stringbool().optional(),
  sortBy: z
    .literal([
      'publishedAt',
      'createdAt',
      'updatedAt',
      'viewCount',
      'readTime',
      'title',
    ])
    .default('publishedAt'),
});
export type BlogsQueryDto = z.infer<typeof blogsQuerySchema>;

export const createBlogSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title max 200 chars'),
    slug: z.string().trim().min(1, 'Slug is required').toLowerCase(),
    excerpt: z
      .string()
      .trim()
      .min(1, 'Excerpt is required')
      .max(300, 'Excerpt max 300 chars'),
    body: z.string().trim().min(1, 'Body content is required'),
    category: z.literal(blogCategories),
    tags: z.array(z.string().trim().toLowerCase()).optional(),
    relatedTools: z.array(objectIdSchema).optional(),
    status: z.literal(blogStatuses).optional(),
    readTime: z.coerce.number().int().min(1).optional(),
    isFeatured: z.boolean().optional(),
    metaTitle: z.string().trim().max(200).optional(),
    metaDescription: z.string().trim().max(300).optional(),
    canonicalUrl: z.string().trim().url('Invalid canonical URL').optional(),
  })
  .strict();
export type CreateBlogDto = z.infer<typeof createBlogSchema>;

export const updateBlogSchema = createBlogSchema.partial().strict();
export type UpdateBlogDto = z.infer<typeof updateBlogSchema>;

export const updateBlogCoverImageSchema = zfd.formData({
  coverImage: imageFileSchema,
});
export type UpdateBlogCoverImageDto = z.infer<
  typeof updateBlogCoverImageSchema
>;

export const updateBlogIconSchema = zfd.formData({ icon: imageFileSchema });
export type UpdateBlogIconDto = z.infer<typeof updateBlogIconSchema>;
