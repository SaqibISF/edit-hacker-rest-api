import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { sortOrders } from '../zod-schemas/base-query.schema';

const TIMESTAMP_EXAMPLE = '2026-08-11T04:22:27.746Z';

const categorySchemaProperties = {
  _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
  name: { type: 'string', example: 'AI Tools' },
  slug: { type: 'string', example: 'ai-tools' },
  description: { type: 'string', example: 'Collection of AI tools' },
  icon: { type: 'string', example: 'https://example.com/icon.png' },
  coverImage: { type: 'string', example: 'https://example.com/cover.png' },
  metaTitle: { type: 'string', example: 'Best AI Tools' },
  metaDescription: { type: 'string', example: 'Find the best AI tools here' },
  toolCount: { type: 'number', example: 5 },
  isFeatured: { type: 'boolean', example: true },
  order: { type: 'number', example: 1 },
  isActive: { type: 'boolean', example: true },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
};

// const categoryExample = {
//   _id: '60d0fe4f5311236168a109ca',
//   name: 'AI Tools',
//   slug: 'ai-tools',
//   description: 'Collection of AI tools',
//   icon: 'https://example.com/icon.png',
//   coverImage: 'https://example.com/cover.png',
//   metaTitle: 'Best AI Tools',
//   metaDescription: 'Find the best AI tools here',
//   toolCount: 5,
//   isFeatured: true,
//   order: 1,
//   isActive: true,
//   createdAt: TIMESTAMP_EXAMPLE,
//   updatedAt: TIMESTAMP_EXAMPLE,
// };

const ErrorResponse = (
  status: number,
  description: string,
  message: string,
) => {
  return ApiResponse({
    status,
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: message },
            statusCode: { type: 'number', example: status },
            timestamp: { type: 'string', example: TIMESTAMP_EXAMPLE },
          },
        },
      },
    },
  });
};

export function ApiGetCategoriesDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all categories with pagination' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: [...sortOrders],
      example: 'ASC',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['name', 'toolCount', 'order', 'createdAt', 'updatedAt'],
      example: 'createdAt',
    }),
    ApiQuery({ name: 'isFeatured', required: false, type: Boolean }),
    ApiQuery({ name: 'isActive', required: false, type: Boolean }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Categories successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Categories successfully retrieved',
              },
              categories: {
                type: 'array',
                items: { type: 'object', properties: categorySchemaProperties },
              },
              meta: {
                type: 'object',
                properties: {
                  totalCategories: { type: 'number' },
                  limit: { type: 'number' },
                  page: { type: 'number' },
                  totalPages: { type: 'number' },
                  nextPage: { type: 'number', nullable: true },
                  prevPage: { type: 'number', nullable: true },
                  pageStart: { type: 'number' },
                  hasPrevPage: { type: 'boolean' },
                  hasNextPage: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiGetCategoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get category by ID or slug' }),
    ApiParam({
      name: 'identifier',
      description: 'Category ID or Slug',
      example: 'ai-tools',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category successfully retrieved',
              },
              category: {
                type: 'object',
                properties: categorySchemaProperties,
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
  );
}

export function ApiCheckSlugAvailabilityDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Check category slug availability' }),
    ApiParam({
      name: 'slug',
      description: 'Category slug',
      example: 'ai-tools',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slug availability checked',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: "Slug 'ai-tools' is available",
              },
              isAvailable: { type: 'boolean', example: true },
            },
          },
        },
      },
    }),
  );
}

export function ApiCreateCategoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category (Admin)' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'AI Tools' },
          slug: { type: 'string', example: 'ai-tools' },
          description: { type: 'string', example: 'AI tools collection' },
          metaTitle: { type: 'string', example: 'Best AI tools' },
          metaDescription: {
            type: 'string',
            example: 'Find the best AI tools',
          },
          isFeatured: { type: 'boolean', example: true },
          order: { type: 'number', example: 1 },
          isActive: { type: 'boolean', example: true },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Category created successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category created successfully',
              },
              category: {
                type: 'object',
                properties: categorySchemaProperties,
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Slug taken',
      'Slug "ai-tools" is already taken',
    ),
    ErrorResponse(
      HttpStatus.UNAUTHORIZED,
      'Unauthorized',
      'Unauthorized access',
    ),
  );
}

export function ApiUpdateCategoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a category (Admin)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'AI Tools' },
          description: { type: 'string', example: 'Updated description' },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category updated successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category updated successfully',
              },
              category: {
                type: 'object',
                properties: categorySchemaProperties,
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Slug taken',
      'Slug "ai-tools" is already taken',
    ),
  );
}

export function ApiUpdateCategoryIconDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update category icon (Admin)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { icon: { type: 'string', format: 'binary' } },
        required: ['icon'],
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category icon updated successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category icon updated successfully',
              },
              category: {
                type: 'object',
                properties: categorySchemaProperties,
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
  );
}

export function ApiRemoveCategoryIconDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove category icon (Admin)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category icon removed successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category icon removed successfully',
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Already removed',
      'Category icon is already removed',
    ),
  );
}

export function ApiUpdateCategoryCoverImageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update category cover image (Admin)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { coverImage: { type: 'string', format: 'binary' } },
        required: ['coverImage'],
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category cover image updated successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category cover image updated successfully',
              },
              category: {
                type: 'object',
                properties: categorySchemaProperties,
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
  );
}

export function ApiRemoveCategoryCoverImageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove category cover image (Admin)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category cover image removed successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category cover image removed successfully',
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
    ErrorResponse(
      HttpStatus.BAD_REQUEST,
      'Already removed',
      'Category cover image is already removed',
    ),
  );
}

export function ApiDeleteCategoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a category (Admin)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Category deleted successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: 'Category deleted successfully',
              },
            },
          },
        },
      },
    }),
    ErrorResponse(
      HttpStatus.NOT_FOUND,
      'Category not found',
      'Category is not found',
    ),
  );
}
