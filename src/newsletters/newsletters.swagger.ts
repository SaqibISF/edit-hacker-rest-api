import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { newsletterStatuses, newsletterSources } from './newsletter.schema';

const TIMESTAMP_EXAMPLE = '2023-10-01T12:00:00.000Z';

const preferencesSchemaProperties = {
  weeklyDigest: { type: 'boolean', example: true },
  newTools: { type: 'boolean', example: true },
  deals: { type: 'boolean', example: true },
  tutorials: { type: 'boolean', example: false },
};

export const newsletterSchemaProperties = {
  _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
  email: { type: 'string', example: 'user@example.com' },
  name: { type: 'string', example: 'John Doe' },
  user: { type: 'string', example: '60d0fe4f5311236168a109cb' },
  status: {
    type: 'string',
    enum: [...newsletterStatuses],
    example: 'confirmed',
  },
  confirmedAt: { type: 'string', format: 'date-time' },
  unsubscribedAt: { type: 'string', format: 'date-time' },
  preferences: {
    type: 'object',
    properties: preferencesSchemaProperties,
  },
  source: {
    type: 'string',
    enum: [...newsletterSources],
    example: 'homepage',
  },
  emailsSent: { type: 'number', example: 5 },
  emailsOpened: { type: 'number', example: 3 },
  createdAt: {
    type: 'string',
    format: 'date-time',
    example: TIMESTAMP_EXAMPLE,
  },
  updatedAt: {
    type: 'string',
    format: 'date-time',
    example: TIMESTAMP_EXAMPLE,
  },
};

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

const ApiValidationErrorResponse = () =>
  ErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Validation error',
    'Validation failed',
  );
const ApiUnauthorizedErrorResponse = () =>
  ErrorResponse(HttpStatus.UNAUTHORIZED, 'Unauthorized', 'Unauthorized access');
const ApiForbiddenErrorResponse = () =>
  ErrorResponse(HttpStatus.FORBIDDEN, 'Forbidden', 'Forbidden access');
const ApiNotFoundErrorResponse = (msg = 'Not found') =>
  ErrorResponse(HttpStatus.NOT_FOUND, 'Not Found', msg);
const ApiConflictErrorResponse = (msg = 'Conflict') =>
  ErrorResponse(HttpStatus.CONFLICT, 'Conflict', msg);

export function ApiGetNewslettersDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all newsletter subscriptions with pagination (Admin)',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: newsletterStatuses,
    }),
    ApiQuery({
      name: 'source',
      required: false,
      enum: newsletterSources,
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['createdAt', 'updatedAt', 'email'],
      example: 'createdAt',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Newsletters successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Newsletters successfully retrieved',
          },
          newsletters: {
            type: 'array',
            items: { type: 'object', properties: newsletterSchemaProperties },
          },
          meta: {
            type: 'object',
            properties: {
              totalNewsletters: { type: 'number', example: 100 },
              limit: { type: 'number', example: 10 },
              page: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 10 },
              nextPage: { type: 'number', example: 2, nullable: true },
              prevPage: { type: 'number', example: null, nullable: true },
              pageStart: { type: 'number', example: 1 },
              hasPrevPage: { type: 'boolean', example: false },
              hasNextPage: { type: 'boolean', example: true },
            },
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}

export function ApiSubscribeNewsletterDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Subscribe to the newsletter' }),
    ApiBody({
      schema: {
        type: 'object',
        example: {
          email: 'user@example.com',
          name: 'John Doe',
          source: 'homepage',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Subscription pending. Please check your email to confirm.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example:
              'Subscription pending. Please check your email to confirm.',
          },
          newsletter: {
            type: 'object',
            properties: newsletterSchemaProperties,
          },
        },
      },
    }),
    ApiConflictErrorResponse('Email is already subscribed'),
    ApiValidationErrorResponse(),
  );
}

export function ApiConfirmNewsletterDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Confirm a newsletter subscription via token' }),
    ApiParam({
      name: 'token',
      type: String,
      description: 'Confirmation token from email',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Subscription confirmed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Subscription confirmed successfully',
          },
          newsletter: {
            type: 'object',
            properties: newsletterSchemaProperties,
          },
        },
      },
    }),
    ApiNotFoundErrorResponse('Confirmation link is invalid or has expired'),
  );
}

export function ApiUnsubscribeNewsletterDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Unsubscribe from the newsletter via token' }),
    ApiParam({
      name: 'token',
      type: String,
      description: 'Unsubscribe token from email',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'You have been unsubscribed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'You have been unsubscribed successfully',
          },
          newsletter: {
            type: 'object',
            properties: newsletterSchemaProperties,
          },
        },
      },
    }),
    ApiNotFoundErrorResponse('Invalid unsubscribe link'),
  );
}

export function ApiUpdateNewsletterPreferencesDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update newsletter preferences (User/Admin)' }),
    ApiBody({
      schema: {
        type: 'object',
        example: {
          weeklyDigest: false,
          deals: true,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Preferences updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Preferences updated successfully',
          },
          newsletter: {
            type: 'object',
            properties: newsletterSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Newsletter subscription not found'),
    ApiValidationErrorResponse(),
  );
}

export function ApiUpdateNewsletterDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update newsletter subscription manually (Admin)',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the newsletter subscription',
    }),
    ApiBody({
      schema: {
        type: 'object',
        example: {
          name: 'Jane Doe',
          status: 'confirmed',
          emailsSent: 12,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Newsletter subscription updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Newsletter subscription updated successfully',
          },
          newsletter: {
            type: 'object',
            properties: newsletterSchemaProperties,
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Newsletter subscription not found'),
    ApiValidationErrorResponse(),
  );
}

export function ApiDeleteNewsletterDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a newsletter subscription (Admin)' }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'MongoDB ID of the newsletter subscription',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Newsletter subscription deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Newsletter subscription deleted successfully',
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Newsletter subscription not found'),
  );
}
