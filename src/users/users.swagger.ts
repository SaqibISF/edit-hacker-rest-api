import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

const TIMESTAMP_EXAMPLE = '2026-08-11T04:22:27.746Z';

const USER_SCHEMA_PROPERTIES = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    name: { type: 'string' },
    slug: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string', enum: ['admin', 'user'] },
    avatarUrl: { type: 'string' },
    mobile: { type: 'string' },
    emailVerifiedAt: { type: 'string', format: 'date-time' },
    passwordResetAt: { type: 'string', format: 'date-time' },
    lastLoginAt: { type: 'string', format: 'date-time' },
    bannedAt: { type: 'string', format: 'date-time' },
    banReason: { type: 'string' },
    provider: { type: 'string', enum: ['local', 'google', 'github'] },
    providerId: { type: 'string', nullable: true },
    newsletter: { type: 'boolean' },
    savedTools: {
      type: 'array',
      items: { type: 'string' },
    },
    deletedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const USER_EXAMPLE = {
  _id: '64d3e2b5f1a2c3d4e5f6g7h8',
  name: 'John Doe',
  slug: 'john-doe',
  email: 'john.doe@example.com',
  role: 'user',
  avatarUrl: 'https://example.com/avatar.jpg',
  mobile: '+1234567890',
  emailVerifiedAt: TIMESTAMP_EXAMPLE,
  passwordResetAt: TIMESTAMP_EXAMPLE,
  lastLoginAt: TIMESTAMP_EXAMPLE,
  provider: 'local',
  providerId: null,
  newsletter: false,
  savedTools: ['60d0fe4f5311236168a109ca'],
  createdAt: TIMESTAMP_EXAMPLE,
  updatedAt: TIMESTAMP_EXAMPLE,
};

const UnauthorizedResponse = ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Unauthorized, invalid token: token not found',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'false' },
          message: { type: 'string' },
          statusCode: { type: 'number' },
          timestamp: { type: 'string' },
        },
        example: {
          success: false,
          message: 'Unauthorized, invalid token: token not found',
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp: TIMESTAMP_EXAMPLE,
        },
      },
    },
  },
});

export function ApiGetUsersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all users' }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10)',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort order',
    }),
    ApiQuery({
      name: 'role',
      required: false,
      enum: ['admin', 'user'],
      description: 'Filter by user role',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['active', 'banned'],
      description: 'Filter by status',
    }),
    ApiQuery({
      name: 'verified',
      required: false,
      enum: ['yes', 'no'],
      description: 'Filter by verification status',
    }),
    ApiQuery({
      name: 'deleted',
      required: false,
      enum: ['with', 'only'],
      description: 'Filter by deletion status',
    }),
    ApiQuery({
      name: 'dateFrom',
      required: false,
      type: String,
      description: 'Filter from date (ISO string)',
    }),
    ApiQuery({
      name: 'dateTo',
      required: false,
      type: String,
      description: 'Filter to date (ISO string)',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: [
        'name',
        'email',
        'role',
        'lastLoginAt',
        'bannedAt',
        'deletedAt',
        'createdAt',
        'updatedAt',
      ],
      description: 'Sort by field (default: createdAt)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Users successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              users: {
                type: 'array',
                items: USER_SCHEMA_PROPERTIES,
              },
              meta: {
                type: 'object',
                properties: {
                  totalUsers: { type: 'number' },
                  limit: { type: 'number' },
                  page: { type: 'number' },
                  totalPages: { type: 'number' },
                  nextPage: { type: 'number', nullable: true },
                  prevPage: { type: 'number', nullable: true },
                  pageStart: { type: 'number' },
                  hasPrevPage: { type: 'boolean' },
                  hasNextPage: { type: 'boolean' },
                  activeUsers: { type: 'number' },
                  bannedUsers: { type: 'number' },
                  todayRegisteredUsers: { type: 'number' },
                },
              },
            },
            example: {
              success: true,
              message: 'Users successfully retrieved',
              users: [USER_EXAMPLE],
              meta: {
                totalUsers: 100,
                limit: 10,
                page: 1,
                totalPages: 10,
                nextPage: 2,
                prevPage: null,
                pageStart: 1,
                hasPrevPage: false,
                hasNextPage: true,
                activeUsers: 95,
                bannedUsers: 5,
                todayRegisteredUsers: 2,
              },
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiGetUserByAdminDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by identifier (admin)' }),
    ApiParam({
      name: 'identifier',
      required: true,
      type: 'string',
      description: 'User ID OR Slug',
      example: '64d3e2b5f1a2c3d4e5f6g7h8',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully retrieved',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'User successfully retrieved',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User is not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User is not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiUpdateUserByAdminDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user (admin)' }),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      description: 'User ID',
      example: '64d3e2b5f1a2c3d4e5f6g7h8',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mobile: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
          emailVerified: { type: 'boolean' },
          banned: { type: 'boolean' },
          banReason: { type: 'string' },
        },
        example: {
          name: 'John Doe',
          mobile: '+1234567890',
          role: 'user',
          emailVerified: true,
          banned: false,
          banReason: null,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'User updated successfully',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User is not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User is not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiRestoreUserByAdminDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Restore soft-deleted user (admin)' }),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      description: 'User ID',
      example: '64d3e2b5f1a2c3d4e5f6g7h8',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User restored successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
              user: USER_SCHEMA_PROPERTIES,
            },
            example: {
              success: true,
              message: 'User restored successfully',
              user: USER_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'This user was not deleted',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'This user was not deleted',
              statusCode: HttpStatus.CONFLICT,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiDeleteUserByAdminDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft-delete user (admin)' }),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      description: 'User ID',
      example: '64d3e2b5f1a2c3d4e5f6g7h8',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'User deleted successfully, the user can restore it within 90 days',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message:
                'User deleted successfully, the user can restore it within 90 days',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found',
              statusCode: HttpStatus.BAD_REQUEST,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'User already deleted',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User already deleted',
              statusCode: HttpStatus.CONFLICT,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiPermanentDeleteUserByAdminDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Permanently delete user (admin)' }),
    ApiParam({
      name: 'id',
      required: true,
      type: 'string',
      description: 'User ID',
      example: '64d3e2b5f1a2c3d4e5f6g7h8',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User permanently deleted successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'true' },
              message: { type: 'string' },
            },
            example: {
              success: true,
              message: 'User permanently deleted successfully',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'false' },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              timestamp: { type: 'string' },
            },
            example: {
              success: false,
              message: 'User not found',
              statusCode: HttpStatus.NOT_FOUND,
              timestamp: TIMESTAMP_EXAMPLE,
            },
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}
