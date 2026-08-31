import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { blogCategories, blogStatuses } from './blog.schema';
import { sortOrders } from '../zod-schemas/base-query.schema';

const userProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8b' },
  name: { type: 'string', example: 'John Doe' },
  avatarUrl: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/avatar.png',
  },
};

const toolProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  name: { type: 'string', example: 'Descript' },
  slug: { type: 'string', example: 'descript' },
  tagline: {
    type: 'string',
    example: 'There is a new way to make video and podcasts.',
  },
  logo: { type: 'string', example: 'https://example.com/logo.png' },
};

const blogSchemaProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8d' },
  title: {
    type: 'string',
    example: 'Midjourney v7 Comprehensive Review and Feature Breakdown',
    description: 'Blog post title (max 200 chars)',
  },
  slug: {
    type: 'string',
    example: 'midjourney-v7-review-2026',
    description: 'Unique URL-friendly slug',
  },
  excerpt: {
    type: 'string',
    example:
      'Explore everything new in Midjourney v7 with in-depth prompts, features, and performance comparisons.',
    description: 'Short summary / excerpt (max 300 chars)',
  },
  body: {
    type: 'string',
    example:
      '# Midjourney v7 Review\n\nMidjourney v7 brings groundbreaking improvements in coherence, text rendering, and style consistency...',
    description: 'Full Markdown or HTML content',
  },
  coverImage: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/cover.png',
    description: 'Cover image URL',
  },
  icon: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/icon.png',
    description: 'Display icon or image URL',
  },
  category: {
    type: 'string',
    enum: [...blogCategories],
    example: 'review',
    description: 'Category of the blog post',
  },
  tags: {
    type: 'array',
    items: { type: 'string' },
    example: ['ai', 'image-generation', 'design'],
    description: 'Tags for searching and filtering',
  },
  relatedTools: {
    type: 'array',
    items: {
      type: 'object',
      properties: toolProperties,
    },
    description: 'Tools mentioned or reviewed in this blog post',
  },
  status: {
    type: 'string',
    enum: [...blogStatuses],
    example: 'published',
    description: 'Publication status',
  },
  publishedAt: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    example: '2026-01-01T00:00:00.000Z',
    description: 'Publication timestamp',
  },
  viewCount: {
    type: 'number',
    example: 1250,
    description: 'Total number of views',
  },
  readTime: {
    type: 'number',
    example: 6,
    description: 'Estimated read time in minutes',
  },
  isFeatured: {
    type: 'boolean',
    example: true,
    description: 'Featured article flag for carousel / highlights',
  },
  metaTitle: {
    type: 'string',
    nullable: true,
    example: 'Midjourney v7 Review (2026) - Best AI Generator?',
    description: 'SEO Meta Title',
  },
  metaDescription: {
    type: 'string',
    nullable: true,
    example:
      'Detailed review and benchmark of Midjourney v7 with prompt guides.',
    description: 'SEO Meta Description',
  },
  canonicalUrl: {
    type: 'string',
    nullable: true,
    example: 'https://edithacker.com/blog/midjourney-v7-review-2026',
    description: 'Canonical URL for SEO',
  },
  createdAt: {
    type: 'string',
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
  },
  updatedAt: {
    type: 'string',
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
  },
  author: {
    type: 'object',
    properties: userProperties,
  },
};

const ApiErrorResponse = (status: number, message: string) =>
  ApiResponse({
    status,
    description: message,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: message },
        statusCode: { type: 'number', example: status },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  });

const ApiValidationErrorResponse = (message = 'Validation failed') =>
  ApiErrorResponse(HttpStatus.BAD_REQUEST, message);

const ApiUnauthorizedErrorResponse = (message = 'Unauthorized access') =>
  ApiErrorResponse(HttpStatus.UNAUTHORIZED, message);

const ApiForbiddenErrorResponse = (message = 'Forbidden resource') =>
  ApiErrorResponse(HttpStatus.FORBIDDEN, message);

const ApiNotFoundErrorResponse = (resource = 'Blog post') =>
  ApiErrorResponse(HttpStatus.NOT_FOUND, `${resource} is not found`);

const ApiConflictErrorResponse = (message = 'Conflict') =>
  ApiErrorResponse(HttpStatus.CONFLICT, message);

export function ApiGetBlogsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of blog posts with optional filters',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Page number for pagination (minimum 1, default 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Number of items per page (1 to 100, default 10)',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Text search query across title, excerpt, and tags',
    }),
    ApiQuery({
      name: 'category',
      required: false,
      enum: [...blogCategories],
      description: 'Filter blogs by category',
    }),
    ApiQuery({
      name: 'tag',
      required: false,
      type: String,
      description: 'Filter blogs by tag',
    }),
    ApiQuery({
      name: 'author',
      required: false,
      type: String,
      description: 'Filter blogs by author User ID',
      example: '60c72b2f9b1d8b001c8e4b8b',
    }),
    ApiQuery({
      name: 'relatedTool',
      required: false,
      type: String,
      description: 'Filter blogs by related Tool ID',
      example: '60c72b2f9b1d8b001c8e4b8a',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: [...blogStatuses],
      description: 'Filter by status (Admin only: draft, published, archived)',
    }),
    ApiQuery({
      name: 'isFeatured',
      required: false,
      type: String,
      enum: ['true', 'false'],
      description: 'Filter by featured flag ("true" or "false")',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: [
        'publishedAt',
        'createdAt',
        'updatedAt',
        'viewCount',
        'readTime',
        'title',
      ],
      example: 'publishedAt',
      description: 'Field to sort blogs by (default: publishedAt)',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: [...sortOrders],
      example: 'DESC',
      description: 'Sort order direction ("ASC" or "DESC", default: DESC)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blogs successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Blogs successfully retrieved' },
          blogs: {
            type: 'array',
            items: {
              type: 'object',
              properties: blogSchemaProperties,
            },
          },
          meta: {
            type: 'object',
            properties: {
              totalBlogs: { type: 'number', example: 50 },
              limit: { type: 'number', example: 10 },
              page: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 5 },
              pageStart: { type: 'number', example: 1 },
              hasPrevPage: { type: 'boolean', example: false },
              hasNextPage: { type: 'boolean', example: true },
              prevPage: { type: 'number', nullable: true, example: null },
              nextPage: { type: 'number', nullable: true, example: 2 },
            },
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
  );
}

