import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  reviewStatuses,
  reviewUsagePeriods,
  reviewVotes,
} from './review.schema';
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

const ratingProperties = {
  overall: {
    type: 'number',
    minimum: 1,
    maximum: 5,
    example: 5,
    description: 'Overall review rating (1 to 5)',
  },
  easeOfUse: {
    type: 'number',
    minimum: 1,
    maximum: 5,
    nullable: true,
    example: 4,
    description: 'Rating for ease of use (optional, 1 to 5)',
  },
  valueForMoney: {
    type: 'number',
    minimum: 1,
    maximum: 5,
    nullable: true,
    example: 5,
    description: 'Rating for value for money (optional, 1 to 5)',
  },
  features: {
    type: 'number',
    minimum: 1,
    maximum: 5,
    nullable: true,
    example: 5,
    description: 'Rating for features and functionality (optional, 1 to 5)',
  },
  support: {
    type: 'number',
    minimum: 1,
    maximum: 5,
    nullable: true,
    example: 4,
    description: 'Rating for customer support (optional, 1 to 5)',
  },
};

const reviewSchemaProperties = {
  _id: { type: 'string', example: '60c72b2f9b1d8b001c8e4b8c' },
  title: {
    type: 'string',
    example: 'Fantastic tool for video editing',
    description: 'Review title (max 120 chars)',
  },
  description: {
    type: 'string',
    example:
      'This tool completely transformed my editing workflow. It saves me hours each week.',
    description: 'Full review text (20 to 2000 chars)',
  },
  rating: {
    type: 'object',
    properties: ratingProperties,
  },
  pros: {
    type: 'array',
    items: { type: 'string' },
    example: ['Fast workflow', 'Clean UI', 'Great AI features'],
    description: 'List of positive aspects / pros',
  },
  cons: {
    type: 'array',
    items: { type: 'string' },
    example: ['Occasional export delay'],
    description: 'List of drawbacks / cons',
  },
  usagePeriod: {
    type: 'string',
    enum: [...reviewUsagePeriods],
    example: '6-12-months',
    description: 'How long the user has used the tool',
  },
  useCase: {
    type: 'string',
    nullable: true,
    example: 'Editing YouTube videos',
    description: 'Specific use case (max 200 chars)',
  },
  status: {
    type: 'string',
    enum: [...reviewStatuses],
    example: 'approved',
    description: 'Moderation status of the review',
  },
  helpfulVotes: {
    type: 'number',
    example: 12,
    description: 'Total number of helpful votes',
  },
  unhelpfulVotes: {
    type: 'number',
    example: 1,
    description: 'Total number of unhelpful votes',
  },
  isVerifiedPurchase: {
    type: 'boolean',
    example: true,
    description: 'Indicates if the reviewer is a verified user/customer',
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
  user: {
    type: 'object',
    properties: userProperties,
  },
  tool: {
    type: 'object',
    properties: toolProperties,
  },
  userVote: {
    type: 'string',
    enum: [...reviewVotes],
    nullable: true,
    example: 'helpful',
    description: 'The current authenticated user vote on this review, if any',
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

const ApiNotFoundErrorResponse = (resource = 'Review') =>
  ApiErrorResponse(HttpStatus.NOT_FOUND, `${resource} not found`);

const ApiConflictErrorResponse = (message = 'Conflict') =>
  ApiErrorResponse(HttpStatus.CONFLICT, message);

export function ApiGetReviewsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of reviews with optional filters',
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
      description:
        'Text search query across review title, description, pros, cons, and use case',
    }),
    ApiQuery({
      name: 'tool',
      required: false,
      type: String,
      description: 'Filter reviews by Tool MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8a',
    }),
    ApiQuery({
      name: 'user',
      required: false,
      type: String,
      description: 'Filter reviews by Author User MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8b',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: [...reviewStatuses],
      description:
        'Filter by review status (admin or when querying own reviews)',
    }),
    ApiQuery({
      name: 'usagePeriod',
      required: false,
      enum: [...reviewUsagePeriods],
      description: 'Filter reviews by usage duration period',
    }),
    ApiQuery({
      name: 'rating',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 5,
      example: 5,
      description: 'Filter by overall star rating (1 to 5)',
    }),
    ApiQuery({
      name: 'isVerifiedPurchase',
      required: false,
      type: String,
      enum: ['true', 'false'],
      description: 'Filter by verified purchase flag ("true" or "false")',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['public', 'mine'],
      example: 'public',
      description:
        'Query scope: "public" for approved reviews, "mine" for authenticated user own reviews',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: [
        'createdAt',
        'updatedAt',
        'helpfulVotes',
        'unhelpfulVotes',
        'rating.overall',
      ],
      example: 'createdAt',
      description: 'Field to sort reviews by (default: createdAt)',
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
      description: 'Reviews fetched successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Reviews fetched successfully' },
          reviews: {
            type: 'array',
            items: {
              type: 'object',
              properties: reviewSchemaProperties,
            },
          },
          meta: {
            type: 'object',
            properties: {
              totalReviews: { type: 'number', example: 100 },
              limit: { type: 'number', example: 10 },
              page: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 10 },
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
    ApiUnauthorizedErrorResponse('You must be logged in to view your reviews'),
  );
}

export function ApiGetToolReviewSummaryDocs() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get review summary, rating breakdown, and star distribution for a tool',
    }),
    ApiParam({
      name: 'toolId',
      type: 'string',
      description: 'Tool MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8a',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tool review summary fetched successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Tool review summary fetched successfully',
          },
          summary: {
            type: 'object',
            properties: {
              totalReviews: { type: 'number', example: 25 },
              averageRating: { type: 'number', example: 4.8 },
              aspects: {
                type: 'object',
                properties: {
                  easeOfUse: {
                    type: 'number',
                    nullable: true,
                    example: 4.5,
                  },
                  valueForMoney: {
                    type: 'number',
                    nullable: true,
                    example: 4.7,
                  },
                  features: {
                    type: 'number',
                    nullable: true,
                    example: 4.9,
                  },
                  support: {
                    type: 'number',
                    nullable: true,
                    example: 4.6,
                  },
                },
              },
              distribution: {
                type: 'object',
                properties: {
                  5: { type: 'number', example: 20 },
                  4: { type: 'number', example: 4 },
                  3: { type: 'number', example: 1 },
                  2: { type: 'number', example: 0 },
                  1: { type: 'number', example: 0 },
                },
              },
            },
          },
        },
      },
    }),
    ApiValidationErrorResponse('Invalid MongoDB ID'),
    ApiNotFoundErrorResponse('Tool'),
  );
}

