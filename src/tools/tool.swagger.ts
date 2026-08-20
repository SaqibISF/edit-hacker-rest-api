import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  toolBillingCycles,
  toolListingType,
  toolPlateForms,
  toolPricingModels,
  toolStatuses,
} from './tool.schema';
import { sortOrders } from '../zod-schemas/base-query.schema';

const toolSchemaProperties = {
  _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
  name: { type: 'string', example: 'Tool Name' },
  slug: { type: 'string', example: 'tool-name' },
  tagline: { type: 'string', example: 'Best tool for you' },
  description: {
    type: 'string',
    example: 'Detailed description of the tool...',
  },
  logo: {
    type: 'string',
    example: 'https://example.com/logo.png',
  },
  coverImage: {
    type: 'string',
    example: 'https://example.com/cover.png',
  },
  screenshots: {
    type: 'array',
    items: {
      type: 'string',
      example: 'https://example.com/screenshot1.png',
    },
  },
  category: {
    type: 'string',
    example: '60d0fe4f5311236168a109cb',
  },
  tags: {
    type: 'array',
    items: { type: 'string', example: 'seo' },
  },
  pricingModel: {
    type: 'string',
    enum: [...toolPricingModels],
    example: 'freemium',
  },
  startingPrice: { type: 'number', example: 0 },
  plans: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Pro Plan' },
        price: { type: 'number', example: 2900 },
        billingCycle: {
          type: 'string',
          enum: [...toolBillingCycles],
          example: 'monthly',
        },
        features: {
          type: 'array',
          items: {
            type: 'string',
            example: 'Unlimited access',
          },
        },
        isPopular: { type: 'boolean', example: false },
        trialDays: { type: 'number', example: 14 },
      },
    },
  },
  platforms: {
    type: 'array',
    items: {
      type: 'string',
      enum: [...toolPlateForms],
      example: 'web',
    },
  },
  links: {
    type: 'object',
    properties: {
      website: { type: 'string', example: 'https://example.com' },
      twitter: {
        type: 'string',
        example: 'https://twitter.com/example',
      },
      instagram: { type: 'string' },
      linkedIn: { type: 'string' },
      youtube: { type: 'string' },
      discord: { type: 'string' },
      github: { type: 'string' },
      appStore: { type: 'string' },
      playStore: { type: 'string' },
      apiDocs: { type: 'string' },
    },
  },
  affiliateUrl: {
    type: 'string',
    example: 'https://example.com/affiliate',
  },
  rating: {
    type: 'object',
    properties: {
      average: { type: 'number', example: 4.8 },
      count: { type: 'number', example: 125 },
    },
  },
  viewCount: { type: 'number', example: 1500 },
  clickCount: { type: 'number', example: 350 },
  saveCount: { type: 'number', example: 120 },
  submittedBy: {
    type: 'string',
    example: '60d0fe4f5311236168a109cc',
  },
  status: {
    type: 'string',
    enum: [...toolStatuses],
    example: 'approved',
  },
  rejectionReason: {
    type: 'string',
    example: 'Incomplete information',
  },
  reviewedBy: {
    type: 'string',
    example: '60d0fe4f5311236168a109cd',
  },
  reviewedAt: { type: 'string', format: 'date-time' },
  listingType: {
    type: 'string',
    enum: [...toolListingType],
    example: 'standard',
  },
  isFeatured: { type: 'boolean', example: false },
  isSponsored: { type: 'boolean', example: false },
  isVerified: { type: 'boolean', example: true },
  featuredUntil: { type: 'string', format: 'date-time' },
  metaTitle: {
    type: 'string',
    example: 'Tool Name - Best tool for you',
  },
  metaDescription: {
    type: 'string',
    example: 'Detailed description for SEO.',
  },
  launchDate: { type: 'string', format: 'date-time' },
  isActive: { type: 'boolean', example: true },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
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

const ApiValidationErrorResponse = () =>
  ApiErrorResponse(HttpStatus.BAD_REQUEST, 'Validation failed');

const ApiUnauthorizedErrorResponse = () =>
  ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Unauthorized access');

const ApiForbiddenErrorResponse = () =>
  ApiErrorResponse(HttpStatus.FORBIDDEN, 'Forbidden resource');

const ApiNotFoundErrorResponse = (resource = 'Tool') =>
  ApiErrorResponse(HttpStatus.NOT_FOUND, `${resource} not found`);

const ApiConflictErrorResponse = (message = 'Conflict') =>
  ApiErrorResponse(HttpStatus.CONFLICT, message);

