import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  analyticsEventTypes,
  analyticsPeriods,
  deviceTypes,
} from './analytics.validation.schema';

const toolProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  name: { type: 'string', example: 'Descript' },
  slug: { type: 'string', example: 'descript' },
  logo: {
    type: 'string',
    nullable: true,
    example: 'https://example.com/logo.png',
  },
  tagline: {
    type: 'string',
    nullable: true,
    example: 'There is a new way to make video and podcasts.',
  },
  rating: {
    type: 'object',
    properties: {
      average: { type: 'number', example: 4.8 },
      count: { type: 'number', example: 120 },
    },
  },
};

const deviceBreakdownProperties = {
  desktop: { type: 'number', example: 1250 },
  mobile: { type: 'number', example: 820 },
  tablet: { type: 'number', example: 130 },
};

const topReferrerProperties = {
  referrer: { type: 'string', example: 'google_com' },
  count: { type: 'number', example: 450 },
};

const dailyAnalyticsProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8e' },
  tool: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  date: {
    type: 'string',
    format: 'date-time',
    example: '2026-08-30T00:00:00.000Z',
  },
  views: { type: 'number', example: 145 },
  clicks: { type: 'number', example: 42 },
  saves: { type: 'number', example: 18 },
  searchImpressions: { type: 'number', example: 320 },
  devices: {
    type: 'object',
    properties: deviceBreakdownProperties,
  },
  referrers: {
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { google_com: 80, twitter_com: 25, direct: 40 },
  },
};

const dailyTimelineProperties = {
  date: {
    type: 'string',
    format: 'date-time',
    example: '2026-08-30T00:00:00.000Z',
  },
  views: { type: 'number', example: 450 },
  clicks: { type: 'number', example: 120 },
  saves: { type: 'number', example: 55 },
  searchImpressions: { type: 'number', example: 1200 },
};

const topToolItemProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  views: { type: 'number', example: 3400 },
  clicks: { type: 'number', example: 890 },
  saves: { type: 'number', example: 310 },
  searchImpressions: { type: 'number', example: 7800 },
  tool: {
    type: 'object',
    properties: toolProperties,
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

const ApiNotFoundErrorResponse = (resource = 'Tool') =>
  ApiErrorResponse(HttpStatus.NOT_FOUND, `${resource} is not found`);

export function ApiGetAnalyticsOverviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get site-wide analytics overview for Admin dashboard',
    }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: [...analyticsPeriods],
      example: '30d',
      description: 'Predefined time range filter (default: 30d)',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      example: '2026-08-01T00:00:00.000Z',
      description: 'Custom starting date (ISO format)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      example: '2026-08-31T23:59:59.999Z',
      description: 'Custom ending date (ISO format)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Max number of top tools to return (1 to 100, default: 10)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Analytics overview successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Analytics overview successfully retrieved',
          },
          period: { type: 'string', example: '30d' },
          from: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-01T00:00:00.000Z',
          },
          to: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-31T23:59:59.999Z',
          },
          summary: {
            type: 'object',
            properties: {
              views: { type: 'number', example: 45200 },
              clicks: { type: 'number', example: 12400 },
              saves: { type: 'number', example: 3800 },
              searchImpressions: { type: 'number', example: 98000 },
            },
          },
          devices: {
            type: 'object',
            properties: deviceBreakdownProperties,
          },
          topTools: {
            type: 'array',
            items: {
              type: 'object',
              properties: topToolItemProperties,
            },
          },
          daily: {
            type: 'array',
            items: {
              type: 'object',
              properties: dailyTimelineProperties,
            },
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}

export function ApiGetToolAnalyticsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get detailed time-series analytics for a single tool',
    }),
    ApiParam({
      name: 'identifier',
      type: 'string',
      description: 'Tool slug or MongoDB ObjectId',
      example: 'descript',
    }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: [...analyticsPeriods],
      example: '30d',
      description: 'Predefined time range (default: 30d)',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      example: '2026-08-01T00:00:00.000Z',
      description: 'Custom start date',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      example: '2026-08-31T23:59:59.999Z',
      description: 'Custom end date',
    }),
    ApiQuery({
      name: 'days',
      required: false,
      type: Number,
      example: 30,
      description: 'Number of days to look back (1 to 365)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tool analytics successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Tool analytics successfully retrieved',
          },
          tool: {
            type: 'object',
            properties: toolProperties,
          },
          period: { type: 'string', example: '30d' },
          from: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-01T00:00:00.000Z',
          },
          to: {
            type: 'string',
            format: 'date-time',
            example: '2026-08-31T23:59:59.999Z',
          },
          totals: {
            type: 'object',
            properties: {
              views: { type: 'number', example: 2840 },
              clicks: { type: 'number', example: 740 },
              saves: { type: 'number', example: 215 },
              searchImpressions: { type: 'number', example: 6200 },
              devices: {
                type: 'object',
                properties: deviceBreakdownProperties,
              },
            },
          },
          topReferrers: {
            type: 'array',
            items: {
              type: 'object',
              properties: topReferrerProperties,
            },
          },
          daily: {
            type: 'array',
            items: {
              type: 'object',
              properties: dailyAnalyticsProperties,
            },
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse('Tool'),
  );
}

export function ApiTrackEventDocs() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Track an analytics event (view, click, save, search impression)',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['tool', 'event'],
        properties: {
          tool: {
            type: 'string',
            example: '60c72b2f9b1d8b001c8e4b8a',
            description: 'Target Tool MongoDB ObjectId',
          },
          event: {
            type: 'string',
            enum: [...analyticsEventTypes],
            example: 'views',
            description: 'Event type to track',
          },
          device: {
            type: 'string',
            enum: [...deviceTypes],
            example: 'desktop',
            description: 'Device type (optional)',
          },
          referrer: {
            type: 'string',
            example: 'https://twitter.com/edithacker',
            description: 'Referrer URL or domain (optional)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Analytics event tracked successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Analytics event tracked successfully',
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
  );
}