export function ApiGetReviewDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single review by ID' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Review MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8c',
    }),
    ApiQuery({
      name: 'scope',
      required: false,
      enum: ['public', 'mine'],
      example: 'public',
      description:
        'Query scope: "public" for approved reviews, "mine" for own review',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review fetched successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Review fetched successfully' },
          review: {
            type: 'object',
            properties: reviewSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse('Invalid MongoDB ID'),
    ApiUnauthorizedErrorResponse('You must be logged in to view your review'),
    ApiNotFoundErrorResponse('Review'),
  );
}

export function ApiCreateReviewDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a review for a tool' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['tool', 'title', 'description', 'usagePeriod'],
        properties: {
          tool: {
            type: 'string',
            example: '60c72b2f9b1d8b001c8e4b8a',
            description: 'Target Tool MongoDB ObjectId',
          },
          title: {
            type: 'string',
            example: 'Fantastic tool for video editing',
            description: 'Review title (max 120 chars)',
          },
          description: {
            type: 'string',
            example:
              'This tool completely transformed my editing workflow. It saves me hours each week.',
            description: 'Review description (20 to 2000 chars)',
          },
          rating: {
            type: 'object',
            required: ['overall'],
            properties: ratingProperties,
            description: 'Detailed rating aspects',
          },
          pros: {
            type: 'array',
            items: { type: 'string' },
            example: ['Fast workflow', 'Clean UI'],
            description: 'List of pros',
          },
          cons: {
            type: 'array',
            items: { type: 'string' },
            example: ['Slight learning curve'],
            description: 'List of cons',
          },
          usagePeriod: {
            type: 'string',
            enum: [...reviewUsagePeriods],
            example: '6-12-months',
            description: 'How long you have used the tool',
          },
          useCase: {
            type: 'string',
            example: 'Editing YouTube videos',
            description: 'Your primary use case (max 200 chars)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Review created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Review created successfully' },
          review: {
            type: 'object',
            properties: reviewSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Tool'),
    ApiConflictErrorResponse(
      'You have already submitted a review for this tool',
    ),
  );
}

export function ApiUpdateReviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a review (Content by author / Status by Admin)',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Review MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8c',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Updated review title',
            description: 'Updated review title',
          },
          description: {
            type: 'string',
            example: 'Updated review description...',
            description: 'Updated review body',
          },
          rating: {
            type: 'object',
            properties: ratingProperties,
            description: 'Updated ratings',
          },
          pros: {
            type: 'array',
            items: { type: 'string' },
            example: ['Fast workflow'],
            description: 'Updated list of pros',
          },
          cons: {
            type: 'array',
            items: { type: 'string' },
            example: ['Price'],
            description: 'Updated list of cons',
          },
          usagePeriod: {
            type: 'string',
            enum: [...reviewUsagePeriods],
            description: 'Updated usage period',
          },
          useCase: {
            type: 'string',
            example: 'Podcast editing',
            description: 'Updated use case',
          },
          status: {
            type: 'string',
            enum: [...reviewStatuses],
            description:
              'Moderation status update (Admin only: pending, approved, rejected, flagged)',
          },
          isVerifiedPurchase: {
            type: 'boolean',
            description: 'Verified purchase flag (Admin only)',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Review updated successfully' },
          review: {
            type: 'object',
            properties: reviewSchemaProperties,
          },
        },
      },
    }),
    ApiValidationErrorResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Review'),
  );
}

export function ApiVoteReviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Vote on a review (helpful or unhelpful). Calling with the same vote toggles it off.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Review MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8c',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['vote'],
        properties: {
          vote: {
            type: 'string',
            enum: [...reviewVotes],
            example: 'helpful',
            description: 'Vote choice: "helpful" or "unhelpful"',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Vote registered successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Vote registered successfully' },
          helpfulVotes: {
            type: 'number',
            example: 13,
            description: 'Updated total helpful votes count',
          },
          unhelpfulVotes: {
            type: 'number',
            example: 1,
            description: 'Updated total unhelpful votes count',
          },
          userVote: {
            type: 'string',
            enum: [...reviewVotes],
            nullable: true,
            example: 'helpful',
            description:
              'The current active vote for the user, or null if toggled off',
          },
        },
      },
    }),
    ApiValidationErrorResponse(
      'Invalid vote, self-voting attempt, or review is not approved',
    ),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Review'),
  );
}

export function ApiDeleteReviewDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a review by ID (Author or Admin)' }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Review MongoDB ObjectId',
      example: '60c72b2f9b1d8b001c8e4b8c',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Review deleted successfully' },
        },
      },
    }),
    ApiValidationErrorResponse('Invalid MongoDB ID'),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Review'),
  );
}
