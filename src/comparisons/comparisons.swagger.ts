import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

const toolProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  name: { type: 'string', example: 'React' },
  slug: { type: 'string', example: 'react' },
  tagline: {
    type: 'string',
    example: 'A JavaScript library for building user interfaces',
  },
  logo: { type: 'string', example: 'https://example.com/logo.png' },
};

const comparisonSchemaProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8a' },
  title: { type: 'string', example: 'React vs Angular' },
  slug: { type: 'string', example: 'react-vs-angular' },
  type: { type: 'string', enum: ['editorial', 'user'], example: 'editorial' },
  isPublished: { type: 'boolean', example: true },
  viewCount: { type: 'number', example: 1250 },
  summary: {
    type: 'string',
    example: 'An in-depth comparison of React and Angular for enterprise apps.',
  },
  createdAt: {
    type: 'string',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  },
  updatedAt: {
    type: 'string',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  },
  createdBy: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8b' },
      name: { type: 'string', example: 'John Doe' },
    },
  },
  tools: {
    type: 'array',
    items: {
      type: 'object',
      properties: toolProperties,
    },
  },
  winner: {
    type: 'object',
    nullable: true,
    properties: toolProperties,
  },
};

export function ApiGetComparisonsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all comparisons with pagination and filtering',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'type', required: false, enum: ['editorial', 'user'] }),
    ApiQuery({
      name: 'isPublished',
      required: false,
      type: String,
      description: 'true or false',
    }),
    ApiQuery({
      name: 'tools',
      required: false,
      type: [String],
      description: 'Array of Tool IDs',
    }),
    ApiQuery({
      name: 'winner',
      required: false,
      type: String,
      description: 'Winner Tool ID',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['public', 'mine'],
      example: 'public',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['createdAt', 'updatedAt', 'title', 'viewCount'],
    }),
    ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] }),
    ApiResponse({
      status: 200,
      description: 'Comparisons successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Comparisons fetched successfully',
          },
          data: {
            type: 'object',
            properties: {
              comparisons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: comparisonSchemaProperties,
                },
              },
              meta: {
                type: 'object',
                properties: {
                  totalComparisons: { type: 'number', example: 100 },
                  limit: { type: 'number', example: 10 },
                  totalPages: { type: 'number', example: 10 },
                  page: { type: 'number', example: 1 },
                  pagingCounter: { type: 'number', example: 1 },
                  hasPrevPage: { type: 'boolean', example: false },
                  hasNextPage: { type: 'boolean', example: true },
                  prevPage: { type: 'number', nullable: true, example: null },
                  nextPage: { type: 'number', nullable: true, example: 2 },
                },
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiGetComparisonDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single comparison by ID or Slug' }),
    ApiParam({
      name: 'identifier',
      description: 'Comparison ID or Slug',
      example: 'react-vs-angular',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['public', 'mine'],
      example: 'public',
    }),
    ApiResponse({
      status: 200,
      description: 'Comparison fetched successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Comparison fetched successfully',
          },
          data: {
            type: 'object',
            properties: {
              comparison: {
                type: 'object',
                properties: comparisonSchemaProperties,
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Comparison not found' }),
  );
}

export function ApiCheckComparisonSlugAvailabilityDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Check if a comparison slug is available' }),
    ApiParam({
      name: 'slug',
      description: 'Slug to check',
      example: 'react-vs-angular',
    }),
    ApiResponse({
      status: 200,
      description: 'Slug availability checked successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Slug availability checked successfully',
          },
          data: {
            type: 'object',
            properties: {
              isAvailable: { type: 'boolean', example: true },
              message: {
                type: 'string',
                example: "Slug 'react-vs-angular' is available",
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiCreateComparisonDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new comparison' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['title', 'slug', 'tools'],
        properties: {
          title: { type: 'string', example: 'React vs Angular' },
          slug: { type: 'string', example: 'react-vs-angular' },
          tools: {
            type: 'array',
            items: { type: 'string' },
            example: ['60c72b2f9b1d8b001c8e4b8a', '60c72b2f9b1d8b001c8e4b8b'],
          },
          type: {
            type: 'string',
            enum: ['editorial', 'user'],
            example: 'editorial',
          },
          isPublished: { type: 'boolean', example: true },
          winner: {
            type: 'string',
            example: '60c72b2f9b1d8b001c8e4b8a',
            nullable: true,
          },
          summary: { type: 'string', example: 'React is highly flexible...' },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Comparison created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Comparison created successfully',
          },
          data: {
            type: 'object',
            properties: {
              comparison: {
                type: 'object',
                properties: comparisonSchemaProperties,
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Slug already taken or validation error',
    }),
  );
}

export function ApiUpdateComparisonDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing comparison' }),
    ApiParam({
      name: 'id',
      description: 'Comparison ID',
      example: '60c72b2f9b1d8b001c8e4b8a',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'React vs Vue' },
          slug: { type: 'string', example: 'react-vs-vue' },
          tools: {
            type: 'array',
            items: { type: 'string' },
            example: ['60c72b2f9b1d8b001c8e4b8a', '60c72b2f9b1d8b001c8e4b8c'],
          },
          type: {
            type: 'string',
            enum: ['editorial', 'user'],
            example: 'editorial',
          },
          isPublished: { type: 'boolean', example: false },
          winner: {
            type: 'string',
            example: '60c72b2f9b1d8b001c8e4b8c',
            nullable: true,
          },
          summary: { type: 'string', example: 'Vue is also great...' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Comparison updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Comparison updated successfully',
          },
          data: {
            type: 'object',
            properties: {
              comparison: {
                type: 'object',
                properties: comparisonSchemaProperties,
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Comparison not found' }),
  );
}

export function ApiDeleteComparisonDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a comparison' }),
    ApiParam({
      name: 'id',
      description: 'Comparison ID',
      example: '60c72b2f9b1d8b001c8e4b8a',
    }),
    ApiResponse({
      status: 200,
      description: 'Comparison deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Comparison deleted successfully',
          },
          data: {
            type: 'object',
            properties: {},
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Comparison not found' }),
  );
}
