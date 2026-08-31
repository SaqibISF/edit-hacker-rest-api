import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  adPackages,
  adPaymentStatuses,
  adPlacements,
  adStatuses,
} from './advertisement.schema';
import { sortOrders } from '../zod-schemas/base-query.schema';

const userProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8b' },
  name: { type: 'string', example: 'John Advertiser' },
  avatarUrl: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/avatar.png',
  },
  email: { type: 'string', example: 'advertiser@example.com' },
};

const toolProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  name: { type: 'string', example: 'Descript' },
  slug: { type: 'string', example: 'descript' },
  tagline: {
    type: 'string',
    nullable: true,
    example: 'There is a new way to make video and podcasts.',
  },
  logo: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/logo.png',
  },
};

const categoryProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8c' },
  name: { type: 'string', example: 'Video Editing' },
  slug: { type: 'string', example: 'video-editing' },
  icon: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/icon.png',
  },
};

const advertisementSchemaProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8f' },
  title: {
    type: 'string',
    example: 'Boost Your Productivity with AI Video Tools',
  },
  description: {
    type: 'string',
    nullable: true,
    example:
      'Edit podcasts and videos 10x faster with AI automated transcripts.',
  },
  logoUrl: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/ad-logo.png',
  },
  ctaText: { type: 'string', example: 'Try Free →' },
  ctaUrl: {
    type: 'string',
    example: 'https://example.com/promotions/ai-tools',
  },
  placement: {
    type: 'string',
    enum: [...adPlacements],
    example: 'homepage-banner',
  },
  startDate: {
    type: 'string',
    format: 'date-time',
    example: '2026-09-01T00:00:00.000Z',
  },
  endDate: {
    type: 'string',
    format: 'date-time',
    example: '2026-10-01T00:00:00.000Z',
  },
  package: {
    type: 'string',
    enum: [...adPackages],
    example: 'standard',
  },
  priceUSD: { type: 'number', example: 299 },
  paymentStatus: {
    type: 'string',
    enum: [...adPaymentStatuses],
    example: 'paid',
  },
  paymentId: {
    type: 'string',
    nullable: true,
    example: 'pi_3K24k4K3J4234',
  },
  status: {
    type: 'string',
    enum: [...adStatuses],
    example: 'active',
  },
  impressions: { type: 'number', example: 4520 },
  clicks: { type: 'number', example: 380 },
  createdAt: {
    type: 'string',
    format: 'date-time',
    example: '2026-08-31T00:00:00.000Z',
  },
  updatedAt: {
    type: 'string',
    format: 'date-time',
    example: '2026-08-31T00:00:00.000Z',
  },
  advertiser: {
    type: 'object',
    properties: userProperties,
  },
  tool: {
    type: 'object',
    nullable: true,
    properties: toolProperties,
  },
  targetCategories: {
    type: 'array',
    items: {
      type: 'object',
      properties: categoryProperties,
    },
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

const ApiNotFoundErrorResponse = (resource = 'Advertisement') =>
  ApiErrorResponse(HttpStatus.NOT_FOUND, `${resource} not found`);

export function ApiGetAdvertisementsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of advertisements with filters',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Page number (default: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Items per page (default: 10)',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Full-text search query across title, description, ctaText',
    }),
    ApiQuery({
      name: 'placement',
      required: false,
      enum: [...adPlacements],
      description: 'Filter by ad placement location',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: [...adStatuses],
      description: 'Filter by ad status',
    }),
    ApiQuery({
      name: 'package',
      required: false,
      enum: [...adPackages],
      description: 'Filter by ad package tier',
    }),
    ApiQuery({
      name: 'paymentStatus',
      required: false,
      enum: [...adPaymentStatuses],
      description: 'Filter by payment status',
    }),
    ApiQuery({
      name: 'advertiser',
      required: false,
      type: String,
      description: 'Filter by advertiser User ObjectId (Admin only)',
      example: '60c72b2f9b1d8b001c8e4b8b',
    }),
    ApiQuery({
      name: 'tool',
      required: false,
      type: String,
      description: 'Filter by associated Tool ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8a',
    }),
    ApiQuery({
      name: 'targetCategory',
      required: false,
      type: String,
      description: 'Filter by target Category ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8c',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['public', 'mine'],
      example: 'public',
      description:
        'Scope: "public" for active ads or "mine" for user campaigns',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      example: '2026-09-01T00:00:00.000Z',
      description: 'Filter ads starting from date',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      example: '2026-10-01T00:00:00.000Z',
      description: 'Filter ads ending before date',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: [
        'createdAt',
        'updatedAt',
        'startDate',
        'endDate',
        'impressions',
        'clicks',
        'priceUSD',
        'title',
      ],
      example: 'createdAt',
      description: 'Sort field (default: createdAt)',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: [...sortOrders],
      example: 'DESC',
      description: 'Sort order direction ("ASC" or "DESC")',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisements successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisements successfully retrieved',
          },
          advertisements: {
            type: 'array',
            items: {
              type: 'object',
              properties: advertisementSchemaProperties,
            },
          },
          meta: {
            type: 'object',
            properties: {
              totalAdvertisements: { type: 'number', example: 12 },
              limit: { type: 'number', example: 10 },
              page: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 2 },
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

export function ApiGetAdvertisementDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single advertisement by ID' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Advertisement MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8f',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['public', 'mine'],
      example: 'public',
      description: 'Query scope ("public" or "mine")',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisement successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisement successfully retrieved',
          },
          advertisement: {
            type: 'object',
            properties: advertisementSchemaProperties,
          },
        },
      },
    }),
    ApiNotFoundErrorResponse('Advertisement'),
    ApiUnauthorizedErrorResponse(),
  );
}

export function ApiCreateAdvertisementDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new advertisement campaign' }),
    ApiBody({
      schema: {
        type: 'object',
        required: [
          'title',
          'ctaUrl',
          'placement',
          'startDate',
          'endDate',
          'priceUSD',
        ],
        properties: {
          tool: {
            type: 'string',
            nullable: true,
            example: '60c72b2f9b1d8b001c8e4b8a',
            description: 'Optional associated Tool ObjectId',
          },
          title: {
            type: 'string',
            example: 'Boost Your Productivity with AI Video Tools',
          },
          description: {
            type: 'string',
            example: 'Edit podcasts and videos 10x faster with AI.',
          },
          logoUrl: {
            type: 'string',
            example: 'https://example.com/logo.png',
          },
          ctaText: { type: 'string', example: 'Try Free →' },
          ctaUrl: {
            type: 'string',
            example: 'https://example.com/promotions/ai-tools',
          },
          placement: {
            type: 'string',
            enum: [...adPlacements],
            example: 'homepage-banner',
          },
          targetCategories: {
            type: 'array',
            items: { type: 'string' },
            example: ['60c72b2f9b1d8b001c8e4b8c'],
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-09-01T00:00:00.000Z',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-10-01T00:00:00.000Z',
          },
          package: {
            type: 'string',
            enum: [...adPackages],
            example: 'standard',
          },
          priceUSD: { type: 'number', example: 299 },
          paymentStatus: {
            type: 'string',
            enum: [...adPaymentStatuses],
            example: 'pending',
          },
          paymentId: { type: 'string', example: 'pi_3K24k4K3J4234' },
          status: {
            type: 'string',
            enum: [...adStatuses],
            example: 'pending',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Advertisement created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisement created successfully',
          },
          advertisement: {
            type: 'object',
            properties: advertisementSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
  );
}

export function ApiUpdateAdvertisementDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an advertisement campaign' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Advertisement MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8f',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated Ad Title' },
          description: { type: 'string', example: 'Updated Ad Description' },
          ctaText: { type: 'string', example: 'Explore Now →' },
          ctaUrl: { type: 'string', example: 'https://example.com/updated' },
          placement: { type: 'string', enum: [...adPlacements] },
          targetCategories: {
            type: 'array',
            items: { type: 'string' },
          },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          package: { type: 'string', enum: [...adPackages] },
          priceUSD: { type: 'number', example: 499 },
          paymentStatus: { type: 'string', enum: [...adPaymentStatuses] },
          status: { type: 'string', enum: [...adStatuses] },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisement updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisement updated successfully',
          },
          advertisement: {
            type: 'object',
            properties: advertisementSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Advertisement'),
  );
}

export function ApiUpdateAdLogoDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update advertisement logo image' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Advertisement MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8f',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['logo'],
        properties: {
          logo: {
            type: 'string',
            format: 'binary',
            description: 'Image file (jpg, jpeg, png, webp, svg)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisement logo updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisement logo updated successfully',
          },
          advertisement: {
            type: 'object',
            properties: advertisementSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Advertisement'),
  );
}

export function ApiRemoveAdLogoDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove advertisement logo image' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Advertisement MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8f',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisement logo removed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisement logo removed successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Advertisement'),
  );
}

export function ApiDeleteAdvertisementDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an advertisement' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Advertisement MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8f',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisement deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Advertisement deleted successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Advertisement'),
  );
}

export function ApiTrackAdActionDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Track advertisement impression or click action',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Advertisement MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8f',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['impression', 'click'],
            example: 'click',
            description: 'Telemetry action to register',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Advertisement action tracked successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          ctaUrl: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/promotions/ai-tools',
          },
          impressions: { type: 'number', example: 4521 },
          clicks: { type: 'number', example: 381 },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiNotFoundErrorResponse('Advertisement'),
  );
}