export function ApiGetToolsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a paginated list of tools' }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number for pagination',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term for text search on tools',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      enum: ['name', 'createdAt', 'updatedAt', 'viewCount', 'saveCount'],
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      type: String,
      enum: sortOrders,
      description: 'Sort order (ASC or DESC)',
      example: 'DESC',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      type: String,
      enum: [...toolStatuses],
      description: 'Filter by tool status',
    }),
    ApiQuery({
      name: 'pricingModel',
      required: false,
      type: String,
      enum: [...toolPricingModels],
      description: 'Filter by pricing model',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tools successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tools successfully retrieved' },
          tools: {
            type: 'array',
            items: {
              type: 'object',
              properties: toolSchemaProperties,
            },
          },
          meta: {
            type: 'object',
            properties: {
              totalTools: { type: 'number', example: 100 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
              page: { type: 'number', example: 1 },
              pageStart: { type: 'number', example: 1 },
              hasPrevPage: { type: 'boolean', example: false },
              hasNextPage: { type: 'boolean', example: true },
              prevPage: { type: 'number', example: null, nullable: true },
              nextPage: { type: 'number', example: 2, nullable: true },
            },
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
  );
}

export function ApiGetToolDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a tool by identifier (slug or ID)' }),
    ApiParam({
      name: 'identifier',
      type: String,
      description: 'Slug or MongoDB ID of the tool',
      example: 'tool-name',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tool successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tool successfully retrieved' },
          tool: {
            type: 'object',
            properties: toolSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiCheckSlugAvailabilityDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Check if a tool slug is available' }),
    ApiParam({
      name: 'slug',
      type: String,
      description: 'Slug to check',
      example: 'my-new-tool',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slug availability checked',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: `Slug 'my-new-tool' is available`,
          },
          isAvailable: { type: 'boolean', example: true },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
  );
}

export function ApiCreateToolDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new tool' }),
    ApiBody({
      schema: {
        type: 'object',
        example: {
          name: 'SuperTool',
          slug: 'super-tool',
          tagline: 'The best tool ever',
          description: 'A very detailed description of this super tool.',
          category: '60d0fe4f5311236168a109cb',
          tags: ['productivity', 'ai'],
          pricingModel: 'freemium',
          startingPrice: 0,
          platforms: ['web', 'ios'],
          links: {
            website: 'https://supertool.com',
            twitter: 'https://twitter.com/supertool',
            instagram: 'https://instagram.com/supertool',
            linkedIn: 'https://linkedin.com/company/supertool',
            youtube: 'https://youtube.com/supertool',
            discord: 'https://discord.gg/supertool',
            github: 'https://github.com/supertool',
            appStore: 'https://apps.apple.com/app/supertool',
            playStore:
              'https://play.google.com/store/apps/details?id=com.supertool',
            apiDocs: 'https://docs.supertool.com',
          },
          affiliateUrl: 'https://supertool.com/ref?id=123',
          metaTitle: 'SuperTool - The ultimate AI assistant',
          metaDescription: 'SuperTool helps you work faster using AI.',
          launchDate: '2023-10-01T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Tool created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tool created successfully' },
          tool: {
            type: 'object',
            properties: toolSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiConflictErrorResponse('Slug already exists'),
  );
}

export function ApiUpdateToolLogoDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update the tool logo' }),
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          logo: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Logo updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Logo updated successfully' },
          tool: {
            type: 'object',
            properties: toolSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiRemoveToolLogoDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove the tool logo' }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Logo removed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Logo removed successfully' },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiUpdateToolCoverImageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update the tool cover image' }),
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          coverImage: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cover image updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Cover image updated successfully',
          },
          tool: {
            type: 'object',
            properties: toolSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiRemoveToolCoverImageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove the tool cover image' }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cover image removed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Cover image removed successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiUpdateToolScreenshotsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Add screenshots to the tool' }),
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          screenshots: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Screenshots updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Screenshots updated successfully',
          },
          tool: {
            type: 'object',
            properties: toolSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiRemoveToolScreenshotsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove screenshots from the tool' }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          screenshots: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/screenshot1.png',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Screenshots removed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Screenshots removed successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}

export function ApiUpdateToolDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a tool' }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiBody({
      schema: {
        type: 'object',
        example: {
          name: 'SuperTool',
          slug: 'super-tool',
          tagline: 'The best tool ever',
          description: 'A very detailed description of this super tool.',
          category: '60d0fe4f5311236168a109cb',
          tags: ['productivity', 'ai'],
          pricingModel: 'freemium',
          startingPrice: 0,
          platforms: ['web', 'ios'],
          links: {
            website: 'https://supertool.com',
            twitter: 'https://twitter.com/supertool',
            instagram: 'https://instagram.com/supertool',
            linkedIn: 'https://linkedin.com/company/supertool',
            youtube: 'https://youtube.com/supertool',
            discord: 'https://discord.gg/supertool',
            github: 'https://github.com/supertool',
            appStore: 'https://apps.apple.com/app/supertool',
            playStore:
              'https://play.google.com/store/apps/details?id=com.supertool',
            apiDocs: 'https://docs.supertool.com',
          },
          affiliateUrl: 'https://supertool.com/ref?id=123',
          metaTitle: 'SuperTool - The ultimate AI assistant',
          metaDescription: 'SuperTool helps you work faster using AI.',
          launchDate: '2023-10-01T12:00:00.000Z',
        },
      },
      description: 'Partial payload of the tool fields to update',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tool updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tool updated successfully' },
          tool: {
            type: 'object',
            properties: toolSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
    ApiConflictErrorResponse('Slug already exists'),
  );
}

export function ApiDeleteToolDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a tool' }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the tool',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tool deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tool deleted successfully' },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse(),
  );
}