export function ApiGetBlogDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single blog post by Slug or ID' }),
    ApiParam({
      name: 'identifier',
      type: 'string',
      description: 'Blog slug or MongoDB ObjectId',
      example: 'midjourney-v7-review-2026',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Blog successfully retrieved' },
          blog: {
            type: 'object',
            properties: blogSchemaProperties,
          },
        },
      },
    }),
    ApiNotFoundErrorResponse('Blog post'),
  );
}

export function ApiCheckBlogSlugAvailabilityDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Check if a blog slug is available (Admin)' }),
    ApiParam({
      name: 'slug',
      type: 'string',
      description: 'Slug to verify',
      example: 'midjourney-v7-review-2026',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slug availability checked successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: "Slug 'midjourney-v7-review-2026' is available",
          },
          isAvailable: { type: 'boolean', example: true },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}

export function ApiCreateBlogDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new blog post (Admin)' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['title', 'slug', 'excerpt', 'body', 'category'],
        properties: {
          title: {
            type: 'string',
            example: 'Midjourney v7 Comprehensive Review',
          },
          slug: {
            type: 'string',
            example: 'midjourney-v7-review-2026',
          },
          excerpt: {
            type: 'string',
            example:
              'Explore everything new in Midjourney v7 with in-depth benchmarks.',
          },
          body: {
            type: 'string',
            example: '# Midjourney v7 Review\n\nDetailed content here...',
          },
          category: {
            type: 'string',
            enum: [...blogCategories],
            example: 'review',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['ai', 'design'],
          },
          relatedTools: {
            type: 'array',
            items: { type: 'string' },
            example: ['60c72b2f9b1d8b001c8e4b8a'],
          },
          status: {
            type: 'string',
            enum: [...blogStatuses],
            example: 'draft',
          },
          readTime: { type: 'number', example: 5 },
          isFeatured: { type: 'boolean', example: false },
          metaTitle: {
            type: 'string',
            example: 'Midjourney v7 Review (2026)',
          },
          metaDescription: {
            type: 'string',
            example: 'Full review of Midjourney v7.',
          },
          canonicalUrl: {
            type: 'string',
            example: 'https://edithacker.com/blog/midjourney-v7-review-2026',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Blog created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Blog created successfully' },
          blog: {
            type: 'object',
            properties: blogSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiConflictErrorResponse('Slug is already taken'),
  );
}

export function ApiUpdateBlogDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a blog post (Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated title' },
          slug: { type: 'string', example: 'updated-slug' },
          excerpt: { type: 'string', example: 'Updated excerpt' },
          body: { type: 'string', example: 'Updated body...' },
          category: { type: 'string', enum: [...blogCategories] },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['ai', 'tutorial'],
          },
          relatedTools: {
            type: 'array',
            items: { type: 'string' },
          },
          status: { type: 'string', enum: [...blogStatuses] },
          readTime: { type: 'number', example: 7 },
          isFeatured: { type: 'boolean', example: true },
          metaTitle: { type: 'string', example: 'Updated meta title' },
          metaDescription: {
            type: 'string',
            example: 'Updated meta description',
          },
          canonicalUrl: {
            type: 'string',
            example: 'https://edithacker.com/blog/updated-slug',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Blog updated successfully' },
          blog: {
            type: 'object',
            properties: blogSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Blog post'),
    ApiConflictErrorResponse('Slug is already taken'),
  );
}

export function ApiUpdateBlogCoverImageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update blog cover image (Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['coverImage'],
        properties: {
          coverImage: {
            type: 'string',
            format: 'binary',
            description: 'Image file (jpg, jpeg, png, webp)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog cover image updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Blog cover image updated successfully',
          },
          blog: {
            type: 'object',
            properties: blogSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Blog post'),
  );
}

export function ApiRemoveBlogCoverImageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove blog cover image (Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog cover image removed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Blog cover image removed successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Blog post'),
  );
}

export function ApiUpdateBlogIconDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update blog icon image (Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['icon'],
        properties: {
          icon: {
            type: 'string',
            format: 'binary',
            description: 'Image file (jpg, jpeg, png, webp, svg)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog icon updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Blog icon updated successfully',
          },
          blog: {
            type: 'object',
            properties: blogSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Blog post'),
  );
}

export function ApiRemoveBlogIconDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove blog icon (Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog icon removed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Blog icon removed successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Blog post'),
  );
}

export function ApiDeleteBlogDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a blog post (Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Blog deleted successfully' },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Blog post'),
  );
}

export function ApiIncrementBlogViewCountDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Increment blog view count' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Blog MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8d',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Blog view count incremented',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Blog view count incremented',
          },
          viewCount: { type: 'number', example: 1251 },
        },
      },
    }),
    ApiNotFoundErrorResponse('Blog post'),
  );
}
